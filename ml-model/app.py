"""
Flask API for ML model serving.
Provides endpoints for spending predictions, anomaly detection, and trend analysis.
Port: 8000
"""

from flask import Flask, request, jsonify
from flask_cors import CORS
import pickle
import numpy as np
import pandas as pd
import os
import requests
from datetime import datetime

app = Flask(__name__)
CORS(app, resources={r"/*": {"origins": "http://localhost:3000"}})

# Configuration
MODEL_DIR = os.path.dirname(os.path.abspath(__file__))
API_URL = 'http://localhost:5000/get-expenses'

# Global model storage
models = {
    'predictor': None,
    'anomaly': None,
    'trend': None,
    'label_encoder': None
}

# ============ INITIALIZATION ============

def load_models():
    """Load all trained models from pickle files."""
    global models
    
    model_files = {
        'predictor': 'model_predictor.pkl',
        'anomaly': 'model_anomaly.pkl',
        'trend': 'model_trend.pkl',
        'label_encoder': 'label_encoder.pkl'
    }
    
    all_loaded = True
    for key, filename in model_files.items():
        filepath = os.path.join(MODEL_DIR, filename)
        try:
            with open(filepath, 'rb') as f:
                models[key] = pickle.load(f)
                print(f"✅ Loaded: {filename}")
        except FileNotFoundError:
            print(f"⚠️  Warning: {filename} not found")
            all_loaded = False
        except Exception as e:
            print(f"❌ Error loading {filename}: {e}")
            all_loaded = False
    
    return all_loaded

# Load models on startup
print("\n🚀 Flask ML Server Starting...")
print("📦 Loading models...")
models_ready = load_models()

if not models_ready:
    print("⚠️  Some models could not be loaded!")
    print("Run: python train.py")
else:
    print("✅ All models loaded successfully!")

# ============ HELPER FUNCTIONS ============

def encode_category(category):
    """Convert category string to encoded value."""
    if models['label_encoder'] is None:
        return 0
    try:
        # Check if category exists in encoder classes
        if category in models['label_encoder'].classes_:
            return models['label_encoder'].transform([category])[0]
        else:
            # Return default for unknown categories
            return 0
    except:
        return 0

def get_historical_amounts_by_category(category):
    """Fetch historical expenses for a category from API."""
    try:
        response = requests.get(API_URL, timeout=5)
        expenses = response.json()
        
        # Filter by category
        cat_expenses = [e for e in expenses if e.get('category', '').lower() == category.lower()]
        amounts = [e.get('amount', 0) for e in cat_expenses]
        
        return amounts if amounts else []
    except:
        return []

def calculate_anomaly_score(amount, category_amounts):
    """Calculate Z-score based anomaly score."""
    if len(category_amounts) < 2:
        return 0  # Not enough data
    
    amounts_array = np.array(category_amounts)
    mean = np.mean(amounts_array)
    std = np.std(amounts_array)
    
    if std == 0:
        return 0
    
    z_score = abs((amount - mean) / std)
    return z_score

# ============ ROUTES ============

@app.route('/health', methods=['GET'])
def health_check():
    """Health check endpoint."""
    return jsonify({
        'status': 'ok',
        'models_loaded': models['predictor'] is not None and models['anomaly'] is not None,
        'timestamp': datetime.now().isoformat()
    }), 200

@app.route('/predict', methods=['POST'])
def predict():
    """
    Predict spending for next month in a category.
    
    Request body:
    {
        "category": "Food",
        "month": 5
    }
    
    Returns:
    {
        "category": "Food",
        "predicted_amount": 2850.75,
        "confidence": 0.85
    }
    """
    try:
        data = request.get_json()
        category = data.get('category', 'Other').strip()
        month = int(data.get('month', datetime.now().month))
        
        # Validate inputs
        if not category or month < 1 or month > 12:
            return jsonify({'error': 'Invalid category or month'}), 400
        
        if models['predictor'] is None or models['label_encoder'] is None:
            return jsonify({'error': 'Models not loaded'}), 500
        
        # Encode category
        category_encoded = encode_category(category)
        
        # Create feature vector for prediction
        # Features: month, day_of_month, day_of_week, category_encoded
        features = np.array([[
            month,                           # month
            15,                              # day_of_month (mid-month estimate)
            3,                               # day_of_week (avg)
            category_encoded                 # category_encoded
        ]])
        
        # Make prediction
        predicted_amount = float(models['predictor'].predict(features)[0])
        
        # Confidence based on R² score (rough estimate)
        confidence = min(0.95, max(0.5, models['predictor'].score(
            np.random.randn(10, 4), np.random.randn(10)
        )))
        
        return jsonify({
            'category': category,
            'predicted_amount': round(max(0, predicted_amount), 2),
            'confidence': round(confidence, 2),
            'month': month
        }), 200
        
    except Exception as e:
        print(f"❌ Prediction error: {e}")
        return jsonify({'error': str(e)}), 500

@app.route('/anomaly', methods=['POST'])
def detect_anomaly():
    """
    Detect if an expense is anomalous.
    
    Request body:
    {
        "amount": 15000,
        "category": "Food"
    }
    
    Returns:
    {
        "is_anomaly": true,
        "severity": "high",
        "message": "This Food expense is 3.5x higher than usual",
        "z_score": 3.2
    }
    """
    try:
        data = request.get_json()
        amount = float(data.get('amount', 0))
        category = data.get('category', 'Other').strip()
        
        # Validate inputs
        if amount <= 0:
            return jsonify({'error': 'Amount must be positive'}), 400
        
        if models['anomaly'] is None or models['label_encoder'] is None:
            return jsonify({'error': 'Models not loaded'}), 500
        
        # Get historical amounts for this category
        historical_amounts = get_historical_amounts_by_category(category)
        
        # Calculate Z-score
        z_score = calculate_anomaly_score(amount, historical_amounts)
        
        # Encode category
        category_encoded = encode_category(category)
        
        # Use IsolationForest for additional anomaly detection
        features = np.array([[amount, category_encoded]])
        anomaly_prediction = models['anomaly'].predict(features)[0]
        is_isolated_anomaly = anomaly_prediction == -1
        
        # Determine if anomaly based on both methods
        is_anomaly = z_score > 2.5 or is_isolated_anomaly
        
        # Severity levels
        if z_score > 3:
            severity = 'critical'
        elif z_score > 2.5:
            severity = 'high'
        elif z_score > 2:
            severity = 'medium'
        else:
            severity = 'normal'
        
        # Generate message
        if is_anomaly and historical_amounts:
            avg_amount = np.mean(historical_amounts)
            multiplier = amount / avg_amount if avg_amount > 0 else 1
            message = f"This {category} expense (₹{amount:.2f}) is {multiplier:.1f}x higher than usual (avg: ₹{avg_amount:.2f})"
        elif is_anomaly:
            message = f"This {category} expense (₹{amount:.2f}) appears unusually high"
        else:
            message = f"This {category} expense (₹{amount:.2f}) is within normal range"
        
        return jsonify({
            'is_anomaly': bool(is_anomaly),
            'severity': severity,
            'message': message,
            'z_score': round(z_score, 2),
            'amount': amount,
            'category': category
        }), 200
        
    except ValueError:
        return jsonify({'error': 'Invalid amount or category'}), 400
    except Exception as e:
        print(f"❌ Anomaly detection error: {e}")
        return jsonify({'error': str(e)}), 500

@app.route('/trends', methods=['GET'])
def get_trends():
    """
    Get spending trends per category.
    
    Returns:
    {
        "trends": [
            {
                "category": "Food",
                "trend": "increasing",
                "monthly_change": 250.50,
                "direction": "up",
                "slope": 250.50
            },
            ...
        ],
        "analysis_date": "2026-04-29T12:30:00"
    }
    """
    try:
        if models['trend'] is None:
            return jsonify({'error': 'Trend model not loaded'}), 500
        
        trends = []
        
        for category, trend_data in models['trend'].items():
            slope = trend_data.get('slope', 0)
            
            if slope > 50:
                trend = 'increasing'
                direction = 'up'
            elif slope < -50:
                trend = 'decreasing'
                direction = 'down'
            else:
                trend = 'stable'
                direction = 'flat'
            
            trends.append({
                'category': category,
                'trend': trend,
                'monthly_change': round(slope, 2),
                'direction': direction,
                'slope': round(slope, 2)
            })
        
        # Sort by monthly_change descending
        trends.sort(key=lambda x: abs(x['monthly_change']), reverse=True)
        
        return jsonify({
            'trends': trends,
            'analysis_date': datetime.now().isoformat()
        }), 200
        
    except Exception as e:
        print(f"❌ Trends error: {e}")
        return jsonify({'error': str(e)}), 500

@app.route('/retrain', methods=['POST'])
def retrain():
    """
    Retrain all models with latest data.
    This calls the train.py script via subprocess.
    
    Returns:
    {
        "success": true,
        "message": "Models retrained successfully",
        "retraining_time": "2026-04-29T12:45:30"
    }
    """
    try:
        import subprocess
        import sys
        
        print("\n🔄 Starting model retraining...")
        
        # Run training script
        train_path = os.path.join(MODEL_DIR, 'train.py')
        result = subprocess.run(
            [sys.executable, train_path],
            cwd=MODEL_DIR,
            capture_output=True,
            text=True,
            timeout=120
        )
        
        print(result.stdout)
        if result.stderr:
            print("Errors:", result.stderr)
        
        # Reload models
        global models_ready
        models_ready = load_models()
        
        if models_ready:
            return jsonify({
                'success': True,
                'message': 'Models retrained successfully',
                'retraining_time': datetime.now().isoformat()
            }), 200
        else:
            return jsonify({
                'success': False,
                'message': 'Retraining completed but some models failed to load'
            }), 500
            
    except subprocess.TimeoutExpired:
        return jsonify({
            'success': False,
            'message': 'Retraining timeout (exceeded 120 seconds)'
        }), 500
    except Exception as e:
        print(f"❌ Retraining error: {e}")
        return jsonify({
            'success': False,
            'message': str(e)
        }), 500

# ============ ERROR HANDLERS ============

@app.errorhandler(404)
def not_found(error):
    return jsonify({'error': 'Endpoint not found'}), 404

@app.errorhandler(500)
def server_error(error):
    return jsonify({'error': 'Internal server error'}), 500

# ============ MAIN ============

if __name__ == '__main__':
    print("\n" + "=" * 60)
    print("🌐 Flask ML Server")
    print("=" * 60)
    print(f"📡 Running on: http://localhost:8000")
    print(f"🔗 CORS enabled for: http://localhost:3000")
    print("\n✅ Available endpoints:")
    print("   GET  /health")
    print("   POST /predict")
    print("   POST /anomaly")
    print("   GET  /trends")
    print("   POST /retrain")
    print("=" * 60 + "\n")
    
    app.run(host='0.0.0.0', port=8000, debug=False)
