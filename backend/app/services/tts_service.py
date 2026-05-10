# pyrefly: ignore [missing-import]
import edge_tts
import io
from app.core.config import get_settings

settings = get_settings()

async def synthesize_speech(text: str, voice_id: str = None) -> bytes:
    """
    Converts text to speech using Edge-TTS (Free).
    Returns raw mp3 audio bytes.
    """
    try:
        # Fallback to a high-quality neural voice if no voice_id is provided
        # Example: "en-US-AvaNeural" or "en-GB-SoniaNeural"
        vid = voice_id or "en-US-AvaNeural"
        
        communicate = edge_tts.Communicate(text, vid)
        audio_bytes = io.BytesIO()
        
        # edge-tts streams the data in chunks
        async for chunk in communicate.stream():
            if chunk["type"] == "audio":
                audio_bytes.write(chunk["data"])
        
        return audio_bytes.getvalue()

    except Exception as e:
        raise RuntimeError(f"Free TTS failed: {str(e)}")
