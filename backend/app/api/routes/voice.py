from fastapi import APIRouter, UploadFile, File, HTTPException
from app.services.stt_service import transcribe_audio
from app.api.models.response_models import TranscriptResponse
import uuid

router = APIRouter()

@router.post("/transcribe", response_model=TranscriptResponse)
async def transcribe(
    audio: UploadFile = File(...),
    session_id: str = None
):
    audio_bytes = await audio.read()

    if not audio_bytes:
        raise HTTPException(status_code=400, detail="Empty audio file received.")

    if len(audio_bytes) > 25 * 1024 * 1024:
        raise HTTPException(status_code=413, detail="Audio file too large. Max 25MB.")

    # Accept any audio type — no whitelist, let ffmpeg handle conversion
    content_type = audio.content_type or "audio/webm"

    try:
        result = await transcribe_audio(audio_bytes, content_type)
        return TranscriptResponse(
            transcript=result["transcript"],
            session_id=session_id or str(uuid.uuid4()),
            duration_seconds=result["duration_seconds"]
        )
    except RuntimeError as e:
        raise HTTPException(status_code=500, detail=str(e))