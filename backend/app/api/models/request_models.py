from pydantic import BaseModel
from typing import Optional

class ChatMessage(BaseModel):
    role: str        # "user" or "assistant"
    content: str

class ChatRequest(BaseModel):
    transcript: str
    session_id: str
    history: Optional[list[ChatMessage]] = []

class TTSRequest(BaseModel):
    text: str
    voice_id: Optional[str] = None
    session_id: Optional[str] = None