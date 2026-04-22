/**
 * Expense Prediction Model
 * Predicts future spending in each category using trend analysis
 */

class ExpensePredictionModel {
  /**
   * Calculate average spending per category per month
   * @param {Array} expenses - Array of expense objects
   * @returns {Object} Object with category spending trends
   */
  static analyzeSpendingTrends(expenses) {
    const monthlyData = {};

    // Group expenses by category and month
    expenses.forEach(expense => {
      const date = new Date(expense.date);
      const yearMonth = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      const category = expense.category;

      if (!monthlyData[category]) {
        monthlyData[category] = {};
      }
      if (!monthlyData[category][yearMonth]) {
        monthlyData[category][yearMonth] = 0;
      }

      monthlyData[category][yearMonth] += expense.amount;
    });

    return monthlyData;
  }

  /**
   * Calculate linear regression trend
   * @param {Array} values - Array of spending values
   * @returns {Object} Slope and intercept for trend line
   */
  static calculateTrend(values) {
    if (values.length < 2) {
      return { slope: 0, intercept: values[0] || 0 };
    }

    const n = values.length;
    const xValues = Array.from({ length: n }, (_, i) => i);
    const sumX = xValues.reduce((a, b) => a + b, 0);
    const sumY = values.reduce((a, b) => a + b, 0);
    const sumXY = xValues.reduce((sum, x, i) => sum + x * values[i], 0);
    const sumX2 = xValues.reduce((sum, x) => sum + x * x, 0);

    const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
    const intercept = (sumY - slope * sumX) / n;

    return { slope, intercept };
  }

  /**
   * Predict next N months of spending for each category
   * @param {Array} expenses - Array of expense objects
   * @param {Number} monthsToPredict - Number of months to predict (default: 3)
   * @returns {Object} Predictions for each category
   */
  static predictSpending(expenses, monthsToPredict = 3) {
    const monthlyData = this.analyzeSpendingTrends(expenses);
    const predictions = {};
    const today = new Date();

    Object.entries(monthlyData).forEach(([category, monthlySpending]) => {
      // Get sorted months
      const months = Object.keys(monthlySpending).sort();
      const values = months.map(month => monthlySpending[month]);

      // Calculate statistics
      const average = values.reduce((a, b) => a + b, 0) / values.length;
      const trend = this.calculateTrend(values);
      const stdDev = this.calculateStandardDeviation(values, average);

      // Generate predictions for next N months
      const categoryPredictions = [];
      for (let i = 1; i <= monthsToPredict; i++) {
        const predictedValue = trend.intercept + trend.slope * (values.length + i - 1);
        const nextMonth = new Date(today.getFullYear(), today.getMonth() + i, 1);

        categoryPredictions.push({
          month: `${nextMonth.getFullYear()}-${String(nextMonth.getMonth() + 1).padStart(2, '0')}`,
          predicted: Math.max(0, parseFloat(predictedValue.toFixed(2))), // Don't predict negative spending
          lower_bound: Math.max(0, parseFloat((predictedValue - stdDev).toFixed(2))),
          upper_bound: parseFloat((predictedValue + stdDev).toFixed(2)),
          confidence: (1 - (stdDev / (average + 1))) * 100 // Confidence as percentage
        });
      }

      predictions[category] = {
        historical_average: parseFloat(average.toFixed(2)),
        trend_direction: trend.slope > 0 ? 'increasing' : trend.slope < 0 ? 'decreasing' : 'stable',
        trend_strength: Math.abs(trend.slope),
        predictions: categoryPredictions,
        last_months: values.slice(-3) // Last 3 months for reference
      };
    });

    return predictions;
  }

  /**
   * Calculate standard deviation
   * @param {Array} values - Array of numbers
   * @param {Number} average - Average of the values
   * @returns {Number} Standard deviation
   */
  static calculateStandardDeviation(values, average) {
    const squareDiffs = values.map(value => Math.pow(value - average, 2));
    const avgSquareDiff = squareDiffs.reduce((a, b) => a + b, 0) / values.length;
    return Math.sqrt(avgSquareDiff);
  }

  /**
   * Generate spending forecast summary
   * @param {Array} expenses - Array of expense objects
   * @returns {Object} Summary with total predictions and recommendations
   */
  static generateForecast(expenses) {
    if (expenses.length === 0) {
      return {
        error: 'No expense data available for prediction',
        predictions: {}
      };
    }

    const predictions = this.predictSpending(expenses, 3);
    let totalPredicted = 0;
    let highRiskCategories = [];

    Object.entries(predictions).forEach(([category, data]) => {
      const nextMonth = data.predictions[0];
      totalPredicted += nextMonth.predicted;

      // Identify categories with increasing trend and high spending
      if (data.trend_direction === 'increasing' && nextMonth.predicted > 100) {
        highRiskCategories.push({
          category,
          predicted: nextMonth.predicted,
          trend_strength: parseFloat(data.trend_strength.toFixed(2))
        });
      }
    });

    highRiskCategories.sort((a, b) => b.predicted - a.predicted);

    return {
      total_predicted_next_month: parseFloat(totalPredicted.toFixed(2)),
      predictions,
      high_risk_categories: highRiskCategories.slice(0, 3),
      recommendations: this.generateRecommendations(predictions, highRiskCategories)
    };
  }

  /**
   * Generate recommendations based on predictions
   * @param {Object} predictions - Predictions object
   * @param {Array} riskCategories - Categories with high risk
   * @returns {Array} Array of recommendations
   */
  static generateRecommendations(predictions, riskCategories) {
    const recommendations = [];

    // Check for increasing trends
    riskCategories.forEach(risk => {
      recommendations.push({
        type: 'warning',
        category: risk.category,
        message: `Your ${risk.category} spending is increasing (trend: ${risk.trend_strength.toFixed(2)}/month). Consider setting a budget limit.`
      });
    });

    // Check for stable or decreasing trends (positive feedback)
    Object.entries(predictions).forEach(([category, data]) => {
      if (data.trend_direction === 'decreasing') {
        recommendations.push({
          type: 'positive',
          category,
          message: `Great job! Your ${category} spending is decreasing. Keep up the good work!`
        });
      }
    });

    // General recommendation if no high-risk categories
    if (recommendations.length === 0) {
      recommendations.push({
        type: 'info',
        message: 'Your spending patterns are stable. Continue monitoring and maintain your current budget.'
      });
    }

    return recommendations;
  }
}

module.exports = ExpensePredictionModel;
