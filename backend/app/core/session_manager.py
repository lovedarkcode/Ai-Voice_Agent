import redis.asyncio as aioredis
import json
from app.core.config import get_settings

settings = get_settings()

class SessionManager:
    def __init__(self):
        self.redis = None

    async def connect(self):
        self.redis = aioredis.from_url(
            settings.REDIS_URL,
            encoding="utf-8",
            decode_responses=True
        )
        await self.redis.ping()

    async def disconnect(self):
        if self.redis:
            await self.redis.close()

    async def get_history(self, session_id: str) -> list:
        if not self.redis:
            return []
        data = await self.redis.get(f"session:{session_id}:history")
        if data:
            return json.loads(data)
        return []

    async def save_history(self, session_id: str, history: list):
        if not self.redis:
            return
        await self.redis.setex(
            f"session:{session_id}:history",
            3600,               # expire after 1 hour
            json.dumps(history)
        )

    async def clear_history(self, session_id: str):
        if not self.redis:
            return
        await self.redis.delete(f"session:{session_id}:history")

session_manager = SessionManager()