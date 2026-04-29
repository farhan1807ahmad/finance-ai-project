const express = require("express");
const cors = require("cors");
const jwt = require("jsonwebtoken");
const axios = require("axios");
require("dotenv").config();
const { addExpense, getExpenses, deleteExpense } = require("./db");
const User = require("./models/User");
const ExpensePredictionModel = require("../ml-model/expensePrediction");
const BudgetManager = require("../ml-model/budgetManager");
const AnomalyDetectionModel = require("../ml-model/anomalyDetection");
const BudgetOptimizationModel = require("../ml-model/budgetOptimization");

// Initialize OpenAI (optional - install with: npm install openai)
let OpenAI;
try {
  OpenAI = require("openai").default;
} catch (e) {
  console.log("⚠️  OpenAI package not installed. Install with: npm install openai");
}

const app = express();

app.use(cors());
app.use(express.json());

// Initialize User table
User.createTable();

// JWT Secret
const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key-change-in-production";

// Middleware to verify JWT token
const verifyToken = (req, res, next) => {
  const token = req.headers.authorization?.split(" ")[1];
  
  if (!token) {
    return res.status(401).json({ error: "No token provided" });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.userId = decoded.userId;
    next();
  } catch (error) {
    res.status(401).json({ error: "Invalid token" });
  }
};

app.get("/", (req, res) => {
  res.send("API is running 🚀");
});

// ============ AUTHENTICATION ROUTES ============

// Register
app.post("/auth/register", async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.register(email, password);

    // Generate JWT token
    const token = jwt.sign({ userId: user.id, email: user.email }, JWT_SECRET, {
      expiresIn: "7d",
    });

    res.status(201).json({
      message: "User registered successfully",
      user,
      token,
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Login
app.post("/auth/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.login(email, password);

    // Generate JWT token
    const token = jwt.sign({ userId: user.id, email: user.email }, JWT_SECRET, {
      expiresIn: "7d",
    });

    res.status(200).json({
      message: "Login successful",
      user,
      token,
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Get current user (protected route)
app.get("/auth/me", verifyToken, (req, res) => {
  try {
    const user = User.getUserById(req.userId);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }
    res.json(user);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});


// Add Expense API
app.post("/add-expense", async (req, res) => {
  try {
    const { description, amount, category, notes } = req.body;

    if (!description || !amount || !category) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    const newExpense = addExpense(description, parseFloat(amount), category, notes);

    // Check for anomalies using ML service
    let anomalyCheck = { is_anomaly: false, message: "Normal expense" };
    try {
      const anomalyResponse = await axios.post('http://localhost:8000/anomaly', {
        amount: parseFloat(amount),
        category: category
      }, { timeout: 5000 });
      anomalyCheck = anomalyResponse.data;
    } catch (error) {
      console.log("⚠️  ML anomaly check unavailable, skipping...");
      // Continue without anomaly check if ML service is down
    }

    res.status(201).json({
      message: "Expense added successfully",
      data: newExpense,
      anomaly_check: anomalyCheck
    });

  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Get All Expenses API
app.get("/get-expenses", async (req, res) => {
  try {
    const expenses = getExpenses();
    res.status(200).json(expenses);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Delete Expense API
app.delete("/delete-expense/:id", async (req, res) => {
  try {
    const { id } = req.params;
    deleteExpense(id);

    res.status(200).json({
      message: "Expense deleted successfully"
    });

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Analytics: Category Breakdown
app.get("/analytics/category-breakdown", (req, res) => {
  try {
    const expenses = getExpenses();
    
    const categoryBreakdown = {};
    expenses.forEach(expense => {
      categoryBreakdown[expense.category] = (categoryBreakdown[expense.category] || 0) + expense.amount;
    });

    const data = Object.entries(categoryBreakdown).map(([category, amount]) => ({
      category,
      amount: parseFloat(amount.toFixed(2))
    }));

    res.status(200).json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Analytics: Spending Trend (last 7 days)
app.get("/analytics/spending-trend", (req, res) => {
  try {
    const expenses = getExpenses();
    const today = new Date();
    const last7Days = {};

    for (let i = 6; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      const dateKey = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      last7Days[dateKey] = 0;
    }

    expenses.forEach(expense => {
      const expenseDate = new Date(expense.date);
      const dateKey = expenseDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      if (dateKey in last7Days) {
        last7Days[dateKey] += expense.amount;
      }
    });

    const data = Object.entries(last7Days).map(([date, amount]) => ({
      date,
      amount: parseFloat(amount.toFixed(2))
    }));

    res.status(200).json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Analytics: Summary Stats
app.get("/analytics/summary", (req, res) => {
  try {
    const expenses = getExpenses();
    
    const totalSpent = expenses.reduce((sum, exp) => sum + exp.amount, 0);
    const categories = [...new Set(expenses.map(exp => exp.category))];
    const topCategory = Object.entries(
      expenses.reduce((acc, exp) => {
        acc[exp.category] = (acc[exp.category] || 0) + exp.amount;
        return acc;
      }, {})
    ).sort((a, b) => b[1] - a[1])[0];

    const thisMonth = expenses.filter(exp => {
      const expenseDate = new Date(exp.date);
      const today = new Date();
      return expenseDate.getMonth() === today.getMonth() && 
             expenseDate.getFullYear() === today.getFullYear();
    });

    const monthlyAverage = thisMonth.length > 0 
      ? (thisMonth.reduce((sum, exp) => sum + exp.amount, 0) / thisMonth.length).toFixed(2)
      : 0;

    const monthlySpend = thisMonth.length > 0 
      ? thisMonth.reduce((sum, exp) => sum + exp.amount, 0).toFixed(2)
      : 0;

    res.status(200).json({
      totalSpent: parseFloat(totalSpent.toFixed(2)),
      categoryCount: categories.length,
      topCategory: topCategory?.[0] || 'N/A',
      monthlySpend: parseFloat(monthlySpend),
      averageTransaction: parseFloat(monthlyAverage),
      transactionCount: expenses.length
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ============ AI INSIGHTS ENDPOINT ============

app.get("/insights/ai", async (req, res) => {
  try {
    if (!OpenAI) {
      return res.status(500).json({ 
        error: "OpenAI not configured. Install with: npm install openai" 
      });
    }

    if (!process.env.OPENAI_API_KEY) {
      return res.status(500).json({ 
        error: "OPENAI_API_KEY not set in .env file" 
      });
    }

    const expenses = getExpenses();

    if (expenses.length === 0) {
      return res.status(200).json({
        insights: "No expense data available yet. Start adding expenses to get personalized financial insights!",
        recommendations: []
      });
    }

    // Prepare data for AI analysis
    const categorySpending = {};
    expenses.forEach(exp => {
      categorySpending[exp.category] = (categorySpending[exp.category] || 0) + exp.amount;
    });

    const totalSpent = expenses.reduce((sum, exp) => sum + exp.amount, 0);
    const avgTransaction = (totalSpent / expenses.length).toFixed(2);
    const topCategory = Object.entries(categorySpending).sort((a, b) => b[1] - a[1])[0];

    const thisMonth = expenses.filter(exp => {
      const expenseDate = new Date(exp.date);
      const today = new Date();
      return expenseDate.getMonth() === today.getMonth() && 
             expenseDate.getFullYear() === today.getFullYear();
    });

    const monthlySpend = thisMonth.reduce((sum, exp) => sum + exp.amount, 0).toFixed(2);

    // Create prompt for AI
    const prompt = `Analyze this personal finance data and provide 3-4 specific, actionable insights:

Total Expenses: ₹${totalSpent.toFixed(2)}
Number of Transactions: ${expenses.length}
Average Transaction: ₹${avgTransaction}
This Month's Spending: ₹${monthlySpend}
Top Category: ${topCategory[0]} (₹${topCategory[1].toFixed(2)})

Category Breakdown:
${Object.entries(categorySpending)
  .sort((a, b) => b[1] - a[1])
  .map(([cat, amount]) => `- ${cat}: ₹${amount.toFixed(2)}`)
  .join('\n')}

Please provide:
1. A brief overall spending assessment
2. 2-3 specific money-saving recommendations
3. One positive observation about their spending habits
Keep the response concise and actionable.`;

    // Call OpenAI API
    const client = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY
    });

    const message = await client.messages.create({
      model: "claude-3-5-sonnet-20241022",
      max_tokens: 1024,
      messages: [
        {
          role: "user",
          content: prompt
        }
      ]
    });

    const insights = message.content[0].type === 'text' ? message.content[0].text : '';

    res.status(200).json({
      insights: insights,
      summary: {
        totalSpent: parseFloat(totalSpent.toFixed(2)),
        monthlySpend: parseFloat(monthlySpend),
        topCategory: topCategory[0],
        transactionCount: expenses.length
      }
    });
  } catch (error) {
    console.error("AI Insights Error:", error.message);
    res.status(500).json({ 
      error: "Failed to generate insights: " + error.message 
    });
  }
});

// ============ EXPENSE PREDICTION ENDPOINT ============

app.get("/predictions/expense", async (req, res) => {
  try {
    const expenses = getExpenses();

    if (expenses.length === 0) {
      return res.status(200).json({
        error: "No expense data available yet. Start adding expenses to get spending predictions!",
        predictions: {}
      });
    }

    // Generate forecast using ML model
    const forecast = ExpensePredictionModel.generateForecast(expenses);

    res.status(200).json({
      forecast: forecast,
      generated_at: new Date().toISOString()
    });
  } catch (error) {
    console.error("Expense Prediction Error:", error.message);
    res.status(500).json({ 
      error: "Failed to generate predictions: " + error.message 
    });
  }
});

// ============ BUDGET MANAGEMENT ENDPOINTS ============

app.post("/budgets/set", (req, res) => {
  try {
    const { category, amount } = req.body;
    
    if (!category || !amount) {
      return res.status(400).json({ error: "Category and amount are required" });
    }

    const budget = BudgetManager.setBudget(category, amount);
    res.status(201).json({
      message: "Budget set successfully",
      budget
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

app.get("/budgets", (req, res) => {
  try {
    const budgets = BudgetManager.getAllBudgets();
    res.status(200).json(budgets);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get("/budgets/:category", (req, res) => {
  try {
    const { category } = req.params;
    const budget = BudgetManager.getBudget(category);
    
    if (!budget) {
      return res.status(404).json({ error: "Budget not found" });
    }

    res.status(200).json(budget);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.delete("/budgets/:category", (req, res) => {
  try {
    const { category } = req.params;
    const success = BudgetManager.deleteBudget(category);
    
    if (!success) {
      return res.status(404).json({ error: "Budget not found" });
    }

    res.status(200).json({ message: "Budget deleted successfully" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get("/budgets-summary", (req, res) => {
  try {
    const expenses = getExpenses();
    const summary = BudgetManager.getBudgetSummary(expenses);
    
    res.status(200).json({
      summary,
      generated_at: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ============ ANOMALY DETECTION ENDPOINT ============

app.get("/anomalies/detect", (req, res) => {
  try {
    const expenses = getExpenses();

    if (expenses.length === 0) {
      return res.status(200).json({
        error: "No expense data available",
        report: {}
      });
    }

    const report = AnomalyDetectionModel.generateAnomalyReport(expenses);

    res.status(200).json({
      report,
      generated_at: new Date().toISOString()
    });
  } catch (error) {
    console.error("Anomaly Detection Error:", error.message);
    res.status(500).json({ 
      error: "Failed to detect anomalies: " + error.message 
    });
  }
});

// ============ BUDGET OPTIMIZATION ENDPOINT ============

app.get("/optimize/budgets", (req, res) => {
  try {
    const expenses = getExpenses();

    if (expenses.length === 0) {
      return res.status(200).json({
        error: "No expense data available",
        optimization: {}
      });
    }

    const optimization = BudgetOptimizationModel.suggestOptimalBudgets(expenses);
    const budgets = BudgetManager.getAllBudgets();
    const health = BudgetOptimizationModel.calculateBudgetHealth(expenses, budgets);

    res.status(200).json({
      optimization,
      budget_health: health,
      generated_at: new Date().toISOString()
    });
  } catch (error) {
    console.error("Budget Optimization Error:", error.message);
    res.status(500).json({ 
      error: "Failed to optimize budgets: " + error.message 
    });
  }
});

// ============ EXPORT PREDICTIONS ENDPOINT ============

app.get("/export/predictions", (req, res) => {
  try {
    const expenses = getExpenses();

    if (expenses.length === 0) {
      return res.status(200).json({
        error: "No expense data available"
      });
    }

    const forecast = ExpensePredictionModel.generateForecast(expenses);
    const budgetSummary = BudgetManager.getBudgetSummary(expenses);

    // Create CSV format
    let csv = "Expense Prediction Export\n";
    csv += `Generated: ${new Date().toISOString()}\n\n`;
    
    csv += "BUDGET SUMMARY\n";
    csv += "Total Monthly Prediction,₹" + forecast.total_predicted_next_month + "\n";
    csv += "Total Budgets,₹" + budgetSummary.total_limit + "\n";
    csv += "Total Spent,₹" + budgetSummary.total_spent + "\n";
    csv += "Budget Health," + budgetSummary.budget_health + "%\n\n";

    csv += "CATEGORY PREDICTIONS\n";
    csv += "Category,Historical Avg,Trend,Next Month Prediction,Lower Bound,Upper Bound,Confidence\n";

    Object.entries(forecast.predictions).forEach(([category, data]) => {
      const pred = data.predictions[0];
      csv += `${category},₹${data.historical_average},${data.trend_direction},₹${pred.predicted},₹${pred.lower_bound},₹${pred.upper_bound},${pred.confidence.toFixed(0)}%\n`;
    });

    csv += "\n\nHIGH RISK CATEGORIES\n";
    csv += "Category,Predicted Amount,Trend Strength\n";
    forecast.high_risk_categories.forEach(risk => {
      csv += `${risk.category},₹${risk.predicted},₹${risk.trend_strength.toFixed(2)}/month\n`;
    });

    res.header("Content-Type", "text/csv");
    res.header("Content-Disposition", "attachment; filename=predictions.csv");
    res.send(csv);
  } catch (error) {
    console.error("Export Error:", error.message);
    res.status(500).json({ 
      error: "Failed to export predictions: " + error.message 
    });
  }
});

app.get("/export/full-report", (req, res) => {
  try {
    const expenses = getExpenses();

    if (expenses.length === 0) {
      return res.status(200).json({
        error: "No expense data available"
      });
    }

    const forecast = ExpensePredictionModel.generateForecast(expenses);
    const anomalies = AnomalyDetectionModel.generateAnomalyReport(expenses);
    const optimization = BudgetOptimizationModel.suggestOptimalBudgets(expenses);
    const budgetSummary = BudgetManager.getBudgetSummary(expenses);

    // Return comprehensive JSON report
    const report = {
      generated_at: new Date().toISOString(),
      forecast,
      anomalies,
      optimization,
      budget_summary: budgetSummary
    };

    res.header("Content-Type", "application/json");
    res.header("Content-Disposition", "attachment; filename=full-report.json");
    res.json(report);
  } catch (error) {
    console.error("Export Error:", error.message);
    res.status(500).json({ 
      error: "Failed to export report: " + error.message 
    });
  }
});

// ============ ML MODEL PROXY ROUTES ============

const ML_URL = 'http://localhost:8000';

// ML: Spending Predictions
app.post("/ml/predict", async (req, res) => {
  try {
    const response = await axios.post(`${ML_URL}/predict`, req.body, { timeout: 10000 });
    res.json(response.data);
  } catch (error) {
    console.error("ML Predict Error:", error.message);
    res.status(error.response?.status || 500).json({
      error: "Failed to get spending prediction: " + error.message
    });
  }
});

// ML: Anomaly Detection
app.post("/ml/anomaly", async (req, res) => {
  try {
    const response = await axios.post(`${ML_URL}/anomaly`, req.body, { timeout: 10000 });
    res.json(response.data);
  } catch (error) {
    console.error("ML Anomaly Error:", error.message);
    res.status(error.response?.status || 500).json({
      error: "Failed to detect anomalies: " + error.message
    });
  }
});

// ML: Spending Trends
app.get("/ml/trends", async (req, res) => {
  try {
    const response = await axios.get(`${ML_URL}/trends`, { timeout: 10000 });
    res.json(response.data);
  } catch (error) {
    console.error("ML Trends Error:", error.message);
    res.status(error.response?.status || 500).json({
      error: "Failed to fetch spending trends: " + error.message
    });
  }
});

// ML: Retrain Models
app.post("/ml/retrain", async (req, res) => {
  try {
    const response = await axios.post(`${ML_URL}/retrain`, {}, { timeout: 120000 });
    res.json(response.data);
  } catch (error) {
    console.error("ML Retrain Error:", error.message);
    res.status(error.response?.status || 500).json({
      error: "Failed to retrain models: " + error.message
    });
  }
});

// ML: Health Check
app.get("/ml/health", async (req, res) => {
  try {
    const response = await axios.get(`${ML_URL}/health`, { timeout: 5000 });
    res.json(response.data);
  } catch (error) {
    res.status(503).json({
      error: "ML service unavailable",
      message: error.message
    });
  }
});