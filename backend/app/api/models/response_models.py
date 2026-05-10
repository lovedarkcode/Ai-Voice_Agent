from pydantic import BaseModel
from typing import Optional

class TranscriptResponse(BaseModel):
    transcript: str
    session_id: str
    duration_seconds: Optional[float] = None

class ChatResponse(BaseModel):
    response: str
    session_id: str
    tokens_used: Optional[int] = None

class TTSResponse(BaseModel):
    audio_url: Optional[str] = None
    session_id: Optional[str] = None
    message: str = "Audio generated successfully"

class ErrorResponse(BaseModel):
    error: str
    detail: Optional[str] = None