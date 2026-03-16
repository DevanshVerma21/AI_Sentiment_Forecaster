"""
TrendAI Backend Server
Main FastAPI application with authentication, scraping, and sentiment analysis
"""
from fastapi import FastAPI, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import OAuth2PasswordBearer
from oauth2 import verify_access_token
from routers import authentication
import sys
from pymongo import MongoClient
import pandas as pd
import time

# Try to import scraping modules (optional)
try:
    from scraper.selenium_scraper import scrape_reviews, get_product_links
    from scraper.news_scraper import scrape_news
    SCRAPING_ENABLED = True
except ImportError as e:
    print(f"⚠️  Scraping modules not available: {e}")
    print("  Install selenium and beautifulsoup4 to enable scraping features")
    SCRAPING_ENABLED = False

# Try to import sentiment engine (optional)
try:
    from llm.sentiment_engine import get_sentiment
    from utils.cleaner import clean_text
    SENTIMENT_ENABLED = True
except ImportError as e:
    print(f"⚠️  Sentiment analysis not available: {e}")
    print("  Install transformers and torch to enable sentiment analysis")
    SENTIMENT_ENABLED = False

# Try to import RAG routes (optional)
try:
    from routers import rag_routes
    RAG_ENABLED = True
except ImportError as e:
    print(f"⚠️  RAG features not available: {e}")
    print("  Install RAG dependencies: pip install -r rag_requirements.txt")
    RAG_ENABLED = False

import os
from bson import ObjectId

print("PYTHON PATH:", sys.executable)

# Initialize FastAPI app
app = FastAPI(
    title="TrendAI API",
    description="AI-powered sentiment analysis and market tracking platform",
    version="1.0.0"
)

# CORS Middleware - Allow frontend to connect
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173", "http://localhost:5174", "http://127.0.0.1:5174"],  # Frontend URLs
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include authentication router
app.include_router(authentication.router)

# Include RAG router if available
if RAG_ENABLED:
    app.include_router(rag_routes.router)
    print("✓ RAG routes loaded")

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/auth/login")

# MongoDB Atlas connection
try:
    client = MongoClient(
        "mongodb+srv://DevanshVerma:qazxsw123@cluster0.fxr8rpr.mongodb.net/ai_project_db?retryWrites=true&w=majority&appName=Cluster0",
        serverSelectionTimeoutMS=5000
    )
    client.server_info()
    print("✓ MongoDB Atlas Connected Successfully")
except Exception as e:
    print("✗ MongoDB Connection Failed:", e)
    print("  Check your internet connection and MongoDB Atlas credentials")

db = client["ai_project_db"]
product_collection = db["reviews"]
news_collection = db["news"]


# -----------------------
# Root Endpoint
# -----------------------
@app.get("/")
def read_root():
    return {
        "message": "Welcome to TrendAI API",
        "version": "1.0.0",
        "status": "running"
    }


# -----------------------
# Protected Route Example
# -----------------------
@app.get("/protected")
def protected_route(token: str = Depends(oauth2_scheme)):
    payload = verify_access_token(token)
    return {"message": "You are authorized", "user": payload}


# -----------------------
# Product Scraping Route
# -----------------------
@app.get("/api/scrape/products")
def run_pipeline():
    """
    Scrape product reviews from Amazon and analyze sentiment
    """
    if not SCRAPING_ENABLED:
        raise HTTPException(
            status_code=503,
            detail="Scraping functionality is not available. Install required dependencies."
        )
    
    if not SENTIMENT_ENABLED:
        raise HTTPException(
            status_code=503,
            detail="Sentiment analysis is not available. Install required dependencies."
        )
    
    categories = {
        "electronics": "https://www.amazon.in/s?i=electronics",
        "clothes": "https://www.amazon.in/s?i=fashion",
        "essentials": "https://www.amazon.in/s?i=grocery"
    }
   
    all_results = []

    for category_name, category_url in categories.items():
        print(f"Scraping category: {category_name}")

        product_links = get_product_links(category_url)
        product_links = product_links[:3]  # Limit to avoid blocking

        for product_url in product_links:
            try:
                raw_reviews = scrape_reviews(product_url)
                print(f"Reviews found: {len(raw_reviews)}")

                for item in raw_reviews:
                    cleaned = clean_text(item["text"])
                    sentiment = get_sentiment(cleaned)

                    data = {
                        "category": category_name,
                        "product_url": product_url,
                        "review": item["text"],
                        "sentiment_label": sentiment["label"],
                        "confidence_score": sentiment.get("confidence_score", 0),
                        "negative_percent": sentiment.get("percentages", {}).get("Negative", 0),
                        "neutral_percent": sentiment.get("percentages", {}).get("Neutral", 0),
                        "positive_percent": sentiment.get("percentages", {}).get("Positive", 0),
                    }

                    all_results.append(data)
                    product_collection.insert_one(data)

                time.sleep(5)  # Avoid rate limiting

            except Exception as e:
                print(f"Error scraping {product_url}: {e}")
                continue

    return {"message": "Product scraping completed", "count": len(all_results)}


# -----------------------
# News Scraping Route
# -----------------------
@app.get("/api/scrape/news")
def run_news_pipeline():
    """
    Scrape news articles and analyze sentiment
    """
    if not SCRAPING_ENABLED:
        raise HTTPException(
            status_code=503,
            detail="Scraping functionality is not available. Install required dependencies."
        )
    
    if not SENTIMENT_ENABLED:
        raise HTTPException(
            status_code=503,
            detail="Sentiment analysis is not available. Install required dependencies."
        )
    
    news_data = scrape_news()
    results = []

    for article in news_data:
        combined_text = article["title"] + " " + article["description"]
        cleaned = clean_text(combined_text)
        sentiment = get_sentiment(cleaned)

        data = {
            "platform": "news",
            "keyword": article["keyword"],
            "title": article["title"],
            "description": article["description"],
            "sentiment_label": sentiment["label"],
            "sentiment_score": sentiment.get("confidence_score", 0),
            "published_date": article["published_date"]
        }

        results.append(data)
        news_collection.insert_one(data)

    return {"message": "News scraping completed", "count": len(results)}


# -----------------------
# Get Stored Products
# -----------------------
@app.get("/api/products")
def get_products():
    """
    Retrieve all stored product reviews and sentiments
    """
    data = list(product_collection.find({}, {"_id": 0}).limit(100))
    return {"count": len(data), "data": data}


# -----------------------
# Get Stored News
# -----------------------
@app.get("/api/news")
def get_news():
    """
    Retrieve all stored news articles and sentiments
    """
    data = list(news_collection.find({}, {"_id": 0}).limit(100))
    return {"count": len(data), "data": data}


# -----------------------
# Health Check
# -----------------------
@app.get("/api/health")
def health_check():
    """
    Check if all services are running properly
    """
    mongo_status = "connected"
    try:
        client.server_info()
    except:
        mongo_status = "disconnected"
    
    return {
        "status": "healthy",
        "mongodb": mongo_status,
        "scraping_enabled": SCRAPING_ENABLED,
        "sentiment_enabled": SENTIMENT_ENABLED,
        "rag_enabled": RAG_ENABLED,
        "version": "1.0.0"
    }


# -----------------------
# Startup: Load CSV Data to MongoDB
# -----------------------
@app.on_event("startup")
async def load_csv_to_mongodb():
    """Load CSV data into MongoDB collections if they are empty on startup"""
    try:
        # Load product reviews from CSV
        if product_collection.count_documents({}) == 0:
            csv_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), "output", "results.csv")
            if os.path.exists(csv_path):
                df = pd.read_csv(csv_path)
                records = []
                for _, row in df.iterrows():
                    records.append({
                        "category": str(row.get("category", "unknown")),
                        "platform": str(row.get("platform", "amazon")),
                        "product_url": str(row.get("product_url", "")),
                        "review": str(row.get("original_text", "")),
                        "clean_text": str(row.get("clean_text", "")),
                        "sentiment_label": str(row.get("sentiment_label", "Neutral")),
                        "confidence_score": float(row.get("sentiment_score", 0)),
                    })
                if records:
                    product_collection.insert_many(records)
                    print(f"✓ Loaded {len(records)} product reviews from CSV to MongoDB")
            else:
                print(f"⚠ CSV file not found at: {csv_path}")
        else:
            print(f"✓ Products collection: {product_collection.count_documents({})} documents already loaded")

        # Load news articles from CSV
        if news_collection.count_documents({}) == 0:
            csv_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), "output", "news_results.csv")
            if os.path.exists(csv_path):
                df = pd.read_csv(csv_path)
                records = df.fillna("").to_dict(orient="records")
                if records:
                    news_collection.insert_many(records)
                    print(f"✓ Loaded {len(records)} news articles from CSV to MongoDB")
        else:
            print(f"✓ News collection: {news_collection.count_documents({})} documents already loaded")

    except Exception as e:
        print(f"⚠ CSV loading error: {e}")


# -----------------------
# System Stats Endpoint
# -----------------------
@app.get("/api/stats")
def get_system_stats():
    """Get system statistics for admin panel"""
    try:
        product_count = product_collection.count_documents({})
        news_count = news_collection.count_documents({})
        user_count = db["users"].count_documents({})

        pos = product_collection.count_documents({"sentiment_label": "Positive"})
        neg = product_collection.count_documents({"sentiment_label": "Negative"})
        neu = product_collection.count_documents({"sentiment_label": "Neutral"})
        total = product_count if product_count > 0 else 1

        if pos >= neg and pos >= neu:
            dominant = "Positive"
        elif neg >= pos and neg >= neu:
            dominant = "Negative"
        else:
            dominant = "Neutral"

        return {
            "total_reviews": product_count,
            "total_news": news_count,
            "total_users": user_count,
            "positive": pos,
            "negative": neg,
            "neutral": neu,
            "positive_pct": round((pos / total) * 100),
            "negative_pct": round((neg / total) * 100),
            "neutral_pct": round((neu / total) * 100),
            "dominant_sentiment": dominant,
            "scraping_enabled": SCRAPING_ENABLED,
            "sentiment_enabled": SENTIMENT_ENABLED,
            "rag_enabled": RAG_ENABLED,
        }
    except Exception as e:
        return {"error": str(e), "total_reviews": 0, "total_news": 0, "total_users": 0}


# -----------------------
# Current User Profile
# -----------------------
@app.get("/api/me")
def get_my_profile(token: str = Depends(oauth2_scheme)):
    """Get the currently logged-in user's profile"""
    payload = verify_access_token(token)
    user_id = payload.get("user_id")
    try:
        user = db["users"].find_one({"_id": ObjectId(user_id)}, {"_id": 0, "password": 0})
        if not user:
            raise HTTPException(status_code=404, detail="User not found")
        return user
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# -----------------------
# Admin: User List
# -----------------------
@app.get("/api/admin/users")
def get_all_users(token: str = Depends(oauth2_scheme)):
    """Get all users for admin panel"""
    verify_access_token(token)
    users = list(db["users"].find({}, {"password": 0}).limit(50))
    for u in users:
        u["_id"] = str(u["_id"])
    return {"users": users, "count": len(users)}


if __name__ == "__main__":
    import uvicorn
    print("\n🚀 Starting TrendAI Server...")
    print("📊 API Documentation: http://localhost:8000/docs")
    print("🔗 Server running at: http://localhost:8000\n")
    uvicorn.run("server:app", host="0.0.0.0", port=8000, reload=True)
