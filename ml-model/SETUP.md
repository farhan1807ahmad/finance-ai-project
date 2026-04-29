# ML Model Integration Setup Guide

Complete setup instructions for the ML-powered finance AI project.

## 📋 Table of Contents

1. [Python Environment Setup](#python-environment-setup)
2. [Install Dependencies](#install-dependencies)
3. [Train ML Models](#train-ml-models)
4. [Start Services](#start-services)
5. [Verify Everything Works](#verify-everything-works)
6. [Troubleshooting](#troubleshooting)

---

## Python Environment Setup

### Windows (PowerShell)

**1. Create Python Virtual Environment**

```powershell
cd ml-model
python -m venv venv
.\venv\Scripts\Activate.ps1
```

**2. Verify Python Installation**

```powershell
python --version
pip --version
```

### macOS / Linux

**1. Create Python Virtual Environment**

```bash
cd ml-model
python3 -m venv venv
source venv/bin/activate
```

**2. Verify Python Installation**

```bash
python3 --version
pip --version
```

---

## Install Dependencies

Make sure your Python virtual environment is **activated**, then:

```bash
pip install -r requirements.txt
```

**Expected output:**

```
Successfully installed flask-2.3.3 flask-cors-4.0.0 scikit-learn-1.3.2
pandas-2.0.3 numpy-1.24.3 requests-2.31.0
```

---

## Train ML Models

### Prerequisites

- Node.js server must be running on `http://localhost:5000`
- Database must have at least 1 expense record (or use synthetic data)

### Run Training Script

```bash
python train.py
```

**Expected output:**

```
============================================================
🚀 STARTING ML MODEL TRAINING
============================================================

📡 Step 1: Fetching expense data from API...
✅ Fetched 42 records from API

🔧 Step 2: Preparing data for training...
📊 Dataset shape: (42, 5)

⚙️  Step 3: Engineering features...
✅ Features engineered

🎯 Step 4: Training Spending Predictor (Random Forest)...
✅ Spending Predictor trained
   - R² Score: 0.8234

🚨 Step 5: Training Anomaly Detector (Isolation Forest)...
✅ Anomaly Detector trained
   - Anomalies detected: 4 out of 42 records (9.5%)

📈 Step 6: Training Trend Analyzer (Linear Regression)...
✅ Trend Analyzer trained for 6 categories

💾 Step 7: Saving models...
✅ Saved: model_predictor.pkl
✅ Saved: model_anomaly.pkl
✅ Saved: model_trend.pkl
✅ Saved: label_encoder.pkl

✅ TRAINING COMPLETE
```

### Output Files

The script creates 4 pickle files in `ml-model/`:

- `model_predictor.pkl` - Spending prediction model
- `model_anomaly.pkl` - Anomaly detection model
- `model_trend.pkl` - Trend analysis model
- `label_encoder.pkl` - Category encoder

---

## Start Services

Run these in separate terminal windows:

### Terminal 1: Node.js Backend

```powershell
# Windows
cd server
npm install  # (first time only)
npm start
```

Expected output:

```
Server running on port 5000
✅ SQLite Database Connected
```

### Terminal 2: React Frontend

```powershell
# Windows
cd client
npm install  # (first time only)
npm start
```

Expected output:

```
Compiled successfully!
You can now view finance-app in the browser.
  Local:            http://localhost:3000
```

### Terminal 3: Python ML Server

Make sure you're in the **ml-model** directory with **virtual environment activated**:

```powershell
# Windows
cd ml-model
.\venv\Scripts\Activate.ps1
python app.py
```

Expected output:

```
============================================================
🌐 Flask ML Server
============================================================
📡 Running on: http://localhost:8000
🔗 CORS enabled for: http://localhost:3000

✅ Available endpoints:
   GET  /health
   POST /predict
   POST /anomaly
   GET  /trends
   POST /retrain
============================================================
```

---

## Verify Everything Works

### 1. Check Backend is Running

```bash
curl http://localhost:5000
# Output: API is running 🚀
```

### 2. Check ML Server is Running

```bash
curl http://localhost:8000/health
# Output: {"status":"ok","models_loaded":true}
```

### 3. Test Prediction Endpoint

```bash
curl -X POST http://localhost:8000/predict \
  -H "Content-Type: application/json" \
  -d '{"category":"Food","month":5}'

# Output:
# {"category":"Food","predicted_amount":2850.75,"confidence":0.85}
```

### 4. Test Anomaly Detection

```bash
curl -X POST http://localhost:8000/anomaly \
  -H "Content-Type: application/json" \
  -d '{"amount":10000,"category":"Food"}'

# Output:
# {"is_anomaly":true,"severity":"high","message":"This Food expense is 3.5x higher than usual"}
```

### 5. Test Trends Endpoint

```bash
curl http://localhost:8000/trends

# Output:
# {"trends":[{"category":"Food","trend":"increasing","monthly_change":250.5},...]}
```

### 6. Access React App

Open browser: `http://localhost:3000`

- Login with your credentials
- Navigate to "💡 AI Insights" page
- Should see predictions, anomalies, and trends

---

## Troubleshooting

### ❌ "Module not found: flask"

**Solution:**

```bash
# Ensure virtual environment is activated
pip install -r requirements.txt
```

### ❌ "Connection refused: localhost:5000"

**Solution:** Make sure Node.js backend is running in another terminal

```bash
cd server && npm start
```

### ❌ "No module named requests"

**Solution:**

```bash
pip install requests
```

### ❌ Flask server crashes with "Address already in use"

**Solution:** Port 8000 is already in use. Either:

- Kill the process using port 8000
- Or change the port in `app.py` (line ~280)

Windows:

```powershell
netstat -ano | findstr :8000
taskkill /PID <PID> /F
```

macOS/Linux:

```bash
lsof -i :8000
kill -9 <PID>
```

### ❌ "Models not loaded" error from Flask

**Solution:** Train models first

```bash
python train.py
```

### ❌ "Insufficient data" warning

**Solution:** Normal! The system will use synthetic data. Add more real expenses via the app to improve predictions.

### ❌ React app shows "Failed to fetch ML data"

**Solution:**

1. Verify ML server is running: `curl http://localhost:8000/health`
2. Check browser console for CORS errors
3. Ensure all three services are running (Backend, Frontend, ML)

### ❌ "Training data not found"

**Solution:**

- Add at least 1 expense through the React app
- Run `python train.py` again

---

## Project Structure

```
finance-ai-project/
├── server/
│   ├── index.js              # Node.js Express API
│   ├── db.js                 # SQLite database
│   ├── package.json
│   └── models/
│       ├── User.js
│       └── Expense.js
├── client/
│   ├── src/
│   │   ├── App.js
│   │   ├── pages/
│   │   │   └── Insights.js   # Updated with ML endpoints
│   │   └── components/
│   └── package.json
├── ml-model/
│   ├── app.py                # Flask ML server
│   ├── train.py              # Training script
│   ├── sample_data.py        # Synthetic data generator
│   ├── requirements.txt      # Python dependencies
│   ├── SETUP.md              # This file
│   └── venv/                 # Virtual environment
└── README.md
```

---

## Service Ports & URLs

| Service        | URL                   | Port | Language   |
| -------------- | --------------------- | ---- | ---------- |
| React Frontend | http://localhost:3000 | 3000 | JavaScript |
| Node Backend   | http://localhost:5000 | 5000 | JavaScript |
| ML Server      | http://localhost:8000 | 8000 | Python     |
| SQLite DB      | server/expenses.db    | -    | Data       |

---

## ML Endpoints Reference

### POST /predict

Predict spending for next month

```bash
Request:
{
  "category": "Food",
  "month": 5
}

Response:
{
  "category": "Food",
  "predicted_amount": 2850.75,
  "confidence": 0.85,
  "month": 5
}
```

### POST /anomaly

Detect unusual expenses

```bash
Request:
{
  "amount": 15000,
  "category": "Food"
}

Response:
{
  "is_anomaly": true,
  "severity": "high",
  "message": "This Food expense is 3.5x higher than usual",
  "z_score": 3.2
}
```

### GET /trends

Get category spending trends

```bash
Response:
{
  "trends": [
    {
      "category": "Food",
      "trend": "increasing",
      "monthly_change": 250.5,
      "direction": "up"
    },
    {
      "category": "Transport",
      "trend": "stable",
      "monthly_change": -10.2,
      "direction": "flat"
    }
  ],
  "analysis_date": "2026-04-29T12:45:30"
}
```

### POST /retrain

Retrain all models with latest data

```bash
Request: (empty body)

Response:
{
  "success": true,
  "message": "Models retrained successfully",
  "retraining_time": "2026-04-29T12:45:30"
}
```

### GET /health

Health check

```bash
Response:
{
  "status": "ok",
  "models_loaded": true,
  "timestamp": "2026-04-29T12:45:30"
}
```

---

## Performance Tips

1. **Train periodically** - Run `POST /retrain` weekly for better accuracy
2. **Add expense data** - More historical data = better predictions
3. **Use categories consistently** - Stick to: Food, Transport, Shopping, Bills, Health, Entertainment
4. **Monitor predictions** - Check if predictions match your actual spending

---

## Next Steps

1. ✅ Start all three services
2. ✅ Add some expenses through the React app
3. ✅ Retrain models with `python train.py`
4. ✅ Check AI Insights page for predictions & anomalies
5. ✅ Customize ML algorithms if needed (edit `train.py`)

---

## Support

For issues:

1. Check the Troubleshooting section above
2. Verify all services are running on correct ports
3. Check browser console & server logs for error messages
4. Ensure Python virtual environment is activated before running ML server

Happy tracking! 📊💰
