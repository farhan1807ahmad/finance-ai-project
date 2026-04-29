"""
Training script for ML models.
Fetches real expense data from Node.js API.
Trains 3 models: Spending Predictor, Anomaly Detector, Trend Analyzer.
Saves all models as pickle files.
"""

import pandas as pd
import numpy as np
import requests
import pickle
import os
from datetime import datetime, timedelta
from sklearn.preprocessing import LabelEncoder
from sklearn.ensemble import RandomForestRegressor, IsolationForest
from sklearn.linear_model import LinearRegression
from sample_data import generate_sample_data

# Configuration
API_URL = 'http://localhost:5000/get-expenses'
MODEL_DIR = os.path.dirname(os.path.abspath(__file__))

print("=" * 60)
print("🚀 STARTING ML MODEL TRAINING")
print("=" * 60)

# ============ STEP 1: FETCH DATA ============
print("\n📡 Step 1: Fetching expense data from API...")
try:
    response = requests.get(API_URL, timeout=5)
    expenses = response.json()
    print(f"✅ Fetched {len(expenses)} records from API")
except Exception as e:
    print(f"⚠️  API connection failed: {e}")
    print("📦 Using synthetic sample data instead...")
    expenses = generate_sample_data()
    print(f"✅ Generated {len(expenses)} synthetic records")

# If still not enough data, augment with synthetic data
if len(expenses) < 10:
    print(f"⚠️  Only {len(expenses)} records found. Augmenting with synthetic data...")
    synthetic = generate_sample_data()
    expenses.extend(synthetic)
    print(f"✅ Total records now: {len(expenses)}")

# ============ STEP 2: PREPARE DATA ============
print("\n🔧 Step 2: Preparing data for training...")

# Convert to DataFrame
df = pd.DataFrame(expenses)

# Map field names (handle both 'description' and 'title' keys)
if 'description' not in df.columns and 'title' in df.columns:
    df['description'] = df['title']
if 'description' not in df.columns:
    df['description'] = 'Expense'

# Ensure required columns exist
required_cols = ['amount', 'category', 'date', 'description']
for col in required_cols:
    if col not in df.columns:
        if col == 'date':
            df['date'] = datetime.now().isoformat()
        elif col == 'amount':
            df['amount'] = 0
        elif col == 'category':
            df['category'] = 'Other'

# Convert date to datetime
df['date'] = pd.to_datetime(df['date'], errors='coerce')
df = df.dropna(subset=['date', 'amount', 'category'])

print(f"📊 Dataset shape: {df.shape}")
print(f"📚 Categories: {df['category'].unique()}")
print(f"💰 Amount range: ₹{df['amount'].min():.2f} - ₹{df['amount'].max():.2f}")

# ============ STEP 3: FEATURE ENGINEERING ============
print("\n⚙️  Step 3: Engineering features...")

# Create features from date
df['month'] = df['date'].dt.month
df['day_of_month'] = df['date'].dt.day
df['day_of_week'] = df['date'].dt.dayofweek
df['year'] = df['date'].dt.year

# Encode categories
label_encoder = LabelEncoder()
df['category_encoded'] = label_encoder.fit_transform(df['category'])

print(f"✅ Features engineered:")
print(f"   - Month: {df['month'].min()}-{df['month'].max()}")
print(f"   - Day of week: {df['day_of_week'].min()}-{df['day_of_week'].max()}")
print(f"   - Categories encoded: {len(label_encoder.classes_)} classes")

# ============ STEP 4: TRAIN MODEL 1 - SPENDING PREDICTOR ============
print("\n🎯 Step 4: Training Spending Predictor (Random Forest)...")

# Prepare features and target
X_predictor = df[['month', 'day_of_month', 'day_of_week', 'category_encoded']]
y_predictor = df['amount']

model_predictor = RandomForestRegressor(
    n_estimators=100,
    max_depth=10,
    min_samples_split=2,
    min_samples_leaf=1,
    random_state=42
)

model_predictor.fit(X_predictor, y_predictor)
train_score = model_predictor.score(X_predictor, y_predictor)
print(f"✅ Spending Predictor trained")
print(f"   - R² Score: {train_score:.4f}")
print(f"   - Feature importance: {dict(zip(X_predictor.columns, model_predictor.feature_importances_))}")

# ============ STEP 5: TRAIN MODEL 2 - ANOMALY DETECTOR ============
print("\n🚨 Step 5: Training Anomaly Detector (Isolation Forest)...")

# Prepare features (just amount and category for anomaly detection)
X_anomaly = df[['amount', 'category_encoded']]

model_anomaly = IsolationForest(
    contamination=0.1,  # 10% expected anomalies
    random_state=42,
    n_estimators=100
)

model_anomaly.fit(X_anomaly)
anomalies = model_anomaly.predict(X_anomaly)
n_anomalies = np.sum(anomalies == -1)
print(f"✅ Anomaly Detector trained")
print(f"   - Anomalies detected: {n_anomalies} out of {len(df)} records ({n_anomalies/len(df)*100:.1f}%)")

# ============ STEP 6: TRAIN MODEL 3 - TREND ANALYZER ============
print("\n📈 Step 6: Training Trend Analyzer (Linear Regression per category)...")

model_trend_dict = {}
df['year_month'] = df['date'].dt.to_period('M')

for category in df['category'].unique():
    cat_data = df[df['category'] == category].copy()
    
    # Group by month and sum amounts
    monthly_data = cat_data.groupby('year_month')['amount'].sum().reset_index()
    monthly_data.columns = ['year_month', 'total_amount']
    
    if len(monthly_data) >= 2:  # Need at least 2 points for regression
        # Convert year_month to numeric for regression
        monthly_data['month_num'] = np.arange(len(monthly_data))
        
        X_trend = monthly_data[['month_num']].values
        y_trend = monthly_data['total_amount'].values
        
        trend_model = LinearRegression()
        trend_model.fit(X_trend, y_trend)
        
        model_trend_dict[category] = {
            'model': trend_model,
            'slope': float(trend_model.coef_[0]),
            'intercept': float(trend_model.intercept_)
        }
        
        trend = 'increasing' if trend_model.coef_[0] > 0 else 'decreasing'
        print(f"   - {category}: {trend} (slope: {trend_model.coef_[0]:.2f})")
    else:
        model_trend_dict[category] = {'model': None, 'slope': 0, 'intercept': 0}

print(f"✅ Trend Analyzer trained for {len(model_trend_dict)} categories")

# ============ STEP 7: SAVE MODELS ============
print("\n💾 Step 7: Saving models...")

model_files = {
    'model_predictor.pkl': model_predictor,
    'model_anomaly.pkl': model_anomaly,
    'model_trend.pkl': model_trend_dict,
    'label_encoder.pkl': label_encoder
}

for filename, model in model_files.items():
    filepath = os.path.join(MODEL_DIR, filename)
    with open(filepath, 'wb') as f:
        pickle.dump(model, f)
    print(f"   ✅ Saved: {filename}")

# ============ STEP 8: SUMMARY ============
print("\n" + "=" * 60)
print("✅ TRAINING COMPLETE")
print("=" * 60)
print(f"\n📊 Training Summary:")
print(f"   - Total records processed: {len(df)}")
print(f"   - Predictor R² Score: {train_score:.4f}")
print(f"   - Anomalies detected: {n_anomalies}")
print(f"   - Categories tracked: {len(model_trend_dict)}")
print(f"\n🚀 Models saved in: {MODEL_DIR}")
print("\n✨ Ready to start Flask server!")
print("   Run: python app.py")
print("=" * 60)
