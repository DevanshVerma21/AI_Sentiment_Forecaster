from transformers import pipeline

sentiment_model = pipeline(
    "text-classification",
    model="cardiffnlp/twitter-roberta-base-sentiment",
    return_all_scores=True,
    truncation=True
)

def get_sentiment(text):
    results = sentiment_model(text[:512])[0]
    label_map = {
        "LABEL_0": "Negative",
        "LABEL_1": "Neutral",
        "LABEL_2": "Positive"
    }
    formatted = {}
    for item in results:
        label = label_map[item["label"]]
        formatted[label] = round(item["score"] * 100, 2)

    
    top_label = max(formatted, key=formatted.get)
    return {
        "label": top_label,
        "confidence_score": round(formatted[top_label] / 100, 4),
        "percentages": formatted
    }
