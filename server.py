from __future__ import annotations

import copy
import hashlib
import hmac
import json
import math
import os
import re
import secrets
import tempfile
import threading
import time
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from urllib.parse import urlsplit

import storage

ROOT = Path(__file__).resolve().parent
PLAYER_TTL_SECONDS = 20
MAX_REQUEST_BYTES = 2_000_000
MAX_SAVE_BYTES = 10_000_000
WORLD_SAVE_INTERVAL_SECONDS = 1
STATE_LOCK = threading.RLock()
PLAYERS: dict[str, dict] = {}
WORLDS: dict[str, dict] = {}
WORLD_OWNERS: dict[str, str] = {}
SPACE_OWNER_ID = ""
SPACE_WORLD = {"drones": [], "projectiles": []}
SPACE_HIT_EVENT_RESULTS: dict[str, dict] = {}
MAX_SPACE_DRONES = 100
MAX_SPACE_PROJECTILES = 500
SPACE_HIT_EVENT_TTL_SECONDS = 30
DATA_DIR = Path(os.environ.get("SPACEHEAVEN_DATA_DIR", ROOT / "data"))
ACCOUNTS_FILE = DATA_DIR / "accounts.json"
SAVES_FILE = DATA_DIR / "saves.json"
WORLDS_FILE = DATA_DIR / "worlds.json"
ACTIVITY_FILE = DATA_DIR / "activity.json"
AUTH_LOCK = threading.RLock()
SAVE_LOCK = threading.RLock()
ACTIVITY_LOCK = threading.RLock()
WORLDS_DIRTY = False
WORLDS_LAST_SAVED_AT = 0.0
PASSWORD_ITERATIONS = 310_000

DATABASE_ENABLED = storage.initialize()


def load_accounts() -> dict:
    if DATABASE_ENABLED:
        return storage.load_accounts()
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
    if DATABASE_ENABLED:
        storage.save_accounts(data)
        return
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


def load_game_saves() -> dict:
    if DATABASE_ENABLED:
        return storage.load_game_saves()
    try:
        data = json.loads(SAVES_FILE.read_text(encoding="utf-8"))
        if isinstance(data, dict):
            return data
    except FileNotFoundError:
        pass
    except json.JSONDecodeError as error:
        raise RuntimeError(f"El archivo de partidas guardadas no es JSON válido: {SAVES_FILE}") from error
    return {}


def save_game_saves(data: dict) -> None:
    if DATABASE_ENABLED:
        for account_id, state in data.items():
            storage.save_game(account_id, state)
        return
    DATA_DIR.mkdir(parents=True, exist_ok=True)
    fd, temp_name = tempfile.mkstemp(prefix="saves-", suffix=".tmp", dir=DATA_DIR)
    try:
        with os.fdopen(fd, "w", encoding="utf-8") as stream:
            json.dump(data, stream, ensure_ascii=False, separators=(",", ":"))
            stream.flush()
            os.fsync(stream.fileno())
        os.replace(temp_name, SAVES_FILE)
    finally:
        if os.path.exists(temp_name):
            os.unlink(temp_name)


def load_shared_worlds() -> dict:
    if DATABASE_ENABLED:
        return storage.load_worlds()
    try:
        data = json.loads(WORLDS_FILE.read_text(encoding="utf-8"))
    except FileNotFoundError:
        return {}
    except json.JSONDecodeError as error:
        raise RuntimeError(f"El archivo de mundos compartidos no es JSON válido: {WORLDS_FILE}") from error
    if not isinstance(data, dict) or data.get("schema_version") != 1 or not isinstance(data.get("worlds"), dict):
        raise RuntimeError(f"El archivo de mundos compartidos tiene un formato no válido: {WORLDS_FILE}")
    return {
        key: world for key, world in data["worlds"].items()
        if isinstance(key, str) and isinstance(world, dict)
    }


def save_shared_worlds(now: float, force: bool = False) -> None:
    global WORLDS_DIRTY, WORLDS_LAST_SAVED_AT
    if not WORLDS_DIRTY or (not force and now - WORLDS_LAST_SAVED_AT < WORLD_SAVE_INTERVAL_SECONDS):
        return
    if DATABASE_ENABLED:
        storage.save_worlds(WORLDS, now)
        WORLDS_DIRTY = False
        WORLDS_LAST_SAVED_AT = now
        return
    DATA_DIR.mkdir(parents=True, exist_ok=True)
    fd, temp_name = tempfile.mkstemp(prefix="worlds-", suffix=".tmp", dir=DATA_DIR)
    try:
        with os.fdopen(fd, "w", encoding="utf-8") as stream:
            json.dump(
                {"schema_version": 1, "worlds": WORLDS},
                stream,
                ensure_ascii=False,
                separators=(",", ":"),
            )
            stream.flush()
            os.fsync(stream.fileno())
        os.replace(temp_name, WORLDS_FILE)
        WORLDS_DIRTY = False
        WORLDS_LAST_SAVED_AT = now
    finally:
        if os.path.exists(temp_name):
            os.unlink(temp_name)


def public_world(world: dict) -> dict:
    return {key: value for key, value in world.items() if key != "_collectedPickupIds"}


def is_server_admin(account: dict) -> bool:
    configured_usernames = os.environ.get("ADMIN_USERNAMES", "")
    if not configured_usernames.strip() and os.environ.get("RENDER", "").lower() == "true":
        configured_usernames = "lukthak"
    allowed_usernames = {
        username.strip().casefold()
        for username in configured_usernames.split(",")
        if username.strip()
    }
    return account["username"].casefold() in allowed_usernames


def record_activity(event_type: str, account_id: str | None, username: str) -> None:
    occurred_at = time.time()
    if DATABASE_ENABLED:
        storage.record_event(event_type, account_id, username, occurred_at)
        return

    with ACTIVITY_LOCK:
        try:
            events = json.loads(ACTIVITY_FILE.read_text(encoding="utf-8"))
            if not isinstance(events, list):
                raise RuntimeError(f"El archivo de actividad tiene un formato no válido: {ACTIVITY_FILE}")
        except FileNotFoundError:
            events = []
        except json.JSONDecodeError as error:
            raise RuntimeError(f"El archivo de actividad no es JSON válido: {ACTIVITY_FILE}") from error
        events.append({
            "event_type": event_type,
            "account_id": account_id,
            "username": username,
            "occurred_at": occurred_at,
        })
        events = events[-5000:]
        DATA_DIR.mkdir(parents=True, exist_ok=True)
        fd, temp_name = tempfile.mkstemp(prefix="activity-", suffix=".tmp", dir=DATA_DIR)
        try:
            with os.fdopen(fd, "w", encoding="utf-8") as stream:
                json.dump(events, stream, ensure_ascii=False, separators=(",", ":"))
                stream.flush()
                os.fsync(stream.fileno())
            os.replace(temp_name, ACTIVITY_FILE)
        finally:
            if os.path.exists(temp_name):
                os.unlink(temp_name)


def admin_overview() -> dict:
    now = time.time()
    with STATE_LOCK:
        prune_stale_players(now)
        online = [
            {"username": entry["snapshot"].get("name", ""), "scene": entry["snapshot"].get("scene", "")}
            for entry in PLAYERS.values()
        ]

    if DATABASE_ENABLED:
        data = storage.admin_data()
        accounts = [
            {
                "username": row["username"],
                "hasSave": row["saved_at"] is not None,
                "savedAt": row["saved_at"],
            }
            for row in data["accounts"]
        ]
        worlds = [
            {
                "planet": row["planet_key"],
                "updatedAt": row["updated_at"],
                "pickups": (
                    len(row["state"].get("pickups", []))
                    if isinstance(row["state"], dict) and isinstance(row["state"].get("pickups"), list)
                    else 0
                ),
            }
            for row in data["worlds"]
        ]
        events = [
            {
                "event_type": row["event_type"],
                "username": row["username"],
                "occurred_at": row["occurred_at"],
            }
            for row in data["events"]
        ]
    else:
        accounts = [
            {
                "username": account["username"],
                "hasSave": account["id"] in GAME_SAVES,
                "savedAt": GAME_SAVES.get(account["id"], {}).get("savedAt"),
            }
            for account in ACCOUNTS["accounts"]
        ]
        worlds = [
            {
                "planet": planet,
                "updatedAt": None,
                "pickups": len(world.get("pickups", [])) if isinstance(world.get("pickups"), list) else 0,
            }
            for planet, world in WORLDS.items()
        ]
        try:
            events = json.loads(ACTIVITY_FILE.read_text(encoding="utf-8"))
            if not isinstance(events, list):
                raise RuntimeError(f"El archivo de actividad tiene un formato no válido: {ACTIVITY_FILE}")
        except FileNotFoundError:
            events = []
        except json.JSONDecodeError as error:
            raise RuntimeError(f"El archivo de actividad no es JSON válido: {ACTIVITY_FILE}") from error
        events = [
            {
                "event_type": event["event_type"],
                "username": event["username"],
                "occurred_at": event["occurred_at"],
            }
            for event in reversed(events[-100:])
        ]

    return {
        "counts": {
            "accounts": len(accounts),
            "saves": sum(account["hasSave"] for account in accounts),
            "worlds": len(worlds),
            "online": len(online),
        },
        "accounts": accounts,
        "worlds": worlds,
        "online": online,
        "events": events,
        "storage": "postgresql" if DATABASE_ENABLED else "json",
    }


ACCOUNTS = load_accounts()
GAME_SAVES = load_game_saves()
WORLDS.update(load_shared_worlds())
if not DATABASE_ENABLED and ACCOUNTS_FILE.exists():
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
    token_hash = hashlib.sha256(token.encode()).hexdigest()
    expires_at = time.time() + 30 * 24 * 60 * 60
    ACCOUNTS["sessions"][token_hash] = {"user_id": account["id"], "expires_at": expires_at}
    if DATABASE_ENABLED:
        storage.save_session(token_hash, account["id"], expires_at)
    else:
        save_accounts(ACCOUNTS)
    record_activity("login", account["id"], account["username"])
    return {"token": token, "user": public_user(account)}


def authenticated_user(handler) -> dict | None:
    authorization = handler.headers.get("Authorization", "")
    if not authorization.startswith("Bearer "):
        return None
    token_hash = hashlib.sha256(authorization[7:].encode()).hexdigest()
    if DATABASE_ENABLED:
        return storage.authenticated_user(token_hash, time.time())
    with AUTH_LOCK:
        session = ACCOUNTS["sessions"].get(token_hash)
        if not session or session.get("expires_at", 0) < time.time():
            return None
        return next((a for a in ACCOUNTS["accounts"] if a["id"] == session.get("user_id")), None)


def public_player_snapshot(snapshot: dict) -> dict:
    # Estos datos de estado compartido se envían una sola vez en `worlds`, no dentro de cada jugador.
    return {key: value for key, value in snapshot.items() if key not in ("surfaceWorld", "collectedPickupIds")}


def refresh_space_owner() -> None:
    global SPACE_OWNER_ID
    owner = PLAYERS.get(SPACE_OWNER_ID)
    if owner and owner["snapshot"].get("scene") == "space":
        return
    SPACE_OWNER_ID = next((
        player_id for player_id, entry in PLAYERS.items()
        if entry["snapshot"].get("scene") == "space"
    ), "")


def sanitize_space_entities(value: object, kind: str) -> list[dict] | None:
    if not isinstance(value, list):
        return None
    if kind == "drone":
        allowed = {
            "id", "x", "y", "velocityX", "velocityY", "stats", "hp", "fuel", "fuelStacks",
            "propulsionDistance", "abilityDecisionTimer", "propulsionAbilityReadyAt",
            "propulsionBoost", "centerAbilityReadyAt", "centerHomingUntil", "centerHomingAttacks",
            "fireTimer", "angle", "shipParts", "targetPlayerId", "muzzleFlashUntil", "muzzleFlashShape",
        }
        max_count = MAX_SPACE_DRONES
        required_numbers = ("x", "y", "velocityX", "velocityY", "hp", "angle")
    else:
        allowed = {
            "id", "x", "y", "vx", "vy", "damage", "life", "homingTargetId", "homingUntil",
        }
        max_count = MAX_SPACE_PROJECTILES
        required_numbers = ("x", "y", "vx", "vy", "damage", "life")

    entities = []
    seen_ids = set()
    for item in value[:max_count]:
        if not isinstance(item, dict):
            continue
        entity_id = item.get("id")
        if not isinstance(entity_id, str) or not entity_id or len(entity_id) > 128 or entity_id in seen_ids:
            continue
        clean = {key: item[key] for key in allowed if key in item}
        if any(
            isinstance(clean.get(key), bool)
            or not isinstance(clean.get(key), (int, float))
            or not math.isfinite(clean[key])
            for key in required_numbers
        ):
            continue
        if kind == "drone" and (
            not isinstance(clean.get("stats"), dict) or not isinstance(clean.get("shipParts"), dict)
        ):
            continue
        try:
            if len(json.dumps(clean, allow_nan=False)) > 20_000:
                continue
        except (TypeError, ValueError):
            continue
        seen_ids.add(entity_id)
        entities.append(clean)
    return entities


def update_space_world(snapshot: dict, player_id: str, now: float) -> list[dict]:
    global SPACE_WORLD
    results = []
    if snapshot.get("scene") != "space":
        return results

    if player_id == SPACE_OWNER_ID:
        incoming = snapshot.get("spaceWorld")
        if isinstance(incoming, dict):
            drones = sanitize_space_entities(incoming.get("drones"), "drone")
            projectiles = sanitize_space_entities(incoming.get("projectiles"), "projectile")
            if drones is not None and projectiles is not None:
                previous_drones = {drone["id"]: drone for drone in SPACE_WORLD["drones"]}
                for drone in drones:
                    previous = previous_drones.get(drone["id"])
                    if previous:
                        drone["hp"] = min(drone["hp"], previous["hp"])
                SPACE_WORLD = {"drones": drones, "projectiles": projectiles}

    hit_events = snapshot.get("spaceHitEvents", [])
    for event in hit_events[:64] if isinstance(hit_events, list) else []:
        if not isinstance(event, dict):
            continue
        event_id = event.get("id")
        drone_id = event.get("droneId")
        created_at = event.get("createdAt")
        damage = event.get("damage")
        if isinstance(created_at, (int, float)) and created_at > 100_000_000_000:
            created_at /= 1000
        if (
            not isinstance(event_id, str) or not event_id.startswith(f"{player_id}:") or len(event_id) > 160
            or not isinstance(drone_id, str) or len(drone_id) > 128
            or isinstance(created_at, bool) or not isinstance(created_at, (int, float))
            or now - 10 > created_at or created_at > now + 5
            or isinstance(damage, bool) or not isinstance(damage, (int, float))
            or not math.isfinite(damage) or damage <= 0
        ):
            continue
        previous_result = SPACE_HIT_EVENT_RESULTS.get(event_id)
        if previous_result:
            if previous_result["playerId"] == player_id:
                results.append(previous_result["result"])
            continue

        killed = False
        if player_id != SPACE_OWNER_ID:
            for index, drone in enumerate(SPACE_WORLD["drones"]):
                if drone["id"] != drone_id:
                    continue
                drone["hp"] = max(0, drone["hp"] - min(damage, 1000))
                killed = drone["hp"] <= 0
                if killed:
                    SPACE_WORLD["drones"].pop(index)
                break
        result = {"id": event_id, "killed": killed}
        SPACE_HIT_EVENT_RESULTS[event_id] = {
            "playerId": player_id,
            "createdAt": now,
            "result": result,
        }
        results.append(result)

    for event_id, event in list(SPACE_HIT_EVENT_RESULTS.items()):
        if now - event["createdAt"] > SPACE_HIT_EVENT_TTL_SECONDS:
            SPACE_HIT_EVENT_RESULTS.pop(event_id, None)
    if len(SPACE_HIT_EVENT_RESULTS) > 5000:
        oldest = sorted(
            SPACE_HIT_EVENT_RESULTS.items(),
            key=lambda item: item[1]["createdAt"],
        )[:len(SPACE_HIT_EVENT_RESULTS) - 5000]
        for event_id, _ in oldest:
            SPACE_HIT_EVENT_RESULTS.pop(event_id, None)
    return results


def public_space_world() -> dict:
    return {
        "ownerId": SPACE_OWNER_ID,
        **copy.deepcopy(SPACE_WORLD),
    }


def prune_stale_players(now: float) -> None:
    stale_ids = [
        player_id for player_id, entry in PLAYERS.items()
        if now - entry["seen_at"] > PLAYER_TTL_SECONDS
    ]
    for player_id in stale_ids:
        player = PLAYERS.pop(player_id, None)
        if player:
            record_activity(
                "disconnect",
                player_id,
                str(player["snapshot"].get("name", player_id)),
            )

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
    refresh_space_owner()


class SpaceHeavenHandler(SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=str(ROOT), **kwargs)

    def end_headers(self) -> None:
        path = urlsplit(self.path).path.lower()
        if not path.startswith("/api/") and (
            path in ("/", "/index.html") or path.endswith((".html", ".js", ".css"))
        ):
            self.send_header("Cache-Control", "no-store")
        super().end_headers()

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
            try:
                if DATABASE_ENABLED:
                    storage.healthcheck()
            except storage.DatabaseError:
                self.send_json(503, {"ok": False, "service": "spaceheaven", "storage": "unavailable"})
                return
            self.send_json(200, {"ok": True, "service": "spaceheaven"})
            return
        if parsed.path == "/api/auth/me":
            account = authenticated_user(self)
            if not account:
                self.send_json(401, {"error": "Sesión vencida. Inicia sesión otra vez."})
                return
            self.send_json(200, {"user": public_user(account)})
            return
        if parsed.path == "/api/admin/access":
            account = authenticated_user(self)
            if not account:
                self.send_json(401, {"error": "Inicia sesión para consultar el acceso."})
                return
            self.send_json(200, {"isAdmin": is_server_admin(account)})
            return
        if parsed.path == "/api/admin/overview":
            account = authenticated_user(self)
            if not account:
                self.send_json(401, {"error": "Inicia sesión para ver los datos administrativos."})
                return
            if not is_server_admin(account):
                self.send_json(403, {"error": "No tienes permisos de administrador del servidor."})
                return
            self.send_json(200, admin_overview())
            return
        if parsed.path == "/api/save":
            account = authenticated_user(self)
            if not account:
                self.send_json(401, {"error": "Inicia sesión para recuperar la partida."})
                return
            if DATABASE_ENABLED:
                state = storage.get_game_save(account["id"])
            else:
                with SAVE_LOCK:
                    state = GAME_SAVES.get(account["id"])
            self.send_json(200, {"state": state})
            return
        if parsed.path != "/api/players":
            if not parsed.path.startswith("/api/"):
                requested_path = Path(self.translate_path(parsed.path)).resolve()
                data_path = DATA_DIR.resolve()
                if requested_path == data_path or data_path in requested_path.parents:
                    self.send_error(404)
                    return
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
                "worlds": {key: public_world(world) for key, world in WORLDS.items()},
                "spaceWorld": public_space_world(),
            }
        self.send_json(200, result)

    def do_POST(self) -> None:
        global WORLDS_DIRTY
        route = urlsplit(self.path).path
        if route not in ("/api/players", "/api/save", "/api/auth/register", "/api/auth/login", "/api/auth/logout"):
            self.send_json(404, {"error": "not found"})
            return
        if route == "/api/auth/logout":
            authorization = self.headers.get("Authorization", "")
            account = authenticated_user(self)
            if not account:
                self.send_json(401, {"error": "Sesión vencida. Inicia sesión otra vez."})
                return
            token_hash = hashlib.sha256(authorization[7:].encode()).hexdigest()
            with AUTH_LOCK:
                ACCOUNTS["sessions"].pop(token_hash, None)
                if DATABASE_ENABLED:
                    storage.delete_session(token_hash)
                else:
                    save_accounts(ACCOUNTS)
            with STATE_LOCK:
                player = PLAYERS.pop(account["id"], None)
                if player:
                    record_activity("disconnect", account["id"], account["username"])
                prune_stale_players(time.time())
                save_shared_worlds(time.time(), force=True)
            record_activity("logout", account["id"], account["username"])
            self.send_json(200, {"ok": True})
            return
        try:
            size = int(self.headers.get("Content-Length", "0"))
            max_size = 16_384 if route.startswith("/api/auth/") else (
                MAX_SAVE_BYTES if route == "/api/save" else MAX_REQUEST_BYTES
            )
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
                    account = (
                        storage.find_account_by_username(username)
                        if DATABASE_ENABLED
                        else next((a for a in ACCOUNTS["accounts"] if a["username"].casefold() == username.casefold()), None)
                    )
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
                        if DATABASE_ENABLED:
                            if not storage.save_account(account):
                                self.send_json(409, {"error": "Ese nombre de usuario ya está registrado. Inicia sesión si ya tienes cuenta."})
                                return
                        else:
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

            if route == "/api/save":
                account = authenticated_user(self)
                if not account:
                    self.send_json(401, {"error": "Inicia sesión para guardar la partida."})
                    return
                if (
                    not isinstance(payload, dict)
                    or not isinstance(payload.get("state"), dict)
                    or not isinstance(payload["state"].get("player"), dict)
                    or not isinstance(payload["state"].get("savedAt"), (int, float))
                ):
                    self.send_json(400, {"error": "Formato de partida no válido."})
                    return
                if DATABASE_ENABLED:
                    if not storage.save_game(account["id"], payload["state"]):
                        self.send_json(409, {"error": "Hay una partida más reciente guardada en el servidor."})
                        return
                    GAME_SAVES[account["id"]] = payload["state"]
                else:
                    with SAVE_LOCK:
                        saved_state = GAME_SAVES.get(account["id"])
                        if saved_state and payload["state"]["savedAt"] < saved_state.get("savedAt", 0):
                            self.send_json(409, {"error": "Hay una partida más reciente guardada en el servidor."})
                            return
                        GAME_SAVES[account["id"]] = payload["state"]
                        save_game_saves(GAME_SAVES)
                self.send_json(200, {"ok": True})
                return

            snapshot = payload
            if not isinstance(snapshot, dict):
                self.send_json(400, {"error": "invalid player snapshot"})
                return
            account = authenticated_user(self)
            if not account:
                self.send_json(401, {"error": "Inicia sesión para jugar en línea."})
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
            if player_id not in PLAYERS:
                record_activity("connect", player_id, account["username"])
            PLAYERS[player_id] = {"snapshot": snapshot, "seen_at": now}
            refresh_space_owner()
            space_hit_results = update_space_world(snapshot, player_id, now)
            surface_world = snapshot.get("surfaceWorld")
            planet = str(snapshot.get("planet", "")).strip().lower()
            if snapshot.get("scene") == "surface" and planet and isinstance(surface_world, dict):
                existing_world = WORLDS.get(planet)
                owner_id = WORLD_OWNERS.get(planet)
                newly_assigned_owner = owner_id not in PLAYERS
                if newly_assigned_owner:
                    WORLD_OWNERS[planet] = player_id
                    owner_id = player_id
                is_world_owner = owner_id == player_id
                previous_collected_ids = (
                    existing_world.get("_collectedPickupIds", []) if existing_world else []
                )
                ordered_collected_ids = [
                    pickup_id for pickup_id in previous_collected_ids
                    if isinstance(pickup_id, str)
                ] if isinstance(previous_collected_ids, list) else []
                incoming_collected_ids = surface_world.get("collectedPickupIds", [])
                if isinstance(incoming_collected_ids, list):
                    ordered_collected_ids.extend(
                        pickup_id for pickup_id in incoming_collected_ids
                        if isinstance(pickup_id, str) and len(pickup_id) <= 256
                    )
                ordered_collected_ids = list(dict.fromkeys(ordered_collected_ids))[-20_000:]
                collected_ids = set(ordered_collected_ids)

                if is_world_owner and (not newly_assigned_owner or existing_world is None):
                    shared_world = {
                        key: value for key, value in surface_world.items()
                        if key != "collectedPickupIds"
                    }
                elif existing_world is not None:
                    shared_world = dict(existing_world)
                else:
                    shared_world = {
                        key: value for key, value in surface_world.items()
                        if key != "collectedPickupIds"
                    }

                previous_world = WORLDS.get(planet)
                shared_world["_collectedPickupIds"] = ordered_collected_ids
                if isinstance(shared_world.get("pickups"), list):
                    shared_world["pickups"] = [
                        pickup for pickup in shared_world["pickups"]
                        if isinstance(pickup, dict) and pickup.get("id") not in collected_ids
                    ]
                if shared_world != previous_world:
                    WORLDS[planet] = shared_world
                    WORLDS_DIRTY = True
                save_shared_worlds(now)

            visible_worlds = {
                planet: public_world(WORLDS[planet])
            } if planet in WORLDS else {}
            result = {
                "ok": True,
                "players": [public_player_snapshot(entry["snapshot"]) for peer_id, entry in PLAYERS.items() if peer_id != player_id],
                "worldOwners": dict(WORLD_OWNERS),
                "worlds": visible_worlds,
                "spaceWorld": public_space_world(),
                "spaceHitResults": space_hit_results,
            }
        self.send_json(200, result)


if __name__ == "__main__":
    port = int(os.environ.get("PORT", "8000"))
    server = ThreadingHTTPServer(("0.0.0.0", port), SpaceHeavenHandler)
    print(f"SpaceHeaven escuchando en el puerto {port}", flush=True)
    server.serve_forever()
