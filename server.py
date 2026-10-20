from __future__ import annotations

import json
import os
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
        if not self.path.startswith("/api/players"):
            super().log_message(format_string, *args)

    def send_json(self, status: int, data: object) -> None:
        body = json.dumps(data, separators=(",", ":"), ensure_ascii=False).encode("utf-8")
        self.send_response(status)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Content-Length", str(len(body)))
        self.send_header("Cache-Control", "no-store")
        self.end_headers()
        self.wfile.write(body)

    def do_GET(self) -> None:
        parsed = urlsplit(self.path)
        if parsed.path == "/api/health":
            self.send_json(200, {"ok": True, "service": "spaceheaven"})
            return
        if parsed.path != "/api/players":
            return super().do_GET()

        self_id = parse_qs(parsed.query).get("self", [""])[0]
        now = time.time()
        with STATE_LOCK:
            prune_stale_players(now)
            players = [
                entry["snapshot"] for player_id, entry in PLAYERS.items()
                if player_id != self_id
            ]
            result = {
                "players": players,
                "worldOwners": dict(WORLD_OWNERS),
                "worlds": WORLDS,
            }
        self.send_json(200, result)

    def do_POST(self) -> None:
        if urlsplit(self.path).path != "/api/players":
            self.send_json(404, {"error": "not found"})
            return
        try:
            size = int(self.headers.get("Content-Length", "0"))
            if size <= 0 or size > MAX_REQUEST_BYTES:
                self.send_json(413, {"error": "invalid request size"})
                return
            snapshot = json.loads(self.rfile.read(size))
            if not isinstance(snapshot, dict):
                self.send_json(400, {"error": "invalid player snapshot"})
                return
            player_id = str(snapshot.get("id", "")).strip()
            if not player_id or len(player_id) > 128:
                self.send_json(400, {"error": "invalid player snapshot"})
                return
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
        self.send_json(200, {"ok": True})


if __name__ == "__main__":
    port = int(os.environ.get("PORT", "8000"))
    server = ThreadingHTTPServer(("0.0.0.0", port), SpaceHeavenHandler)
    print(f"SpaceHeaven escuchando en el puerto {port}", flush=True)
    server.serve_forever()
