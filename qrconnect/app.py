from __future__ import annotations

from typing import List

from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles
from pathlib import Path
from fastapi import UploadFile, File
import aiofiles as aio

class ConnectionManager:
    """Manage active WebSocket connections and broadcast messages."""

    def __init__(self) -> None:
        self.active_connections: List[WebSocket] = []

    async def connect(self, websocket: WebSocket) -> None:
        """Accept and store a new WebSocket connection."""
        await websocket.accept()
        self.active_connections.append(websocket)

    def disconnect(self, websocket: WebSocket) -> None:
        """Remove a WebSocket connection."""
        if websocket in self.active_connections:
            self.active_connections.remove(websocket)

    async def broadcast(self, message: str) -> None:
        """Broadcast a text message to all connected clients."""
        for connection in list(self.active_connections):
            try:
                await connection.send_text(message)
            except Exception:
                # Drop connections that fail to receive messages.
                self.disconnect(connection)


app = FastAPI(title="QRConnect")

manager = ConnectionManager()

BASE_DIR = Path(__file__).resolve().parent
CHUNK_SIZE = 1024 * 1024

@app.get("/")
async def get_root() -> FileResponse:
    """Serve the main chat page."""
    index_path = BASE_DIR / "templates" / "index.html"
    return FileResponse(index_path)


@app.get("/favicon.ico", include_in_schema=False)
async def favicon() -> FileResponse:
    """Serve the favicon for browser tabs."""
    favicon_path = BASE_DIR / "static" / "favicon.ico"
    return FileResponse(favicon_path)


app.mount(
    "/static",
    StaticFiles(directory=BASE_DIR / "static"),
    name="static",
)

@app.post("/upload")
async def upload(file: UploadFile = File(...)) -> dict:
    safe_name = Path(file.filename).name
    dest = BASE_DIR / "static" / "uploads" / safe_name
    dest.parent.mkdir(parents=True, exist_ok=True)
    async with aio.open(dest, "wb") as out:

        while True:
            chunk = await file.read(CHUNK_SIZE)
            if not chunk:
                break
            await out.write(chunk)

    return {"url": f"/static/uploads/{safe_name}"}

@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket) -> None:
    """
    WebSocket endpoint for chat messages.

    Receives plain text messages and broadcasts them to all connected clients.
    """
    await manager.connect(websocket)
    try:
        while True:
            data = await websocket.receive_text()
            await manager.broadcast(data)
    except WebSocketDisconnect:
        manager.disconnect(websocket)
    except Exception:
        manager.disconnect(websocket)
