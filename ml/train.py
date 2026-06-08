"""
CampusEats — Demand Prediction Model
Trains a RandomForest regressor on historical waste/meal data.
Run: python train.py
"""

import os
import joblib
import numpy as np
import pandas as pd
import psycopg2
from dotenv import load_dotenv
from sklearn.ensemble import RandomForestRegressor, GradientBoostingRegressor
from sklearn.model_selection import train_test_split, cross_val_score
from sklearn.preprocessing import LabelEncoder
from sklearn.metrics import mean_absolute_error, r2_score

load_dotenv()

DB_URL = os.getenv('DATABASE_URL', 'postgresql://postgres:password@localhost/campuseats')


def load_data() -> pd.DataFrame:
    conn = psycopg2.connect(DB_URL)
    df = pd.read_sql(
        """
        SELECT
            wl.weight_kg,
            wl.created_at,
            m.name AS meal,
            m.category,
            c.name AS cafeteria,
            EXTRACT(HOUR  FROM wl.created_at) AS hour,
            EXTRACT(DOW   FROM wl.created_at) AS day_of_week,
            EXTRACT(MONTH FROM wl.created_at) AS month
        FROM waste_logs wl
        JOIN meals m ON wl.meal_id = m.id
        JOIN cafeterias c ON wl.cafeteria_id = c.id
        ORDER BY wl.created_at
        """,
        conn
    )
    conn.close()
    return df


def engineer_features(df: pd.DataFrame) -> tuple:
    le_meal = LabelEncoder()
    le_cat  = LabelEncoder()
    le_caf  = LabelEncoder()

    df['meal_enc'] = le_meal.fit_transform(df['meal'])
    df['cat_enc']  = le_cat.fit_transform(df['category'])
    df['caf_enc']  = le_caf.fit_transform(df['cafeteria'])

    # Calendar features
    df['is_weekend']  = df['day_of_week'].isin([0, 6]).astype(int)
    df['is_friday']   = (df['day_of_week'] == 5).astype(int)
    df['lunch_hour']  = ((df['hour'] >= 11) & (df['hour'] <= 14)).astype(int)
    df['dinner_hour'] = ((df['hour'] >= 17) & (df['hour'] <= 20)).astype(int)

    features = ['meal_enc', 'cat_enc', 'caf_enc', 'hour', 'day_of_week',
                'month', 'is_weekend', 'is_friday', 'lunch_hour', 'dinner_hour']
    X = df[features].values
    y = df['weight_kg'].values
    return X, y, {'meal': le_meal, 'category': le_cat, 'cafeteria': le_caf}


def train():
    print("Loading data…")
    df = load_data()
    print(f"Loaded {len(df)} rows")

    X, y, encoders = engineer_features(df)
    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)

    model = RandomForestRegressor(n_estimators=200, max_depth=10, random_state=42, n_jobs=-1)
    model.fit(X_train, y_train)

    y_pred = model.predict(X_test)
    mae = mean_absolute_error(y_test, y_pred)
    r2  = r2_score(y_test, y_pred)
    cv  = cross_val_score(model, X, y, cv=5, scoring='r2')

    print(f"MAE : {mae:.4f} kg")
    print(f"R²  : {r2:.4f}")
    print(f"CV R²: {cv.mean():.4f} ± {cv.std():.4f}")

    os.makedirs('models', exist_ok=True)
    joblib.dump({'model': model, 'encoders': encoders}, 'models/demand_model.pkl')
    print("Model saved → models/demand_model.pkl")


if __name__ == '__main__':
    train()
