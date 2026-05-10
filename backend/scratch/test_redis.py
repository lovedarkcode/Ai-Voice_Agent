import redis.asyncio as aioredis
import asyncio

async def test():
    try:
        # This is what they have in session_manager.py
        client = aioredis.from_url("redis://localhost")
        print(f"Type of client: {type(client)}")
        # Check if it's awaitable
        if asyncio.iscoroutine(client):
            print("It is a coroutine!")
        else:
            print("It is NOT a coroutine.")
        await client.close()
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    asyncio.run(test())
