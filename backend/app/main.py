from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv
import os
import uuid
from app.core.config import get_settings
from app.core.session_manager import session_manager
from app.core.websocket_manager import ws_manager
from app.api.routes import voice, chat, tts
from contextlib import asynccontextmanager
from app.services.stt_service import transcribe_audio
from app.services.llm_service import stream_llm_response
from app.services.tts_service import synthesize_speech


settings = get_settings()

@asynccontextmanager
async def lifespan(app: FastAPI):
    await session_manager.connect()
    yield
    await session_manager.disconnect()

app = FastAPI(
    title = settings.APP_NAME,
    version = settings.APP_VERSION,
    lifespan = lifespan
)

app.add_middleware(
    CORSMiddleware,
    allow_origins = settings.CORS_ORIGINS,
    allow_credentials = True,
    allow_methods = ["*"],
    allow_headers = ["*"],
)


from fastapi import Request
import time

@app.middleware("http")
async def log_requests(request: Request, call_next):
    start_time = time.time()
    response = await call_next(request)
    process_time = (time.time() - start_time) * 1000
    print(f"Request: {request.method} {request.url.path} - Status: {response.status_code} - Completed in {process_time:.2f}ms")
    return response


#rest routes

app.include_router(voice.router,prefix = "/api/voice",tags = ["voice/STT"])
app.include_router(chat.router,prefix = "/api/chat",tags = ["Chat/LLM"])
app.include_router(tts.router,prefix = "/api/tts",tags = ["TTS"])

#health check

@app.get("/health", tags=["Health"])
async def health():
    return {"status": "ok", "app": settings.APP_NAME}

#websocket - fullpipeline

@app.websocket("/ws/{session_id}")
async def websocket_endpoint(websocket: WebSocket, session_id: str):
    await ws_manager.connect(session_id, websocket)
    try:
        while True:
            # Receive raw audio bytes from the frontend
            audio_bytes = await websocket.receive_bytes()

            # 1. STT
            await ws_manager.send_json(session_id, {"type": "status", "message": "Transcribing..."})
            stt_result = await transcribe_audio(audio_bytes, "audio/webm")
            transcript = stt_result["transcript"]
            await ws_manager.send_json(session_id, {
                "type": "transcript",
                "text": transcript
            })

            # 2. LLM (streaming)
            await ws_manager.send_json(session_id, {"type": "status", "message": "Thinking..."})
            history = await session_manager.get_history(session_id)
            full_response = ""

            async for chunk in stream_llm_response(transcript, history):
                full_response += chunk
                await ws_manager.send_json(session_id, {
                    "type": "llm_chunk",
                    "text": chunk
                })

            # save updated history
            history.append({"role": "user", "content": transcript})
            history.append({"role": "assistant", "content": full_response})
            if len(history) > 20:
                history = history[-20:]

            await session_manager.save_history(session_id, history)

            # 3. TTS
            await ws_manager.send_json(session_id, {"type": "status", "message": "Generating audio..."})
            audio_response_bytes = await synthesize_speech(full_response)
            await ws_manager.send_bytes(session_id, audio_response_bytes)
            await ws_manager.send_json(session_id, {"type": "status", "message": "Done"})

    except WebSocketDisconnect:
        await ws_manager.disconnect(session_id)
        print(f"Client disconnected: {session_id}")

    except Exception as e:
        await ws_manager.send_json(session_id, {"type": "error", "message": str(e)})
        await ws_manager.disconnect(session_id)

