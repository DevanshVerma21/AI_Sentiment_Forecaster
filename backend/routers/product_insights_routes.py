"""
Product Insights Routes
Generate Groq-powered AI insights about products and sentiment analysis
"""
from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any
import os
import logging
from oauth2 import verify_access_token
from fastapi.security import OAuth2PasswordBearer

logger = logging.getLogger(__name__)

# Initialize router
router = APIRouter(
    prefix="/api/product-insights",
    tags=["Product Insights"]
)

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/auth/login")


# Request/Response Models
class SentimentBreakdown(BaseModel):
    positive: int
    neutral: int
    negative: int


class ProductInsightsRequest(BaseModel):
    product: str = Field(..., min_length=2, max_length=100, description="Product name")
    sentiment_breakdown: SentimentBreakdown = Field(..., description="Sentiment counts")
    total_mentions: Optional[int] = Field(None, description="Total number of mentions")


class InsightsResponse(BaseModel):
    product: str
    product_overview: List[str] = Field(..., description="3-4 bullet points about the product")
    sentiment_analysis: List[str] = Field(..., description="2-3 points analyzing sentiment")
    recommendations: List[str] = Field(..., description="2-3 actionable recommendations")
    success: bool


def get_groq_llm():
    """Initialize Groq LLM with API key from environment"""
    try:
        groq_api_key = os.getenv("GROQ_API_KEY")
        if not groq_api_key:
            raise ValueError("GROQ_API_KEY not configured in environment")

        from langchain_groq import ChatGroq
        llm = ChatGroq(
            groq_api_key=groq_api_key,
            model_name="llama-3.1-70b-versatile",
            temperature=0.3,
            max_tokens=600
        )
        return llm
    except ImportError:
        raise HTTPException(
            status_code=500,
            detail="Groq LLM library not installed. Run: pip install langchain-groq"
        )
    except Exception as e:
        logger.error(f"[FAIL] Failed to initialize Groq LLM: {e}")
        raise HTTPException(status_code=500, detail=f"LLM initialization failed: {str(e)}")


def parse_insights_response(response_text: str) -> Dict[str, List[str]]:
    """
    Parse Groq response into structured insights.
    Expected format:
    PRODUCT OVERVIEW:
    - point 1
    - point 2

    SENTIMENT ANALYSIS:
    - point 1
    - point 2

    RECOMMENDATIONS:
    - point 1
    - point 2
    """
    sections = {
        "product_overview": [],
        "sentiment_analysis": [],
        "recommendations": []
    }

    current_section = None
    lines = response_text.split("\n")

    for line in lines:
        line = line.strip()
        if not line:
            continue

        if "PRODUCT OVERVIEW" in line.upper():
            current_section = "product_overview"
        elif "SENTIMENT ANALYSIS" in line.upper():
            current_section = "sentiment_analysis"
        elif "RECOMMENDATIONS" in line.upper() or "RECOMMENDATION" in line.upper():
            current_section = "recommendations"
        elif line.startswith("-") and current_section:
            point = line[1:].strip()
            if point:
                sections[current_section].append(point)

    # Ensure we have at least one point in each section
    for section in sections:
        if not sections[section]:
            sections[section] = ["No specific insights generated"]

    return sections


@router.post("/generate", response_model=InsightsResponse)
async def generate_product_insights(
    request: ProductInsightsRequest,
    token: str = Depends(oauth2_scheme)
) -> InsightsResponse:
    """
    Generate AI-powered insights about a product using Groq LLM.

    Analyzes product name and sentiment data to generate:
    - Product overview points
    - Sentiment analysis
    - Market recommendations
    """
    try:
        # Verify authentication
        try:
            verify_access_token(token)
        except Exception as e:
            raise HTTPException(status_code=401, detail="Unauthorized")

        # Calculate sentiment percentages
        total = request.sentiment_breakdown.positive + request.sentiment_breakdown.neutral + request.sentiment_breakdown.negative
        if total == 0:
            total = 1  # Avoid division by zero

        pos_pct = round((request.sentiment_breakdown.positive / total) * 100)
        neu_pct = round((request.sentiment_breakdown.neutral / total) * 100)
        neg_pct = round((request.sentiment_breakdown.negative / total) * 100)

        # Create prompt for Groq LLM
        prompt = f"""You are a market intelligence analyst specializing in consumer sentiment analysis.
Analyze the following product and its sentiment data, then provide structured insights.

Product: {request.product}
Sentiment Breakdown:
- Positive: {request.sentiment_breakdown.positive} mentions ({pos_pct}%)
- Neutral: {request.sentiment_breakdown.neutral} mentions ({neu_pct}%)
- Negative: {request.sentiment_breakdown.negative} mentions ({neg_pct}%)
Total Mentions: {total}

Please provide your analysis in the following format with each section having 2-3 bullet points:

PRODUCT OVERVIEW:
- Brief insight about the product
- Market positioning observation
- Quality or feature assessment

SENTIMENT ANALYSIS:
- What the positive sentiment reveals
- What the negative sentiment indicates
- Overall sentiment trend interpretation

RECOMMENDATIONS:
- Strategic action based on positive feedback
- Area for improvement based on negative feedback
- Market opportunity or risk assessment

Be concise, specific, and data-driven. Use only the sentiment data provided."""

        # Get Groq LLM instance
        llm = get_groq_llm()

        # Generate insights
        logger.info(f"[OK] Generating insights for product: {request.product}")
        response = llm.invoke(prompt)
        insights_text = response.content

        # Parse response
        parsed_insights = parse_insights_response(insights_text)

        logger.info(f"[OK] Successfully generated insights for {request.product}")

        return InsightsResponse(
            product=request.product,
            product_overview=parsed_insights["product_overview"],
            sentiment_analysis=parsed_insights["sentiment_analysis"],
            recommendations=parsed_insights["recommendations"],
            success=True
        )

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"[FAIL] Error generating product insights: {e}")
        raise HTTPException(
            status_code=500,
            detail=f"Failed to generate insights: {str(e)}"
        )
