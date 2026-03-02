from transformers import pipeline

sentiment_model = pipeline(
    "text-classification",
    model="cardiffnlp/twitter-roberta-base-sentiment",
    
    truncation=True
)

def get_sentiment(text):

    result = sentiment_model(text[:512])[0]

    label_map = {
        "LABEL_0": "Negative",
        "LABEL_1": "Neutral",
        "LABEL_2": "Positive"
    }

    return {
        "label": label_map[result["label"]],
        "score": float(result["score"])
    }
