"""
Check all collections in MongoDB
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

def check_collections():
    try:
        client = MongoClient(MONGODB_URI, serverSelectionTimeoutMS=30000)
        db = client[DATABASE_NAME]
        
        print("Available collections in database:")
        collections = db.list_collection_names()
        for collection in collections:
            count = db[collection].count_documents({})
            print(f"  - {collection}: {count} documents")
        
        client.close()
        
    except Exception as e:
        print(f"Error: {str(e)}")

if __name__ == "__main__":
    check_collections()
