"""
Quick test to verify database connection with correct collection names
"""
import os
from pathlib import Path

from dotenv import load_dotenv
from pymongo import MongoClient

SCRIPT_DIR = Path(__file__).resolve().parent
BACKEND_DIR = SCRIPT_DIR.parent
PROJECT_ROOT = BACKEND_DIR.parent
load_dotenv(BACKEND_DIR / ".env", override=False)
load_dotenv(PROJECT_ROOT / ".env", override=False)

MONGODB_URI = (
    os.getenv("MONGO_URI")
    or os.getenv("MONGODB_URI")
    or os.getenv("MONGODB_URL")
)
DATABASE_NAME = os.getenv("MONGODB_DB_NAME", "ai_project_db")

if not MONGODB_URI:
    raise RuntimeError("MongoDB URI not configured. Set MONGO_URI in .env.")

try:
    client = MongoClient(MONGODB_URI, serverSelectionTimeoutMS=5000)
    db = client[DATABASE_NAME]
    
    print("[OK] MongoDB Connection successful")
    print(f"[OK] Reviews collection: {db['reviews'].count_documents({})} documents")
    print(f"[OK] News collection: {db['news'].count_documents({})} documents")
    print(f"[OK] Users collection: {db['users'].count_documents({})} documents")
    print("\n[OK] Database is working correctly!")
    
    client.close()
except Exception as e:
    print(f"[FAIL] Error: {e}")
