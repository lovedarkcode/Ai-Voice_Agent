import tempfile
import os
from openai import AsyncOpenAI
from app.core.config import get_settings

settings = get_settings()
client = AsyncOpenAI(api_key=settings.OPENAI_API_KEY)

async def transcribe_audio(audio_bytes: bytes, content_type: str = "audio/webm") -> dict:
    tmp_path = None
    try:
        suffix = _get_suffix(content_type)
        with tempfile.NamedTemporaryFile(suffix=suffix, delete=False) as tmp:
            tmp.write(audio_bytes)
            tmp_path = tmp.name

        with open(tmp_path, "rb") as f:
            response = await client.audio.transcriptions.create(
                model="whisper-1",
                file=f,
                response_format="text"
            )

        return {
            "transcript": str(response).strip(),
            "duration_seconds": 0
        }

    except Exception as e:
        raise RuntimeError(f"STT failed: {str(e)}")

    finally:
        if tmp_path and os.path.exists(tmp_path):
            os.remove(tmp_path)


def _get_suffix(content_type: str) -> str:
    # Strip codec suffix: "audio/webm;codecs=opus" → "audio/webm"
    base = content_type.split(";")[0].strip().lower()
    mapping = {
        "audio/webm": ".webm",
        "audio/ogg":  ".ogg",
        "audio/wav":  ".wav",
        "audio/mp4":  ".mp4",
        "audio/mpeg": ".mp3",
        "audio/mp3":  ".mp3",
    }
    return mapping.get(base, ".webm")  # default to .webm if unknown
