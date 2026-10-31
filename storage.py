from __future__ import annotations

import os

DATABASE_URL = os.environ.get("DATABASE_URL", "").strip()
POOL = None
JSONB = None
DatabaseError = RuntimeError


def initialize() -> bool:
    global POOL, JSONB, DatabaseError
    if not DATABASE_URL:
        return False

    try:
        import psycopg
        from psycopg.rows import dict_row
        from psycopg.types.json import Jsonb
        from psycopg_pool import ConnectionPool
    except ImportError as error:
        raise RuntimeError("DATABASE_URL requiere instalar psycopg[binary,pool].") from error

    JSONB = Jsonb
    DatabaseError = psycopg.Error
    POOL = ConnectionPool(
        conninfo=DATABASE_URL,
        min_size=1,
        max_size=8,
        timeout=5,
        kwargs={"row_factory": dict_row},
        open=False,
    )
    POOL.open(wait=True)
    with POOL.connection() as connection:
        with connection.cursor() as cursor:
            cursor.execute("""
                CREATE TABLE IF NOT EXISTS accounts (
                    id TEXT PRIMARY KEY,
                    username TEXT NOT NULL,
                    username_key TEXT NOT NULL UNIQUE,
                    password_salt TEXT NOT NULL,
                    password_hash TEXT NOT NULL
                )
            """)
            cursor.execute("""
                CREATE TABLE IF NOT EXISTS sessions (
                    token_hash TEXT PRIMARY KEY,
                    user_id TEXT NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
                    expires_at DOUBLE PRECISION NOT NULL
                )
            """)
            cursor.execute("""
                CREATE TABLE IF NOT EXISTS game_saves (
                    account_id TEXT PRIMARY KEY REFERENCES accounts(id) ON DELETE CASCADE,
                    state JSONB NOT NULL,
                    saved_at DOUBLE PRECISION NOT NULL
                )
            """)
            cursor.execute("""
                CREATE TABLE IF NOT EXISTS shared_worlds (
                    planet_key TEXT PRIMARY KEY,
                    state JSONB NOT NULL,
                    updated_at DOUBLE PRECISION NOT NULL
                )
            """)
            cursor.execute("""
                CREATE TABLE IF NOT EXISTS server_events (
                    id BIGSERIAL PRIMARY KEY,
                    event_type TEXT NOT NULL,
                    account_id TEXT,
                    username TEXT NOT NULL,
                    occurred_at DOUBLE PRECISION NOT NULL,
                    details JSONB NOT NULL DEFAULT '{}'::jsonb
                )
            """)
            cursor.execute("""
                CREATE INDEX IF NOT EXISTS server_events_occurred_at_idx
                ON server_events (occurred_at DESC)
            """)
    return True


def configured() -> bool:
    return POOL is not None


def _connection():
    if POOL is None:
        raise RuntimeError("PostgreSQL no está configurado.")
    return POOL.connection()


def load_accounts() -> dict:
    with _connection() as connection:
        with connection.cursor() as cursor:
            cursor.execute("SELECT id, username, password_salt, password_hash FROM accounts")
            accounts = cursor.fetchall()
            cursor.execute("SELECT token_hash, user_id, expires_at FROM sessions")
            sessions = cursor.fetchall()
    return {
        "schema_version": 2,
        "accounts": accounts,
        "sessions": {
            row["token_hash"]: {"user_id": row["user_id"], "expires_at": row["expires_at"]}
            for row in sessions
        },
    }


def save_accounts(data: dict) -> None:
    with _connection() as connection:
        with connection.cursor() as cursor:
            for account in data["accounts"]:
                cursor.execute(
                    """
                    INSERT INTO accounts (id, username, username_key, password_salt, password_hash)
                    VALUES (%s, %s, %s, %s, %s)
                    ON CONFLICT (id) DO UPDATE SET
                        username = EXCLUDED.username,
                        username_key = EXCLUDED.username_key,
                        password_salt = EXCLUDED.password_salt,
                        password_hash = EXCLUDED.password_hash
                    """,
                    (
                        account["id"],
                        account["username"],
                        account["username"].casefold(),
                        account["password_salt"],
                        account["password_hash"],
                    ),
                )
            for token_hash, session in data["sessions"].items():
                cursor.execute(
                    """
                    INSERT INTO sessions (token_hash, user_id, expires_at)
                    VALUES (%s, %s, %s)
                    ON CONFLICT (token_hash) DO UPDATE SET
                        user_id = EXCLUDED.user_id,
                        expires_at = EXCLUDED.expires_at
                    """,
                    (token_hash, session["user_id"], session["expires_at"]),
                )


def save_account(account: dict) -> bool:
    with _connection() as connection:
        with connection.cursor() as cursor:
            cursor.execute(
                """
                INSERT INTO accounts (id, username, username_key, password_salt, password_hash)
                VALUES (%s, %s, %s, %s, %s)
                ON CONFLICT (username_key) DO NOTHING
                RETURNING id
                """,
                (
                    account["id"],
                    account["username"],
                    account["username"].casefold(),
                    account["password_salt"],
                    account["password_hash"],
                ),
            )
            return cursor.fetchone() is not None


def find_account_by_username(username: str) -> dict | None:
    with _connection() as connection:
        with connection.cursor() as cursor:
            cursor.execute(
                """
                SELECT id, username, password_salt, password_hash
                FROM accounts
                WHERE username_key = %s
                """,
                (username.casefold(),),
            )
            return cursor.fetchone()


def save_session(token_hash: str, user_id: str, expires_at: float) -> None:
    with _connection() as connection:
        with connection.cursor() as cursor:
            cursor.execute(
                """
                INSERT INTO sessions (token_hash, user_id, expires_at)
                VALUES (%s, %s, %s)
                ON CONFLICT (token_hash) DO UPDATE SET
                    user_id = EXCLUDED.user_id,
                    expires_at = EXCLUDED.expires_at
                """,
                (token_hash, user_id, expires_at),
            )


def delete_session(token_hash: str) -> None:
    with _connection() as connection:
        with connection.cursor() as cursor:
            cursor.execute("DELETE FROM sessions WHERE token_hash = %s", (token_hash,))


def authenticated_user(token_hash: str, now: float) -> dict | None:
    with _connection() as connection:
        with connection.cursor() as cursor:
            cursor.execute(
                """
                SELECT accounts.id, accounts.username, accounts.password_salt, accounts.password_hash
                FROM sessions
                JOIN accounts ON accounts.id = sessions.user_id
                WHERE sessions.token_hash = %s AND sessions.expires_at >= %s
                """,
                (token_hash, now),
            )
            return cursor.fetchone()


def get_game_save(account_id: str) -> dict | None:
    with _connection() as connection:
        with connection.cursor() as cursor:
            cursor.execute("SELECT state FROM game_saves WHERE account_id = %s", (account_id,))
            row = cursor.fetchone()
    return row["state"] if row else None


def load_game_saves() -> dict:
    with _connection() as connection:
        with connection.cursor() as cursor:
            cursor.execute("SELECT account_id, state FROM game_saves")
            return {row["account_id"]: row["state"] for row in cursor.fetchall()}


def save_game(account_id: str, state: dict) -> bool:
    with _connection() as connection:
        with connection.cursor() as cursor:
            cursor.execute(
                """
                INSERT INTO game_saves (account_id, state, saved_at)
                VALUES (%s, %s, %s)
                ON CONFLICT (account_id) DO UPDATE SET
                    state = EXCLUDED.state,
                    saved_at = EXCLUDED.saved_at
                WHERE game_saves.saved_at <= EXCLUDED.saved_at
                RETURNING account_id
                """,
                (account_id, JSONB(state), state["savedAt"]),
            )
            return cursor.fetchone() is not None


def load_worlds() -> dict:
    with _connection() as connection:
        with connection.cursor() as cursor:
            cursor.execute("SELECT planet_key, state FROM shared_worlds")
            return {row["planet_key"]: row["state"] for row in cursor.fetchall()}


def save_worlds(worlds: dict, now: float) -> None:
    with _connection() as connection:
        with connection.cursor() as cursor:
            for planet_key, state in worlds.items():
                cursor.execute(
                    """
                    INSERT INTO shared_worlds (planet_key, state, updated_at)
                    VALUES (%s, %s, %s)
                    ON CONFLICT (planet_key) DO UPDATE SET
                        state = EXCLUDED.state,
                        updated_at = EXCLUDED.updated_at
                    """,
                    (planet_key, JSONB(state), now),
                )


def healthcheck() -> None:
    with _connection() as connection:
        with connection.cursor() as cursor:
            cursor.execute("SELECT 1")


def record_event(event_type: str, account_id: str | None, username: str, occurred_at: float) -> None:
    with _connection() as connection:
        with connection.cursor() as cursor:
            cursor.execute(
                """
                INSERT INTO server_events (event_type, account_id, username, occurred_at)
                VALUES (%s, %s, %s, %s)
                """,
                (event_type, account_id, username, occurred_at),
            )


def admin_data() -> dict:
    with _connection() as connection:
        with connection.cursor() as cursor:
            cursor.execute("""
                SELECT accounts.id, accounts.username, game_saves.saved_at
                FROM accounts
                LEFT JOIN game_saves ON game_saves.account_id = accounts.id
                ORDER BY accounts.username_key
            """)
            accounts = cursor.fetchall()
            cursor.execute("""
                SELECT planet_key, state, updated_at
                FROM shared_worlds
                ORDER BY planet_key
            """)
            worlds = cursor.fetchall()
            cursor.execute("""
                SELECT event_type, account_id, username, occurred_at
                FROM server_events
                ORDER BY occurred_at DESC, id DESC
                LIMIT 100
            """)
            events = cursor.fetchall()
    return {"accounts": accounts, "worlds": worlds, "events": events}
