from __future__ import annotations

import copy
import hashlib
import hmac
import json
import math
import os
import random
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
MAX_SHARED_PLANET_PICKUPS = 10_000
MAX_SHARED_MARTIAN_ENEMIES = 100
PICKUP_VISIBILITY_RADIUS = 0.12
SURFACE_WORLD_SIZE = 120_000
SURFACE_TILE_SIZE = 32
MARTIAN_ENEMY_ACTIVE_RADIUS = 8 * 1200 / SURFACE_WORLD_SIZE
MARTIAN_ENEMY_SIGHT_RADIUS = 14 * SURFACE_TILE_SIZE / SURFACE_WORLD_SIZE
MARTIAN_ENEMY_ATTACK_RADIUS = 10 * SURFACE_TILE_SIZE / SURFACE_WORLD_SIZE
MARTIAN_ENEMY_SPEED = 145 / SURFACE_WORLD_SIZE
MARTIAN_ENEMY_SPAWN_INTERVAL_SECONDS = 1.5
MARTIAN_PROJECTILE_SPEED = 1440 / SURFACE_WORLD_SIZE
MARTIAN_PROJECTILE_LIFETIME_SECONDS = 4800 / 1440
MAX_SHARED_MARTIAN_PROJECTILES = 500
STATE_LOCK = threading.RLock()
PLAYERS: dict[str, dict] = {}
WORLDS: dict[str, dict] = {}
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
BALANCE_FILE = DATA_DIR / "balance.json"
AUTH_LOCK = threading.RLock()
SAVE_LOCK = threading.RLock()
ACTIVITY_LOCK = threading.RLock()
BALANCE_LOCK = threading.RLock()
WORLDS_DIRTY = False
WORLDS_LAST_SAVED_AT = 0.0
PASSWORD_ITERATIONS = 310_000

BALANCE_FIELD_DEFINITIONS = []


def define_balance_field(field_id: str, category: str, label: str, default: int | float,
                         minimum: int | float, maximum: int | float, step: int | float,
                         unit: str) -> None:
    BALANCE_FIELD_DEFINITIONS.append({
        "id": field_id,
        "category": category,
        "label": label,
        "default": default,
        "min": minimum,
        "max": maximum,
        "step": step,
        "unit": unit,
    })


for resource_id, resource_name, price in (
    ("metal", "Metal", 15), ("crystal", "Cristal", 28), ("fuel", "Combustible", 20),
    ("energy", "Energía", 5), ("titanium", "Titanio", 42), ("cobalt", "Cobalto", 36),
    ("ammonia", "Amoniaco", 24), ("lithium", "Litio", 48), ("silicate", "Silicato", 31),
    ("xenon", "Xenón", 58), ("uranium", "Uranio", 72), ("iridium", "Iridio", 95),
    ("deuterium", "Deuterio", 84), ("graphene", "Grafeno", 110), ("neodymium", "Neodimio", 125),
    ("methane", "Metano", 40), ("regolith", "Regolito", 8),
):
    define_balance_field(f"resource.{resource_id}.price", "Precios de recursos",
                         f"{resource_name} · valor base", price, 0, 1_000_000, 1, "créditos")

for part_id, part_name, price, health in (
    ("center-classic", "Centro clásico", 180, 120),
    ("center-reinforced", "Centro reforzado", 520, 220),
    ("thruster-electric", "Propulsor eléctrico", 300, 85),
    ("thruster-fuel", "Propulsor de combustible", 450, 85),
    ("thruster-ammonia", "Propulsor de amoniaco", 900, 110),
    ("wing-fast", "Alas rápidas", 220, 60),
    ("wing-solar", "Paneles solares", 380, 60),
    ("wing-titanium", "Alas de titanio", 480, 100),
    ("wing-graphene", "Alas de grafeno", 1500, 140),
    ("tip-sonic", "Punta sónica", 160, 50),
    ("tip-rudimentaria", "Punta rudimentaria", 130, 75),
    ("tip-cobalt", "Punta de cobalto", 600, 80),
    ("tip-plasma", "Punta de plasma", 1400, 95),
):
    define_balance_field(f"part.{part_id}.price", "Piezas de nave",
                         f"{part_name} · precio", price, 0, 1_000_000, 1, "créditos")
    define_balance_field(f"part.{part_id}.health", "Piezas de nave",
                         f"{part_name} · vida", health, 1, 100_000, 1, "HP base")

for part_id, part_name, damage, cooldown in (
    ("tip-sonic", "Punta sónica", 16, 0.38),
    ("tip-rudimentaria", "Punta rudimentaria", 5, 0.24),
    ("tip-cobalt", "Punta de cobalto", 24, 0.32),
    ("tip-plasma", "Punta de plasma", 42, 0.3),
):
    define_balance_field(f"part.{part_id}.weaponDamage", "Armas espaciales",
                         f"{part_name} · daño", damage, 0, 10_000, 1, "daño")
    define_balance_field(f"part.{part_id}.weaponCooldown", "Armas espaciales",
                         f"{part_name} · tiempo entre disparos", cooldown, 0.05, 60, 0.01, "segundos")

for item_id, item_name, price in (
    ("merchant-fuel", "Combustible", 30),
    ("merchant-energy", "Energía", 10),
    ("radar", "Radar", 750),
    ("regolito-gun", "Pistola de regolito", 400),
):
    define_balance_field(f"merchant.{item_id}.price", "Tienda",
                         f"{item_name} · precio de compra", price, 0, 1_000_000, 1, "créditos")

define_balance_field("economy.resourceBuyFactor", "Economía", "Factor de compra de recursos",
                     0.5, 0, 10, 0.01, "multiplicador")
define_balance_field("item.regolito-gun.damage", "Armas de superficie",
                     "Pistola de regolito · daño", 1, 0, 10_000, 1, "daño")
define_balance_field("item.cobalto-knife.damage", "Armas de superficie",
                     "Cuchillo de cobalto · daño", 1, 0, 10_000, 1, "daño")
define_balance_field("item.regolito-gun.sellPrice", "Venta de objetos",
                     "Pistola de regolito · precio de venta", 100, 0, 1_000_000, 1, "créditos")
define_balance_field("item.hoverboard-board.sellPrice", "Venta de objetos",
                     "Hoverboard · precio de venta", 2000, 0, 1_000_000, 1, "créditos")
define_balance_field("item.enemy-detector.sellPrice", "Venta de objetos",
                     "Detector de enemigos · precio de venta", 125, 0, 1_000_000, 1, "créditos")
BALANCE_DEFAULTS = {field["id"]: field["default"] for field in BALANCE_FIELD_DEFINITIONS}

DATABASE_ENABLED = storage.initialize()


def validate_balance_values(values: object, require_all: bool) -> dict:
    if not isinstance(values, dict):
        raise ValueError("La configuración de balance debe ser un objeto.")
    definitions = {field["id"]: field for field in BALANCE_FIELD_DEFINITIONS}
    unknown_fields = set(values) - definitions.keys()
    if unknown_fields:
        raise ValueError("La configuración contiene campos no permitidos.")
    if require_all and set(values) != definitions.keys():
        raise ValueError("La configuración debe incluir todos los campos.")
    validated = dict(BALANCE_DEFAULTS)
    for field_id, value in values.items():
        field = definitions[field_id]
        if (
            isinstance(value, bool)
            or not isinstance(value, (int, float))
            or not math.isfinite(value)
            or value < field["min"]
            or value > field["max"]
        ):
            raise ValueError(f"El valor de «{field['label']}» está fuera de los límites permitidos.")
        steps = (value - field["min"]) / field["step"]
        if abs(steps - round(steps)) > 1e-7:
            raise ValueError(f"El valor de «{field['label']}» no coincide con el incremento permitido.")
        validated[field_id] = value
    return validated


def load_balance_settings() -> dict:
    if DATABASE_ENABLED:
        stored = storage.load_game_setting("balance")
    else:
        try:
            stored = json.loads(BALANCE_FILE.read_text(encoding="utf-8"))
        except FileNotFoundError:
            stored = None
        except json.JSONDecodeError as error:
            raise RuntimeError(f"El archivo de balance no es JSON válido: {BALANCE_FILE}") from error
    if stored is None:
        return dict(BALANCE_DEFAULTS)
    try:
        return validate_balance_values(stored, require_all=False)
    except ValueError as error:
        raise RuntimeError(f"La configuración de balance guardada no es válida: {error}") from error


def save_balance_settings(values: dict) -> None:
    now = time.time()
    if DATABASE_ENABLED:
        storage.save_game_setting("balance", values, now)
        return
    DATA_DIR.mkdir(parents=True, exist_ok=True)
    fd, temp_name = tempfile.mkstemp(prefix="balance-", suffix=".tmp", dir=DATA_DIR)
    try:
        with os.fdopen(fd, "w", encoding="utf-8") as stream:
            json.dump(values, stream, ensure_ascii=False, separators=(",", ":"), allow_nan=False)
            stream.flush()
            os.fsync(stream.fileno())
        os.replace(temp_name, BALANCE_FILE)
    finally:
        if os.path.exists(temp_name):
            os.unlink(temp_name)


def public_balance() -> dict:
    with BALANCE_LOCK:
        return dict(BALANCE_SETTINGS)


def admin_balance_payload() -> dict:
    values = public_balance()
    return {
        "fields": [
            {**field, "value": values[field["id"]]}
            for field in BALANCE_FIELD_DEFINITIONS
        ],
        "values": values,
    }


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


def sanitize_shared_pickups(pickups: object) -> list[dict]:
    if not isinstance(pickups, list):
        return []
    sanitized = []
    for pickup in pickups:
        if not isinstance(pickup, dict):
            continue
        pickup_id = pickup.get("id")
        resource_key = pickup.get("resourceKey")
        count = pickup.get("count")
        x = pickup.get("x")
        y = pickup.get("y")
        if (
            not isinstance(pickup_id, str)
            or not pickup_id
            or len(pickup_id) > 256
            or not isinstance(resource_key, str)
            or len(resource_key) > 64
            or not isinstance(count, int)
            or isinstance(count, bool)
            or not 1 <= count <= 32
            or not isinstance(x, (int, float))
            or isinstance(x, bool)
            or not math.isfinite(x)
            or not 0 <= x <= 1
            or not isinstance(y, (int, float))
            or isinstance(y, bool)
            or not math.isfinite(y)
            or not 0 <= y <= 1
        ):
            continue
        sanitized.append({
            "id": pickup_id,
            "resourceKey": resource_key,
            "count": count,
            "x": x,
            "y": y,
        })
        if len(sanitized) >= MAX_SHARED_PLANET_PICKUPS:
            break
    return sanitized


def sanitize_martian_enemy(enemy: object) -> dict | None:
    if not isinstance(enemy, dict):
        return None
    enemy_id = enemy.get("id")
    enemy_type = enemy.get("type")
    x = enemy.get("x")
    y = enemy.get("y")
    hp = enemy.get("hp")
    max_hp = enemy.get("maxHp")
    ammo = enemy.get("ammo")
    max_ammo = enemy.get("maxAmmo")
    if (
        not isinstance(enemy_id, str)
        or not enemy_id
        or len(enemy_id) > 160
        or enemy_type not in ("martian", "lunatic")
        or any(
            not isinstance(value, (int, float))
            or isinstance(value, bool)
            or not math.isfinite(value)
            for value in (x, y, hp, max_hp, ammo, max_ammo)
        )
        or not 0 <= x <= 1
        or not 0 <= y <= 1
        or not 0 <= hp <= 100_000
        or not 1 <= max_hp <= 100_000
        or not 0 <= ammo <= 10_000
        or not 0 <= max_ammo <= 10_000
    ):
        return None
    return {
        "id": enemy_id,
        "type": enemy_type,
        "x": x,
        "y": y,
        "hp": hp,
        "maxHp": max_hp,
        "ammo": ammo,
        "maxAmmo": max_ammo,
        "facing": enemy.get("facing") if enemy.get("facing") in ("up", "down", "left", "right") else "down",
        "animationFrame": enemy.get("animationFrame") if isinstance(enemy.get("animationFrame"), int) else 1,
        "isMoving": enemy.get("isMoving") is True,
        "shotSequence": enemy.get("shotSequence", 0)
        if isinstance(enemy.get("shotSequence", 0), int) and not isinstance(enemy.get("shotSequence", 0), bool)
        else 0,
        "shotAt": enemy.get("shotAt", 0)
        if isinstance(enemy.get("shotAt", 0), (int, float))
        and not isinstance(enemy.get("shotAt", 0), bool)
        and math.isfinite(enemy.get("shotAt", 0))
        else 0,
    }


def surface_delta(target: float, origin: float) -> float:
    delta = (target % 1) - (origin % 1)
    if delta > 0.5:
        delta -= 1
    elif delta < -0.5:
        delta += 1
    return delta


def surface_distance(first_x: float, first_y: float, second_x: float, second_y: float) -> float:
    return math.hypot(surface_delta(first_x, second_x), surface_delta(first_y, second_y))


def surface_segment_distance(
    point_x: float,
    point_y: float,
    start_x: float,
    start_y: float,
    movement_x: float,
    movement_y: float,
) -> float:
    offset_x = surface_delta(point_x, start_x)
    offset_y = surface_delta(point_y, start_y)
    movement_length_squared = movement_x * movement_x + movement_y * movement_y
    progress = 0 if movement_length_squared == 0 else min(
        1,
        max(0, (offset_x * movement_x + offset_y * movement_y) / movement_length_squared),
    )
    return math.hypot(
        offset_x - movement_x * progress,
        offset_y - movement_y * progress,
    )


def surface_players(planet: str) -> list[tuple[str, dict]]:
    return [
        (player_id, entry["snapshot"])
        for player_id, entry in PLAYERS.items()
        if entry["snapshot"].get("scene") == "surface"
        and str(entry["snapshot"].get("planet", "")).strip().lower() == planet
    ]


def update_shared_martian_world(world: dict, planet: str, now: float) -> None:
    players = surface_players(planet)
    active_player_entries = [
        (player_id, snapshot) for player_id, snapshot in players
        if isinstance(snapshot.get("surfaceX"), (int, float))
        and not isinstance(snapshot.get("surfaceX"), bool)
        and isinstance(snapshot.get("surfaceY"), (int, float))
        and not isinstance(snapshot.get("surfaceY"), bool)
        and math.isfinite(snapshot["surfaceX"])
        and math.isfinite(snapshot["surfaceY"])
    ]
    enemies = world.setdefault("_martianEnemies", {})
    projectiles = world.setdefault("_martianProjectiles", {})
    projectile_hits = world.setdefault("_martianProjectileHits", [])
    if not isinstance(enemies, dict):
        enemies = world["_martianEnemies"] = {}
    if not isinstance(projectiles, dict):
        projectiles = world["_martianProjectiles"] = {}
    if not isinstance(projectile_hits, list):
        projectile_hits = world["_martianProjectileHits"] = []
    active_players = [snapshot for _, snapshot in active_player_entries]
    blocked_projectile_ids: set[str] = set()
    player_enemy_counts = [
        (
            snapshot,
            8 if isinstance(snapshot.get("pose"), dict) and snapshot["pose"].get("hoverboard") else (
                6 if planet in ("luna", "moon") else 4
            ),
            sum(
                surface_distance(
                    enemy["x"], enemy["y"], snapshot["surfaceX"], snapshot["surfaceY"]
                ) <= MARTIAN_ENEMY_ACTIVE_RADIUS
                for enemy in enemies.values()
                if isinstance(enemy, dict)
            ),
        )
        for snapshot in active_players
    ]
    terrain_reports: dict[str, dict[str, bool]] = {}
    visibility_reports: dict[str, dict[str, bool]] = {}
    for player_id, player_snapshot in players:
        surface_state = player_snapshot.get("surfaceWorld", {})
        reports = surface_state.get("martianEnemyObstacles", []) if isinstance(surface_state, dict) else []
        if not isinstance(reports, list):
            continue
        for report in reports[:MAX_SHARED_MARTIAN_ENEMIES]:
            if not isinstance(report, dict) or not isinstance(report.get("id"), str):
                continue
            blocked = report.get("blocked")
            if not isinstance(blocked, dict) or any(
                not isinstance(blocked.get(direction), bool)
                for direction in ("up", "right", "down", "left")
            ):
                continue
            known = terrain_reports.setdefault(report["id"], {})
            for direction in ("up", "right", "down", "left"):
                known[direction] = known.get(direction, False) or blocked[direction]
            if isinstance(report.get("canSeePlayer"), bool):
                visibility_reports.setdefault(report["id"], {})[player_id] = report["canSeePlayer"]
        projectile_reports = surface_state.get("martianProjectileObstacles", [])
        if isinstance(projectile_reports, list):
            blocked_projectile_ids.update(
                report["id"]
                for report in projectile_reports[:MAX_SHARED_MARTIAN_PROJECTILES]
                if isinstance(report, dict)
                and isinstance(report.get("id"), str)
                and len(report["id"]) <= 200
                and report.get("blocked") is True
            )
    for enemy_id, blocked in terrain_reports.items():
        enemy = enemies.get(enemy_id)
        if isinstance(enemy, dict):
            enemy["_blockedDirections"] = blocked
            enemy["_blockedDirectionsAt"] = now
            enemy["_visiblePlayers"] = visibility_reports.get(enemy_id, {})

    center, desired_count, nearby_enemy_count = min(
        player_enemy_counts,
        key=lambda item: item[2],
        default=(None, 0, 0),
    )
    if (
        center is not None
        and nearby_enemy_count < desired_count
        and now >= world.get("_nextEnemySpawnAt", 0)
    ):
        angle = random.random() * math.tau
        radius = random.uniform(0.015, 0.04)
        cell_size = SURFACE_TILE_SIZE / SURFACE_WORLD_SIZE
        spawn_x = (center["surfaceX"] + math.cos(angle) * radius) % 1
        spawn_y = (center["surfaceY"] + math.sin(angle) * radius) % 1
        spawn_x = (round(spawn_x / cell_size - 0.5) + 0.5) * cell_size % 1
        spawn_y = (round(spawn_y / cell_size - 0.5) + 0.5) * cell_size % 1
        sequence = world.get("_enemySpawnSequence", 0) + 1
        world["_enemySpawnSequence"] = sequence
        enemy_id = f"{planet}:enemy:{sequence}"
        enemies[enemy_id] = {
            "id": enemy_id,
            "type": "lunatic" if planet in ("luna", "moon") else "martian",
            "x": spawn_x,
            "y": spawn_y,
            "hp": 3,
            "maxHp": 3,
            "ammo": 6,
            "maxAmmo": 6,
            "facing": "down",
            "animationFrame": 1,
            "isMoving": False,
            "_fireCooldown": random.uniform(0.6, 1.4),
            "_wait": 0.2,
            "_lastSimulatedAt": now,
            "_shotSequence": 0,
            "_shotAt": 0,
            "shotSequence": 0,
            "shotAt": 0,
            "_blockedDirections": {},
        }
        world["_nextEnemySpawnAt"] = now + MARTIAN_ENEMY_SPAWN_INTERVAL_SECONDS

    for enemy_id, enemy in list(enemies.items()):
        if not isinstance(enemy, dict) or enemy.get("hp", 0) <= 0:
            enemies.pop(enemy_id, None)
            continue
        candidates = [
            snapshot for snapshot in active_players
            if surface_distance(
                enemy["x"], enemy["y"], snapshot["surfaceX"], snapshot["surfaceY"]
            ) <= MARTIAN_ENEMY_ACTIVE_RADIUS
        ]
        if not candidates:
            if now - enemy.get("_lastNearbyAt", enemy.get("_lastSimulatedAt", now)) > PLAYER_TTL_SECONDS:
                enemies.pop(enemy_id, None)
            continue
        visible_candidates = [
            snapshot for snapshot in candidates
            if enemy.get("_visiblePlayers", {}).get(snapshot.get("id")) is True
        ]
        target = min(
            visible_candidates or candidates,
            key=lambda snapshot: surface_distance(
                enemy["x"], enemy["y"], snapshot["surfaceX"], snapshot["surfaceY"]
            ),
        )
        enemy["_lastNearbyAt"] = now
        previous_time = enemy.get("_lastSimulatedAt", now)
        elapsed = min(max(now - previous_time, 0), 0.25)
        enemy["_lastSimulatedAt"] = now
        if elapsed <= 0:
            continue
        if now - enemy.get("_blockedDirectionsAt", 0) > 0.5:
            enemy["_blockedDirections"] = {}

        dx = surface_delta(target["surfaceX"], enemy["x"])
        dy = surface_delta(target["surfaceY"], enemy["y"])
        distance = math.hypot(dx, dy)
        aligned = min(abs(dx), abs(dy)) <= SURFACE_TILE_SIZE * 0.6 / SURFACE_WORLD_SIZE
        can_attack = (
            distance <= MARTIAN_ENEMY_ATTACK_RADIUS
            and aligned
            and enemy.get("_visiblePlayers", {}).get(target.get("id")) is True
        )
        enemy["_fireCooldown"] = max(0, enemy.get("_fireCooldown", 0.8) - elapsed)
        if enemy.get("ammo", 0) <= 0:
            if enemy.get("_reloadUntil", 0) <= 0:
                enemy["_reloadUntil"] = now + 4
            elif now >= enemy["_reloadUntil"]:
                enemy["ammo"] = enemy.get("maxAmmo", 6)
                enemy["_reloadUntil"] = 0
        enemy["reloading"] = enemy.get("_reloadUntil", 0) > now
        enemy["isMoving"] = False

        if can_attack and enemy["ammo"] > 0:
            facing = (
                "left" if dx < 0 else "right"
            ) if abs(dx) >= abs(dy) else (
                "up" if dy < 0 else "down"
            )
            enemy["facing"] = facing
            if enemy["_fireCooldown"] <= 0:
                direction = {
                    "up": (0, -1), "right": (1, 0),
                    "down": (0, 1), "left": (-1, 0),
                }[facing]
                projectile_sequence = enemy.get("_shotSequence", 0) + 1
                projectile_id = f"{enemy_id}:shot:{projectile_sequence}"
                offset = 59 / SURFACE_WORLD_SIZE
                projectiles[projectile_id] = {
                    "id": projectile_id,
                    "enemyId": enemy_id,
                    "x": (enemy["x"] + direction[0] * offset) % 1,
                    "y": (enemy["y"] + direction[1] * offset) % 1,
                    "vx": direction[0] * MARTIAN_PROJECTILE_SPEED,
                    "vy": direction[1] * MARTIAN_PROJECTILE_SPEED,
                    "damage": 1,
                    "life": MARTIAN_PROJECTILE_LIFETIME_SECONDS,
                    "_updatedAt": now,
                }
                enemy["ammo"] -= 1
                enemy["_shotSequence"] = projectile_sequence
                enemy["_shotAt"] = now
                enemy["shotSequence"] = projectile_sequence
                enemy["shotAt"] = now
                enemy["_fireCooldown"] = 1.05
                if enemy["ammo"] <= 0:
                    enemy["_reloadUntil"] = now + 4
        elif distance > MARTIAN_ENEMY_SIGHT_RADIUS or not can_attack:
            preferred_axis_x = abs(dx) >= abs(dy)
            directions = (
                [
                    ("right" if dx > 0 else "left", dx, True),
                    ("down" if dy > 0 else "up", dy, False),
                ]
                if preferred_axis_x
                else [
                    ("down" if dy > 0 else "up", dy, False),
                    ("right" if dx > 0 else "left", dx, True),
                ]
            )
            blocked = enemy.get("_blockedDirections", {})
            movement_axis = next(
                (
                    (facing, delta, axis_x)
                    for facing, delta, axis_x in directions
                    if abs(delta) > SURFACE_TILE_SIZE / SURFACE_WORLD_SIZE
                    and blocked.get(facing) is False
                ),
                None,
            )
            if movement_axis:
                facing, delta, axis_x = movement_axis
                enemy["facing"] = facing
                speed = MARTIAN_ENEMY_SPEED * (2 if enemy["type"] == "lunatic" else 1)
                movement = min(speed * elapsed, abs(delta))
                if axis_x:
                    enemy["x"] = (enemy["x"] + math.copysign(movement, delta)) % 1
                else:
                    enemy["y"] = (enemy["y"] + math.copysign(movement, delta)) % 1
                enemy["isMoving"] = movement > 0
        enemy["_updatedAt"] = now

    for projectile_id, projectile in list(projectiles.items()):
        if projectile_id in blocked_projectile_ids:
            projectiles.pop(projectile_id, None)
            continue
        elapsed = min(max(now - projectile.get("_updatedAt", now), 0), 0.25)
        start_x = projectile["x"]
        start_y = projectile["y"]
        movement_x = projectile["vx"] * elapsed
        movement_y = projectile["vy"] * elapsed
        projectile["x"] = (start_x + movement_x) % 1
        projectile["y"] = (start_y + movement_y) % 1
        projectile["life"] -= elapsed
        projectile["_updatedAt"] = now
        hit_player = next(
            (
                (player_id, snapshot) for player_id, snapshot in active_player_entries
                if surface_segment_distance(
                    snapshot["surfaceX"],
                    snapshot["surfaceY"],
                    start_x,
                    start_y,
                    movement_x,
                    movement_y,
                ) <= 16 / SURFACE_WORLD_SIZE
            ),
            None,
        )
        if hit_player:
            player_id, _ = hit_player
            projectile_hits.append({
                "id": projectile_id,
                "playerId": player_id,
                "damage": projectile.get("damage", 1),
                "createdAt": now,
            })
            projectiles.pop(projectile_id, None)
        elif projectile["life"] <= 0:
            projectiles.pop(projectile_id, None)

    world["_martianProjectileHits"] = [
        event for event in projectile_hits
        if isinstance(event, dict) and now - event.get("createdAt", now) <= 10
    ][-500:]
    world["_martianEnemies"] = dict(
        sorted(
            enemies.items(),
            key=lambda item: item[1].get("_updatedAt", item[1].get("_lastSimulatedAt", 0)),
            reverse=True,
        )[:MAX_SHARED_MARTIAN_ENEMIES]
    )
    world["_martianProjectiles"] = dict(
        sorted(
            projectiles.items(),
            key=lambda item: item[1].get("life", 0),
            reverse=True,
        )[:MAX_SHARED_MARTIAN_PROJECTILES]
    )


def public_world(world: dict, snapshot: dict | None = None, player_id: str = "") -> dict:
    public = {key: value for key, value in world.items() if not key.startswith("_")}
    pickups = sanitize_shared_pickups(world.get("pickups", []))
    revision = world.get("_pickupRevision", 0)
    if not isinstance(revision, int) or revision < 0:
        revision = 0
    public["pickupRevision"] = revision
    center_x = snapshot.get("surfaceX", 0.5) if snapshot else 0.5
    center_y = snapshot.get("surfaceY", 0.5) if snapshot else 0.5
    if (
        not isinstance(center_x, (int, float))
        or isinstance(center_x, bool)
        or not math.isfinite(center_x)
    ):
        center_x = 0.5
    if (
        not isinstance(center_y, (int, float))
        or isinstance(center_y, bool)
        or not math.isfinite(center_y)
    ):
        center_y = 0.5
    center_x %= 1
    center_y %= 1
    is_nearby = lambda entity: (
        min(abs(entity["x"] - center_x), 1 - abs(entity["x"] - center_x)) <= PICKUP_VISIBILITY_RADIUS
        and min(abs(entity["y"] - center_y), 1 - abs(entity["y"] - center_y)) <= PICKUP_VISIBILITY_RADIUS
    )
    public["pickups"] = [pickup for pickup in pickups if is_nearby(pickup)]
    enemies = world.get("_martianEnemies", {})
    planet = str(world.get("planet", "")).strip().lower()
    public["martianEnemies"] = [
        {key: value for key, value in enemy.items() if not key.startswith("_")}
        for enemy in enemies.values()
        if isinstance(enemies, dict) and isinstance(enemy, dict) and enemy.get("hp", 0) > 0 and is_nearby(enemy)
    ][:MAX_SHARED_MARTIAN_ENEMIES] if isinstance(enemies, dict) else []
    projectiles = world.get("_martianProjectiles", {})
    public["martianProjectiles"] = [
        {key: value for key, value in projectile.items() if not key.startswith("_")}
        for projectile in projectiles.values()
        if isinstance(projectiles, dict) and isinstance(projectile, dict) and is_nearby(projectile)
    ][:MAX_SHARED_MARTIAN_PROJECTILES] if isinstance(projectiles, dict) else []
    public["martianProjectileHits"] = [
        event for event in world.get("_martianProjectileHits", [])
        if isinstance(event, dict) and event.get("playerId") == player_id
    ]
    return public


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


BALANCE_SETTINGS = load_balance_settings()
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
        if parsed.path == "/api/game-config":
            self.send_json(200, {"balance": public_balance()})
            return
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
        if parsed.path == "/api/admin/balance":
            account = authenticated_user(self)
            if not account:
                self.send_json(401, {"error": "Inicia sesión para consultar el balance."})
                return
            if not is_server_admin(account):
                self.send_json(403, {"error": "Esta cuenta no tiene permisos de administrador del servidor."})
                return
            self.send_json(200, admin_balance_payload())
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
                if parsed.path.casefold() == "/balance":
                    self.path = "/balance.html"
                    return super().do_GET()
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
            self_snapshot = PLAYERS.get(self_id, {}).get("snapshot")
            players = [
                public_player_snapshot(entry["snapshot"]) for player_id, entry in PLAYERS.items()
                if player_id != self_id
            ]
            planet = (
                str(self_snapshot.get("planet", "")).strip().lower()
                if self_snapshot and self_snapshot.get("scene") == "surface"
                else ""
            )
            result = {
                "players": players,
                "worlds": {
                    planet: public_world(WORLDS[planet], self_snapshot, self_id)
                } if planet in WORLDS else {},
                "spaceWorld": public_space_world(),
                "balance": public_balance(),
            }
        self.send_json(200, result)

    def do_POST(self) -> None:
        global WORLDS_DIRTY
        route = urlsplit(self.path).path
        if route not in ("/api/players", "/api/save", "/api/admin/balance",
                         "/api/auth/register", "/api/auth/login", "/api/auth/logout"):
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
                MAX_SAVE_BYTES if route == "/api/save" else (
                    64_000 if route == "/api/admin/balance" else MAX_REQUEST_BYTES
                )
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

            if route == "/api/admin/balance":
                account = authenticated_user(self)
                if not account:
                    self.send_json(401, {"error": "Inicia sesión para guardar el balance."})
                    return
                if not is_server_admin(account):
                    self.send_json(403, {"error": "Esta cuenta no tiene permisos para modificar el balance."})
                    return
                try:
                    values = validate_balance_values(payload.get("values") if isinstance(payload, dict) else None,
                                                     require_all=True)
                except ValueError as error:
                    self.send_json(400, {"error": str(error)})
                    return
                with BALANCE_LOCK:
                    save_balance_settings(values)
                    BALANCE_SETTINGS.clear()
                    BALANCE_SETTINGS.update(values)
                self.send_json(200, {"ok": True, "values": values})
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

                previous_world = WORLDS.get(planet)
                shared_world = dict(existing_world or {})
                for state_key in (
                    "_martianEnemies", "_martianProjectiles", "_martianProjectileHits",
                ):
                    state_value = shared_world.get(state_key)
                    if isinstance(state_value, (dict, list)):
                        shared_world[state_key] = copy.deepcopy(state_value)
                shared_world.update({
                    key: value for key, value in surface_world.items()
                    if key not in (
                        "pickups", "collectedPickupIds", "martianEnemies",
                        "martianProjectiles", "martianEnemyObstacles",
                        "martianProjectileObstacles",
                    )
                    and not key.startswith("_")
                })
                shared_world["planet"] = str(surface_world.get("planet", planet))
                previous_pickups = sanitize_shared_pickups(shared_world.get("pickups", []))
                previous_pickup_revision = (
                    existing_world.get("_pickupRevision", 0)
                    if existing_world and isinstance(existing_world.get("_pickupRevision", 0), int)
                    else 0
                )
                incoming_pickups = surface_world.get("pickups")
                merged_pickups = {pickup["id"]: pickup for pickup in previous_pickups}
                if isinstance(incoming_pickups, list):
                    for pickup in sanitize_shared_pickups(incoming_pickups):
                        if pickup["id"] not in collected_ids:
                            merged_pickups[pickup["id"]] = pickup
                shared_world["pickups"] = [
                    pickup for pickup_id, pickup in merged_pickups.items()
                    if pickup_id not in collected_ids
                ][-MAX_SHARED_PLANET_PICKUPS:]

                shared_world["_collectedPickupIds"] = ordered_collected_ids
                current_pickups = shared_world["pickups"]
                shared_world["_pickupRevision"] = previous_pickup_revision + (current_pickups != previous_pickups)

                dead_enemy_ids = shared_world.get("_deadMartianEnemyIds", [])
                if not isinstance(dead_enemy_ids, list):
                    dead_enemy_ids = []
                dead_enemy_ids = list(dict.fromkeys(
                    enemy_id for enemy_id in dead_enemy_ids
                    if isinstance(enemy_id, str)
                ))[-5000:]
                dead_enemy_set = set(dead_enemy_ids)

                enemy_states = shared_world.get("_martianEnemies", {})
                if not isinstance(enemy_states, dict):
                    enemy_states = {}
                if not enemy_states and isinstance(shared_world.get("martianEnemies"), list):
                    for legacy_enemy in shared_world["martianEnemies"]:
                        clean_enemy = sanitize_martian_enemy(legacy_enemy)
                        if clean_enemy:
                            enemy_states[clean_enemy["id"]] = {
                                **clean_enemy,
                                "_updatedAt": now,
                                "_lastSimulatedAt": now,
                                "_lastNearbyAt": now,
                                "_fireCooldown": 0.8,
                                "_reloadUntil": 0,
                                "_shotSequence": clean_enemy["shotSequence"],
                                "_shotAt": clean_enemy["shotAt"],
                                "_blockedDirections": {},
                            }
                incoming_deaths = surface_world.get("deadMartianEnemyIds", [])
                if isinstance(incoming_deaths, list):
                    for enemy_id in incoming_deaths[:128]:
                        if not isinstance(enemy_id, str) or len(enemy_id) > 160:
                            continue
                        enemy_states.pop(enemy_id, None)
                        if enemy_id not in dead_enemy_set:
                            dead_enemy_ids.append(enemy_id)
                            dead_enemy_set.add(enemy_id)
                incoming_enemies = surface_world.get("martianEnemies")
                if isinstance(incoming_enemies, list):
                    sanitized_enemies = []
                    for raw_enemy in incoming_enemies[:MAX_SHARED_MARTIAN_ENEMIES]:
                        clean_enemy = sanitize_martian_enemy(raw_enemy)
                        if clean_enemy:
                            sanitized_enemies.append(clean_enemy)
                    for enemy in sanitized_enemies:
                        enemy_id = enemy["id"]
                        if enemy_id in dead_enemy_set:
                            continue
                        previous_enemy = enemy_states.get(enemy_id)
                        if not isinstance(previous_enemy, dict):
                            continue
                        previous_enemy["hp"] = min(previous_enemy.get("hp", enemy["hp"]), enemy["hp"])
                        if previous_enemy["hp"] <= 0:
                            enemy_states.pop(enemy_id, None)
                            if enemy_id not in dead_enemy_set:
                                dead_enemy_ids.append(enemy_id)
                                dead_enemy_set.add(enemy_id)

                shared_world["_martianEnemies"] = enemy_states
                if planet in ("mars", "luna", "moon"):
                    update_shared_martian_world(shared_world, planet, now)
                shared_world["_deadMartianEnemyIds"] = list(dict.fromkeys(dead_enemy_ids))[-5000:]

                if shared_world != previous_world:
                    WORLDS[planet] = shared_world
                    WORLDS_DIRTY = True
                save_shared_worlds(now)

            visible_worlds = {
                planet: public_world(WORLDS[planet], snapshot, player_id)
            } if planet in WORLDS else {}
            result = {
                "ok": True,
                "players": [public_player_snapshot(entry["snapshot"]) for peer_id, entry in PLAYERS.items() if peer_id != player_id],
                "worlds": visible_worlds,
                "spaceWorld": public_space_world(),
                "spaceHitResults": space_hit_results,
                "balance": public_balance(),
            }
        self.send_json(200, result)


if __name__ == "__main__":
    port = int(os.environ.get("PORT", "8000"))
    server = ThreadingHTTPServer(("0.0.0.0", port), SpaceHeavenHandler)
    print(f"SpaceHeaven escuchando en el puerto {port}", flush=True)
    server.serve_forever()
