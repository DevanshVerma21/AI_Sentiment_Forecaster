"""
Index Data Script
Indexes documents from MongoDB into RAG vector store
"""
import os
import sys
from pathlib import Path

from dotenv import load_dotenv

sys.path.append('..')

from rag.rag_service import initialize_rag_engine, get_rag_engine
from rag.document_processor import DocumentProcessor
from pymongo import MongoClient

# Load environment variables
SCRIPT_DIR = Path(__file__).resolve().parent
BACKEND_DIR = SCRIPT_DIR.parent
PROJECT_ROOT = BACKEND_DIR.parent
load_dotenv(BACKEND_DIR / ".env", override=False)
load_dotenv(PROJECT_ROOT / ".env", override=False)

# MongoDB connection
MONGODB_URI = (
    os.getenv("MONGO_URI")
    or os.getenv("MONGODB_URI")
    or os.getenv("MONGODB_URL")
)
DATABASE_NAME = os.getenv("MONGODB_DB_NAME", "ai_project_db")

if not MONGODB_URI:
    raise RuntimeError("MongoDB URI not configured. Set MONGO_URI in .env.")


def index_reviews(limit=100):
    """Index product reviews from MongoDB"""
    print(f" Indexing product reviews (limit: {limit})...")
    
    try:
        client = MongoClient(MONGODB_URI, serverSelectionTimeoutMS=5000)
        db = client[DATABASE_NAME]
        collection = db["product_results"]
        
        # Fetch reviews
        reviews = list(collection.find().limit(limit))
        print(f"   Found {len(reviews)} reviews in database")
        
        if not reviews:
            print("   [WARN]  No reviews found. Run scraping first.")
            return 0
        
        # Process documents
        processor = DocumentProcessor()
        chunks = processor.process_batch_from_mongodb(reviews, "review")
        print(f"   Processed into {len(chunks)} chunks")
        
        return chunks
        
    except Exception as e:
        print(f"   [FAIL] Error indexing reviews: {e}")
        return []


def index_news(limit=100):
    """Index news articles from MongoDB"""
    print(f" Indexing news articles (limit: {limit})...")
    
    try:
        client = MongoClient(MONGODB_URI, serverSelectionTimeoutMS=5000)
        db = client[DATABASE_NAME]
        collection = db["news_results"]
        
        # Fetch news
        news = list(collection.find().limit(limit))
        print(f"   Found {len(news)} articles in database")
        
        if not news:
            print("   [WARN]  No news found. Run scraping first.")
            return 0
        
        # Process documents
        processor = DocumentProcessor()
        chunks = processor.process_batch_from_mongodb(news, "news")
        print(f"   Processed into {len(chunks)} chunks")
        
        return chunks
        
    except Exception as e:
        print(f"   [FAIL] Error indexing news: {e}")
        return []


def main():
    """Main indexing function"""
    print("=" * 60)
    print("RAG Data Indexing")
    print("=" * 60)
    print()
    
    # Initialize RAG engine
    print("[START] Initializing RAG engine...")
    try:
        rag_engine = initialize_rag_engine()
        print("[OK] RAG engine ready\n")
    except Exception as e:
        print(f"[FAIL] Failed to initialize RAG: {e}")
        sys.exit(1)
    
    # Index reviews
    review_chunks = index_reviews(limit=100)
    
    # Index news
    news_chunks = index_news(limit=100)
    
    # Combine all chunks
    all_chunks = review_chunks + news_chunks
    
    if not all_chunks:
        print("\n[FAIL] No documents to index. Run data collection first.")
        sys.exit(1)
    
    print(f"\n[STATS] Total chunks to index: {len(all_chunks)}")
    
    # Index to vector store
    print("\n Adding documents to vector store...")
    try:
        result = rag_engine.index_documents(all_chunks)
        
        if result["success"]:
            print(f"[OK] Successfully indexed {result['indexed_count']} documents!")
            
            # Show stats
            stats = rag_engine.get_stats()
            print(f"\n[STATS] Vector Store Stats:")
            if "vector_store" in stats:
                for key, value in stats["vector_store"].items():
                    print(f"   {key}: {value}")
        else:
            print(f"[FAIL] Indexing failed: {result.get('error', 'Unknown error')}")
            
    except Exception as e:
        print(f"[FAIL] Error during indexing: {e}")
        sys.exit(1)
    
    print("\n" + "=" * 60)
    print("[OK] Indexing Complete!")
    print("=" * 60)
    print("\n Next Steps:")
    print("   1. Test queries: python scripts/test_rag.py")
    print("   2. Use API: http://localhost:8000/docs")
    print()


if __name__ == "__main__":
    main()
