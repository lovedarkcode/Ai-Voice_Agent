from fastapi import APIRouter, HTTPException
from fastapi.responses import Response
from app.services.tts_service import synthesize_speech
from app.api.models.request_models import TTSRequest

router = APIRouter()

@router.post(
    "/synthesize",
    summary="Convert text to speech audio",
    response_class=Response
)
async def synthesize(request: TTSRequest):
    if not request.text.strip():
        raise HTTPException(status_code=400, detail="Text cannot be empty.")

    if len(request.text) > 5000:
        raise HTTPException(
            status_code=400,
            detail="Text too long. Maximum 5000 characters."
        )

    try:
        audio_bytes = await synthesize_speech(
            text=request.text,
            voice_id=request.voice_id
        )
        return Response(
            content=audio_bytes,
            media_type="audio/mpeg",
            headers={
                "Content-Disposition": "inline; filename=response.mp3",
                "Content-Length": str(len(audio_bytes))
            }
        )
    except RuntimeError as e:
        raise HTTPException(status_code=500, detail=str(e))