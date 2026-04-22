/**
 * Anomaly Detection Model
 * Detects unusual spending patterns and suspicious transactions
 */

class AnomalyDetectionModel {
  /**
   * Calculate mean and standard deviation for a dataset
   * @param {Array} values - Array of numbers
   * @returns {object} Mean and standard deviation
   */
  static calculateStats(values) {
    if (values.length === 0) return { mean: 0, stdDev: 0 };

    const mean = values.reduce((a, b) => a + b, 0) / values.length;
    const variance = values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / values.length;
    const stdDev = Math.sqrt(variance);

    return { mean, stdDev };
  }

  /**
   * Detect anomalies using Z-score method (3-sigma rule)
   * @param {Array} expenses - Array of expense objects
   * @param {number} threshold - Z-score threshold (default: 2.5, higher = more conservative)
   * @returns {Array} Array of anomalies
   */
  static detectAnomalies(expenses, threshold = 2.5) {
    const anomalies = [];
    const categoryTransactions = {};

    // Group by category
    expenses.forEach(expense => {
      if (!categoryTransactions[expense.category]) {
        categoryTransactions[expense.category] = [];
      }
      categoryTransactions[expense.category].push(expense);
    });

    // Check each category
    Object.entries(categoryTransactions).forEach(([category, transactions]) => {
      if (transactions.length < 3) return; // Need at least 3 transactions

      const amounts = transactions.map(t => t.amount);
      const { mean, stdDev } = this.calculateStats(amounts);

      // Find anomalies using Z-score
      transactions.forEach(transaction => {
        if (stdDev > 0) {
          const zScore = Math.abs((transaction.amount - mean) / stdDev);
          
          if (zScore > threshold) {
            anomalies.push({
              id: transaction.id,
              description: transaction.description,
              category,
              amount: transaction.amount,
              date: transaction.date,
              severity: zScore > 4 ? 'high' : zScore > 3 ? 'medium' : 'low',
              reason: `Amount is ${(zScore).toFixed(2)} standard deviations from category average`,
              categoryAverage: mean,
              categoryStdDev: stdDev,
              zScore: parseFloat(zScore.toFixed(2))
            });
          }
        }
      });
    });

    return anomalies.sort((a, b) => b.zScore - a.zScore);
  }

  /**
   * Analyze spending patterns for unusual changes
   * @param {Array} expenses - Array of expense objects
   * @returns {Array} Array of pattern anomalies
   */
  static detectPatternChanges(expenses) {
    const monthlyData = {};
    const anomalies = [];

    // Group by category and month
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

    // Detect significant changes
    Object.entries(monthlyData).forEach(([category, months]) => {
      const sortedMonths = Object.entries(months).sort((a, b) => 
        new Date(a[0]) - new Date(b[0])
      );

      for (let i = 1; i < sortedMonths.length; i++) {
        const prevAmount = sortedMonths[i - 1][1];
        const currAmount = sortedMonths[i][1];
        const changePercent = ((currAmount - prevAmount) / prevAmount) * 100;

        if (Math.abs(changePercent) > 50) {
          anomalies.push({
            category,
            month: sortedMonths[i][0],
            previousMonth: sortedMonths[i - 1][0],
            previousAmount: parseFloat(prevAmount.toFixed(2)),
            currentAmount: parseFloat(currAmount.toFixed(2)),
            changePercent: parseFloat(changePercent.toFixed(2)),
            direction: changePercent > 0 ? 'increase' : 'decrease',
            severity: Math.abs(changePercent) > 100 ? 'high' : 'medium',
            message: `${category} spending ${changePercent > 0 ? 'increased' : 'decreased'} by ${Math.abs(changePercent).toFixed(0)}%`
          });
        }
      }
    });

    return anomalies;
  }

  /**
   * Get anomaly report
   * @param {Array} expenses - Array of expense objects
   * @returns {object} Comprehensive anomaly report
   */
  static generateAnomalyReport(expenses) {
    const transactionAnomalies = this.detectAnomalies(expenses);
    const patternAnomalies = this.detectPatternChanges(expenses);

    const severity = {
      high: transactionAnomalies.filter(a => a.severity === 'high').length,
      medium: transactionAnomalies.filter(a => a.severity === 'medium').length,
      low: transactionAnomalies.filter(a => a.severity === 'low').length
    };

    return {
      transaction_anomalies: transactionAnomalies.slice(0, 10), // Top 10
      pattern_anomalies: patternAnomalies,
      total_anomalies: transactionAnomalies.length + patternAnomalies.length,
      severity_breakdown: severity,
      overall_risk: severity.high > 0 ? 'high' : severity.medium > 2 ? 'medium' : 'low',
      recommendations: this.generateRecommendations(transactionAnomalies, patternAnomalies)
    };
  }

  /**
   * Generate recommendations based on anomalies
   * @param {Array} transactions - Transaction anomalies
   * @param {Array} patterns - Pattern anomalies
   * @returns {Array} Recommendations
   */
  static generateRecommendations(transactions, patterns) {
    const recommendations = [];

    // High value transaction warnings
    const highValueTrans = transactions.filter(a => a.severity === 'high');
    if (highValueTrans.length > 0) {
      recommendations.push({
        type: 'alert',
        message: `Found ${highValueTrans.length} unusually high transaction(s). Review them for potential errors or fraud.`
      });
    }

    // Pattern changes
    if (patterns.length > 0) {
      const increases = patterns.filter(p => p.direction === 'increase');
      if (increases.length > 0) {
        recommendations.push({
          type: 'warning',
          message: `${increases.length} category(ies) show significant spending increases. Consider reviewing your budget.`
        });
      }
    }

    // General recommendation
    if (recommendations.length === 0) {
      recommendations.push({
        type: 'info',
        message: 'Your spending patterns look normal. Keep monitoring for consistency.'
      });
    }

    return recommendations;
  }
}

module.exports = AnomalyDetectionModel;
