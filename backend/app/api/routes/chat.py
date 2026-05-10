from fastapi import APIRouter, HTTPException
from app.services.llm_service import get_llm_response
from app.api.models.request_models import ChatRequest
from app.api.models.response_models import ChatResponse
from app.core.session_manager import session_manager

router = APIRouter()

@router.post(
    "/",
    response_model=ChatResponse,
    summary="Send transcript to LLM and get a response"
)
async def chat(request: ChatRequest):
    if not request.transcript.strip():
        raise HTTPException(status_code=400, detail="Transcript cannot be empty.")

    try:
        # Load history from Redis if not provided
        history = request.history or []
        if not history and request.session_id:
            history = await session_manager.get_history(request.session_id)

        result = await get_llm_response(request.transcript, history)

        # Update history and save back to Redis
        history.append({"role": "user", "content": request.transcript})
        history.append({"role": "assistant", "content": result["response"]})

        # Keep only last 20 messages to avoid context overflow
        if len(history) > 20:
            history = history[-20:]

        await session_manager.save_history(request.session_id, history)

        return ChatResponse(
            response=result["response"],
            session_id=request.session_id,
            tokens_used=result.get("tokens_used")
        )

    except RuntimeError as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.delete("/{session_id}", summary="Clear conversation history")
async def clear_history(session_id: str):
    await session_manager.clear_history(session_id)
    return {"message": f"History cleared for session {session_id}"}