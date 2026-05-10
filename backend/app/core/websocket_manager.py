from fastapi import WebSocket
import json

class WebSocketManager:
    def __init__(self):
        self.active_connections: dict[str, WebSocket] = {}

    async def connect(self, session_id: str, websocket: WebSocket):
        await websocket.accept()
        self.active_connections[session_id] = websocket

    def disconnect(self, session_id: str):
        if session_id in self.active_connections:
            del self.active_connections[session_id]

    async def send_json(self, session_id: str, data: dict):
        websocket = self.active_connections.get(session_id)
        if websocket:
            await websocket.send_json(data)

    async def send_bytes(self, session_id: str, data: bytes):
        websocket = self.active_connections.get(session_id)
        if websocket:
            await websocket.send_bytes(data)

    async def broadcast_json(self, data: dict):
        for session_id, websocket in self.active_connections.items():
            try:
                await websocket.send_json(data)
            except Exception:
                self.disconnect(session_id)

    def is_connected(self, session_id: str) -> bool:
        return session_id in self.active_connections

ws_manager = WebSocketManager()