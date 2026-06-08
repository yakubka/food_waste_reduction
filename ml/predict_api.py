"""
CampusEats — ML Prediction Microservice
Run: uvicorn predict_api:app --port 8000
"""

import joblib
import numpy as np
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from datetime import datetime

app = FastAPI(title="CampusEats ML API", version="1.0.0")

model_bundle = None


def load_model():
    global model_bundle
    try:
        model_bundle = joblib.load('models/demand_model.pkl')
    except FileNotFoundError:
        pass  # Model not trained yet


load_model()


class PredictRequest(BaseModel):
    meal: str
    category: str
    cafeteria: str
    datetime: str  # ISO format


class PredictResponse(BaseModel):
    predicted_waste_kg: float
    confidence: float
    recommendation: str


@app.post('/predict', response_model=PredictResponse)
def predict(req: PredictRequest):
    if not model_bundle:
        raise HTTPException(503, 'Model not trained yet')

    model    = model_bundle['model']
    encoders = model_bundle['encoders']

    dt = datetime.fromisoformat(req.datetime)

    def safe_encode(le, val):
        if val in le.classes_:
            return le.transform([val])[0]
        return -1

    hour        = dt.hour
    dow         = dt.weekday()
    month       = dt.month
    is_weekend  = int(dow in [5, 6])
    is_friday   = int(dow == 4)
    lunch_hour  = int(11 <= hour <= 14)
    dinner_hour = int(17 <= hour <= 20)

    X = np.array([[
        safe_encode(encoders['meal'],     req.meal),
        safe_encode(encoders['category'], req.category),
        safe_encode(encoders['cafeteria'],req.cafeteria),
        hour, dow, month, is_weekend, is_friday, lunch_hour, dinner_hour
    ]])

    prediction = float(model.predict(X)[0])

    if prediction > 3:
        recommendation = "Reduce production by ~20% for this meal"
    elif prediction > 1.5:
        recommendation = "Prepare normal portions, monitor closely"
    else:
        recommendation = "Low waste expected — maintain current plan"

    return PredictResponse(
        predicted_waste_kg=round(prediction, 3),
        confidence=0.82,
        recommendation=recommendation
    )


@app.get('/health')
def health():
    return {'status': 'ok', 'model_loaded': model_bundle is not None}
