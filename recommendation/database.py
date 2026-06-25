# FILE: recommendation/database.py
import os
from motor.motor_asyncio import AsyncIOMotorClient
from dotenv import load_dotenv

load_dotenv()

MONGODB_URI = os.getenv("MONGODB_URI")
DB_NAME     = os.getenv("DB_NAME", "aura")

client: AsyncIOMotorClient = None


async def connect_db():
    global client
    client = AsyncIOMotorClient(MONGODB_URI)
    print(f"[DB] Connected to MongoDB — {DB_NAME}")


async def close_db():
    global client
    if client:
        client.close()


def get_db():
    return client[DB_NAME]