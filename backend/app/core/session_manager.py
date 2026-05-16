import redis.asyncio as aioredis
import json
import logging
from app.core.config import get_settings

settings = get_settings()
logger = logging.getLogger(__name__)

class SessionManager:
    def __init__(self):
        self.redis = None
        self._memory_store: dict[str, list] = {}

    async def connect(self):
        try:
            self.redis = aioredis.from_url(
                settings.REDIS_URL,
                encoding="utf-8",
                decode_responses=True
            )
            await self.redis.ping()
            logger.info("Connected to Redis session store.")
        except Exception as exc:
            self.redis = None
            logger.warning(
                "Redis session store unavailable at %s. "
                "Using in-memory sessions for this process. Error: %s",
                settings.REDIS_URL,
                exc,
            )

    async def disconnect(self):
        if self.redis:
            await self.redis.close()

    async def get_history(self, session_id: str) -> list:
        if not session_id:
            return []
        if not self.redis:
            return self._memory_store.get(session_id, [])
        try:
            data = await self.redis.get(f"session:{session_id}:history")
            if data:
                return json.loads(data)
        except Exception as exc:
            logger.warning("Redis get failed. Falling back to memory. Error: %s", exc)
            self.redis = None
            return self._memory_store.get(session_id, [])
        return []

    async def save_history(self, session_id: str, history: list):
        if not session_id:
            return
        if not self.redis:
            self._memory_store[session_id] = history
            return
        try:
            await self.redis.setex(
                f"session:{session_id}:history",
                3600,               # expire after 1 hour
                json.dumps(history)
            )
        except Exception as exc:
            logger.warning("Redis save failed. Falling back to memory. Error: %s", exc)
            self.redis = None
            self._memory_store[session_id] = history

    async def clear_history(self, session_id: str):
        if not session_id:
            return
        self._memory_store.pop(session_id, None)
        if not self.redis:
            return
        try:
            await self.redis.delete(f"session:{session_id}:history")
        except Exception as exc:
            logger.warning("Redis delete failed. Error: %s", exc)
            self.redis = None

session_manager = SessionManager()
