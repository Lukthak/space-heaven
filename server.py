from __future__ import annotations

import json
import hashlib
import hmac
import os
import re
import secrets
import tempfile
import threading
import time
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from urllib.parse import parse_qs, urlsplit

ROOT = Path(__file__).resolve().parent
PLAYER_TTL_SECONDS = 20
MAX_REQUEST_BYTES = 2_000_000
STATE_LOCK = threading.RLock()
PLAYERS: dict[str, dict] = {}
WORLDS: dict[str, dict] = {}
WORLD_OWNERS: dict[str, str] = {}
DATA_DIR = Path(os.environ.get("SPACEHEAVEN_DATA_DIR", ROOT / "data"))
ACCOUNTS_FILE = DATA_DIR / "accounts.json"
AUTH_LOCK = threading.RLock()
PASSWORD_ITERATIONS = 310_000


def load_accounts() -> dict:
    try:
        data = json.loads(ACCOUNTS_FILE.read_text(encoding="utf-8"))
        if (
            isinstance(data, dict)
            and data.get("schema_version") == 2
            and isinstance(data.get("accounts"), list)
            and isinstance(data.get("sessions"), dict)
        ):
            data.setdefault("sessions", {})
            return data
    except (OSError, json.JSONDecodeError):
        pass
    return {"schema_version": 2, "accounts": [], "sessions": {}}


def save_accounts(data: dict) -> None:
    data["schema_version"] = 2
    DATA_DIR.mkdir(parents=True, exist_ok=True)
    fd, temp_name = tempfile.mkstemp(prefix="accounts-", suffix=".tmp", dir=DATA_DIR)
    try:
        with os.fdopen(fd, "w", encoding="utf-8") as stream:
            json.dump(data, stream, ensure_ascii=False, separators=(",", ":"))
            stream.flush()
            os.fsync(stream.fileno())
        os.replace(temp_name, ACCOUNTS_FILE)
    finally:
        if os.path.exists(temp_name):
            os.unlink(temp_name)


ACCOUNTS = load_accounts()
if ACCOUNTS_FILE.exists():
    try:
        saved_accounts = json.loads(ACCOUNTS_FILE.read_text(encoding="utf-8"))
        if not isinstance(saved_accounts, dict) or saved_accounts.get("schema_version") != 2:
            save_accounts(ACCOUNTS)
    except (OSError, json.JSONDecodeError):
        save_accounts(ACCOUNTS)


def hash_password(password: str, salt: bytes | None = None) -> tuple[str, str]:
    salt = salt or secrets.token_bytes(16)
    digest = hashlib.pbkdf2_hmac("sha256", password.encode("utf-8"), salt, PASSWORD_ITERATIONS)
    return salt.hex(), digest.hex()


def public_user(account: dict) -> dict:
    return {"id": account["id"], "username": account["username"]}


def create_session(account: dict) -> dict:
    token = secrets.token_urlsafe(32)
    ACCOUNTS["sessions"][hashlib.sha256(token.encode()).hexdigest()] = {
        "user_id": account["id"], "expires_at": time.time() + 30 * 24 * 60 * 60,
    }
    save_accounts(ACCOUNTS)
    return {"token": token, "user": public_user(account)}


def authenticated_user(handler) -> dict | None:
    authorization = handler.headers.get("Authorization", "")
    if not authorization.startswith("Bearer "):
        return None
    token_hash = hashlib.sha256(authorization[7:].encode()).hexdigest()
    with AUTH_LOCK:
        session = ACCOUNTS["sessions"].get(token_hash)
        if not session or session.get("expires_at", 0) < time.time():
            return None
        return next((a for a in ACCOUNTS["accounts"] if a["id"] == session.get("user_id")), None)


def public_player_snapshot(snapshot: dict) -> dict:
    # Estos datos de estado compartido se envían una sola vez en `worlds`, no dentro de cada jugador.
    return {key: value for key, value in snapshot.items() if key not in ("surfaceWorld", "collectedPickupIds")}


def prune_stale_players(now: float) -> None:
    stale_ids = [
        player_id for player_id, entry in PLAYERS.items()
        if now - entry["seen_at"] > PLAYER_TTL_SECONDS
    ]
    for player_id in stale_ids:
        PLAYERS.pop(player_id, None)

    for world_key, owner_id in list(WORLD_OWNERS.items()):
        owner = PLAYERS.get(owner_id)
        owner_snapshot = owner["snapshot"] if owner else None
        still_owns_world = (
            owner_snapshot
            and owner_snapshot.get("scene") == "surface"
            and str(owner_snapshot.get("planet", "")).strip().lower() == world_key
        )
        if still_owns_world:
            continue

        replacement = next((
            player_id for player_id, entry in PLAYERS.items()
            if entry["snapshot"].get("scene") == "surface"
            and str(entry["snapshot"].get("planet", "")).strip().lower() == world_key
        ), None)
        if replacement:
            WORLD_OWNERS[world_key] = replacement
        else:
            WORLD_OWNERS.pop(world_key, None)


class SpaceHeavenHandler(SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=str(ROOT), **kwargs)

    def log_message(self, format_string, *args):
        if not self.path.startswith(("/api/players", "/api/auth")):
            super().log_message(format_string, *args)

    def send_json(self, status: int, data: object) -> None:
        body = json.dumps(data, separators=(",", ":"), ensure_ascii=False).encode("utf-8")
        self.send_response(status)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Content-Length", str(len(body)))
        self.send_header("Cache-Control", "no-store")
        self.send_header("X-Content-Type-Options", "nosniff")
        self.end_headers()
        self.wfile.write(body)

    def do_GET(self) -> None:
        parsed = urlsplit(self.path)
        if parsed.path == "/api/health":
            self.send_json(200, {"ok": True, "service": "spaceheaven"})
            return
        if parsed.path == "/api/auth/me":
            account = authenticated_user(self)
            if not account:
                self.send_json(401, {"error": "Sesión vencida. Inicia sesión otra vez."})
                return
            self.send_json(200, {"user": public_user(account)})
            return
        if parsed.path != "/api/players":
            return super().do_GET()

        account = authenticated_user(self)
        if not account:
            self.send_json(401, {"error": "Inicia sesión para jugar en línea."})
            return
        self_id = account["id"]
        now = time.time()
        with STATE_LOCK:
            prune_stale_players(now)
            players = [
                public_player_snapshot(entry["snapshot"]) for player_id, entry in PLAYERS.items()
                if player_id != self_id
            ]
            result = {
                "players": players,
                "worldOwners": dict(WORLD_OWNERS),
                "worlds": WORLDS,
            }
        self.send_json(200, result)

    def do_POST(self) -> None:
        route = urlsplit(self.path).path
        if route not in ("/api/players", "/api/auth/register", "/api/auth/login"):
            self.send_json(404, {"error": "not found"})
            return
        try:
            size = int(self.headers.get("Content-Length", "0"))
            max_size = 16_384 if route.startswith("/api/auth/") else MAX_REQUEST_BYTES
            if size <= 0 or size > max_size:
                self.send_json(413, {"error": "invalid request size"})
                return
            payload = json.loads(self.rfile.read(size))
            if route.startswith("/api/auth/"):
                if not isinstance(payload, dict):
                    self.send_json(400, {"error": "Datos inválidos."})
                    return
                username = str(payload.get("username", "")).strip()
                password = str(payload.get("password", ""))
                with AUTH_LOCK:
                    account = next((a for a in ACCOUNTS["accounts"] if a["username"].casefold() == username.casefold()), None)
                    if route == "/api/auth/register":
                        if not re.fullmatch(r"[A-Za-z0-9_.-]{3,24}", username):
                            self.send_json(400, {"error": "El usuario debe tener 3 a 24 caracteres: letras, números, punto, guion o _."})
                            return
                        if len(password) < 8 or len(password) > 256:
                            self.send_json(400, {"error": "La contraseña debe tener al menos 8 caracteres."})
                            return
                        if account:
                            self.send_json(409, {"error": "Ese nombre de usuario ya está registrado. Inicia sesión si ya tienes cuenta."})
                            return
                        salt, password_hash = hash_password(password)
                        account = {"id": secrets.token_hex(16), "username": username,
                                   "password_salt": salt, "password_hash": password_hash}
                        ACCOUNTS["accounts"].append(account)
                    else:
                        salt = bytes.fromhex(account["password_salt"]) if account else b"\0" * 16
                        _, attempted = hash_password(password, salt)
                        valid = account is not None and hmac.compare_digest(attempted, account["password_hash"])
                        if not valid:
                            self.send_json(401, {"error": "Usuario o contraseña incorrectos."})
                            return
                    result = create_session(account)
                self.send_json(201 if route.endswith("register") else 200, result)
                return

            account = authenticated_user(self)
            if not account:
                self.send_json(401, {"error": "Inicia sesión para jugar en línea."})
                return
            snapshot = payload
            if not isinstance(snapshot, dict):
                self.send_json(400, {"error": "invalid player snapshot"})
                return
            player_id = account["id"]
            snapshot["id"] = player_id
            snapshot["name"] = account["username"]
        except (ValueError, json.JSONDecodeError):
            self.send_json(400, {"error": "invalid JSON"})
            return

        now = time.time()
        with STATE_LOCK:
            prune_stale_players(now)
            PLAYERS[player_id] = {"snapshot": snapshot, "seen_at": now}
            surface_world = snapshot.get("surfaceWorld")
            planet = str(snapshot.get("planet", "")).strip().lower()
            if snapshot.get("scene") == "surface" and planet and isinstance(surface_world, dict):
                owner_id = WORLD_OWNERS.get(planet)
                if owner_id not in PLAYERS:
                    WORLD_OWNERS[planet] = player_id
                    owner_id = player_id
                if owner_id == player_id:
                    WORLDS[planet] = surface_world
            visible_worlds = {planet: WORLDS[planet]} if planet in WORLDS else {}
            result = {
                "ok": True,
                "players": [public_player_snapshot(entry["snapshot"]) for peer_id, entry in PLAYERS.items() if peer_id != player_id],
                "worldOwners": dict(WORLD_OWNERS),
                "worlds": visible_worlds,
            }
        self.send_json(200, result)


if __name__ == "__main__":
    port = int(os.environ.get("PORT", "8000"))
    server = ThreadingHTTPServer(("0.0.0.0", port), SpaceHeavenHandler)
    print(f"SpaceHeaven escuchando en el puerto {port}", flush=True)
    server.serve_forever()
