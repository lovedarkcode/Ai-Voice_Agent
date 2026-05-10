from openai import AsyncOpenAI
from app.core.config import get_settings

settings = get_settings()

# Initialize the OpenAI Async Client
client = AsyncOpenAI(api_key=settings.OPENAI_API_KEY)

SYSTEM_PROMPT = """You are a helpful, concise voice assistant. You respond in short, natural sentences suitable for text-to-speech. Avoid using markdown, bullet points, or special characters in your responses. Keep responses under 3-4 sentences unless the user asks for more detail."""

async def get_llm_response(transcript: str, history: list) -> dict:
    """
    Calls OpenAI GPT-4o, returns the assistant's text response and token usage.
    """
    try:
        # OpenAI expects a 'system' role inside the messages list
        messages = [{"role": "system", "content": SYSTEM_PROMPT}]
        
        for msg in history:
            messages.append({
                "role": msg["role"],
                "content": msg["content"]
            })
            
        messages.append({"role": "user", "content": transcript})

        # OpenAI Chat Completions API
        response = await client.chat.completions.create(
            model="gpt-4o",  # or "gpt-3.5-turbo"
            messages=messages,
            max_tokens=1024
        )

        reply = response.choices[0].message.content
        tokens_used = response.usage.total_tokens
        
        return {
            "response": reply,
            "tokens_used": tokens_used
        }
    except Exception as e:
        raise RuntimeError(f"OpenAI LLM failed: {str(e)}")

async def stream_llm_response(transcript: str, history: list):
    """
    Generator that yields text chunks using OpenAI streaming.
    """
    messages = [{"role": "system", "content": SYSTEM_PROMPT}]
    messages.extend([{"role": m["role"], "content": m["content"]} for m in history])
    messages.append({"role": "user", "content": transcript})

    # Enable 'stream=True' for real-time token delivery
    stream = await client.chat.completions.create(
        model="gpt-4o",
        messages=messages,
        max_tokens=1024,
        stream=True
    )

    async for chunk in stream:
        # OpenAI streams 'deltas' instead of full content blocks
        if chunk.choices[0].delta.content is not None:
            yield chunk.choices[0].delta.content
