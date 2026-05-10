import tempfile
import os
from openai import AsyncOpenAI
from pydub import AudioSegment
from app.core.config import get_settings

# Manually add the FFmpeg bin directory to the PATH (for winget install)
ffmpeg_bin = os.path.expandvars(r"%LOCALAPPDATA%\Microsoft\WinGet\Packages\Gyan.FFmpeg_Microsoft.Winget.Source_8wekyb3d8bbwe\ffmpeg-8.1.1-full_build\bin")
if os.path.exists(ffmpeg_bin):
    os.environ["PATH"] += os.pathsep + ffmpeg_bin

settings = get_settings()
client = AsyncOpenAI(api_key=settings.OPENAI_API_KEY)

async def transcribe_audio(audio_bytes: bytes, content_type: str = "audio/webm") -> dict:
    tmp_path = None
    mp3_path = None
    try:
        suffix = _get_suffix(content_type)
        with tempfile.NamedTemporaryFile(suffix=suffix, delete=False) as tmp:
            tmp.write(audio_bytes)
            tmp_path = tmp.name

        mp3_path = tmp_path.replace(suffix, ".mp3")
        audio = AudioSegment.from_file(tmp_path)
        audio.export(mp3_path, format="mp3")
        duration = len(audio) / 1000.0

        with open(mp3_path, "rb") as f:
            response = await client.audio.transcriptions.create(
                model="whisper-1",
                file=f,
                response_format="text"
            )

        return {
            "transcript": str(response).strip(),
            "duration_seconds": round(duration, 2)
        }

    except Exception as e:
        raise RuntimeError(f"STT failed: {str(e)}")

    finally:
        for path in [tmp_path, mp3_path]:
            if path and os.path.exists(path):
                os.remove(path)


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