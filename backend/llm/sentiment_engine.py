"""
Lightweight Sentiment Analysis Engine using VADER
No heavy models - fast startup and processing
"""
from __future__ import annotations

import logging
from vaderSentiment.vaderSentiment import SentimentIntensityAnalyzer

logger = logging.getLogger(__name__)

# Fixed order for consistency with previous implementation
LABEL_CLASSES = ["Negative", "Neutral", "Positive"]

# Initialize VADER analyzer
logger.info("Initializing VADER sentiment analyzer...")
_analyzer = SentimentIntensityAnalyzer()
logger.info("[OK] VADER sentiment analyzer loaded (lightweight, no model download needed)")


def get_sentiment(text: str) -> dict:
    """
    Run sentiment classification on *text* using VADER and return:

        {
          "label":            "Positive" | "Neutral" | "Negative",
          "confidence_score": float,           # 0.0 – 1.0
          "percentages":      {"Negative": float, "Neutral": float, "Positive": float},
          "one_hot":          {"Negative": int,   "Neutral": int,   "Positive": int},
          "model":            "vader",
        }
    """
    if not text or not text.strip():
        return {
            "label": "Neutral",
            "confidence_score": 0.0,
            "percentages": {"Negative": 0.0, "Neutral": 100.0, "Positive": 0.0},
            "one_hot": {"Negative": 0, "Neutral": 1, "Positive": 0},
            "model": "vader",
        }

    # Get VADER scores
    scores = _analyzer.polarity_scores(text[:512])

    # VADER returns: neg, neu, pos (0-1), compound (-1 to 1)
    neg_pct = scores["neg"] * 100
    neu_pct = scores["neu"] * 100
    pos_pct = scores["pos"] * 100
    compound = scores["compound"]

    # Determine label based on compound score
    # compound > 0.05: Positive, < -0.05: Negative, else: Neutral
    if compound >= 0.05:
        top_label = "Positive"
        confidence = pos_pct / 100
    elif compound <= -0.05:
        top_label = "Negative"
        confidence = neg_pct / 100
    else:
        top_label = "Neutral"
        confidence = neu_pct / 100

    formatted = {
        "Negative": round(neg_pct, 2),
        "Neutral": round(neu_pct, 2),
        "Positive": round(pos_pct, 2),
    }

    return {
        "label": top_label,
        "confidence_score": round(confidence, 4),
        "percentages": formatted,
        "one_hot": {cls: (1 if cls == top_label else 0) for cls in LABEL_CLASSES},
        "model": "vader",
    }
