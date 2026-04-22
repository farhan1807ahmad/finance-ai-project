/**
 * Budget Optimization Model
 * Provides smart recommendations for budget allocation
 */

class BudgetOptimizationModel {
  /**
   * Analyze category spending and suggest optimized budgets
   * @param {Array} expenses - Array of expense objects
   * @param {number} months - Number of months to analyze (default: 3)
   * @returns {object} Budget recommendations
   */
  static analyzeCategorySpending(expenses, months = 3) {
    const monthlyData = {};
    const cutoffDate = new Date();
    cutoffDate.setMonth(cutoffDate.getMonth() - months);

    // Filter expenses from last N months
    const recentExpenses = expenses.filter(exp => 
      new Date(exp.date) >= cutoffDate
    );

    // Group by category and calculate monthly averages
    recentExpenses.forEach(expense => {
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

    // Calculate statistics for each category
    const categoryStats = {};
    Object.entries(monthlyData).forEach(([category, monthData]) => {
      const amounts = Object.values(monthData);
      const average = amounts.reduce((a, b) => a + b, 0) / amounts.length;
      const max = Math.max(...amounts);
      const min = Math.min(...amounts);
      const variance = amounts.reduce((sum, val) => sum + Math.pow(val - average, 2), 0) / amounts.length;
      const stdDev = Math.sqrt(variance);

      categoryStats[category] = {
        average: parseFloat(average.toFixed(2)),
        min: parseFloat(min.toFixed(2)),
        max: parseFloat(max.toFixed(2)),
        stdDev: parseFloat(stdDev.toFixed(2)),
        transactions: amounts.length,
        volatility: parseFloat((stdDev / average * 100).toFixed(2)) // Coefficient of variation
      };
    });

    return categoryStats;
  }

  /**
   * Suggest optimal budgets based on 50-30-20 rule and actual spending
   * @param {Array} expenses - Array of expense objects
   * @returns {object} Budget recommendations
   */
  static suggestOptimalBudgets(expenses) {
    if (expenses.length === 0) {
      return { error: 'No expense data available' };
    }

    const categoryStats = this.analyzeCategorySpending(expenses, 3);
    const totalMonthly = Object.values(categoryStats).reduce((sum, cat) => sum + cat.average, 0);

    // Categorize spending
    const essential = ['Food', 'Transportation', 'Utilities', 'Health'];
    const discretionary = ['Entertainment', 'Shopping'];

    let essentialSpend = 0;
    let discretionarySpend = 0;
    let otherSpend = 0;

    Object.entries(categoryStats).forEach(([category, stats]) => {
      if (essential.includes(category)) {
        essentialSpend += stats.average;
      } else if (discretionary.includes(category)) {
        discretionarySpend += stats.average;
      } else {
        otherSpend += stats.average;
      }
    });

    // Apply 50-30-20 rule
    const fiftyPercent = totalMonthly * 0.5;
    const thirtyPercent = totalMonthly * 0.3;
    const twentyPercent = totalMonthly * 0.2;

    // Generate recommendations
    const recommendations = [];
    const budgets = {};

    Object.entries(categoryStats).forEach(([category, stats]) => {
      let recommendedBudget;
      let reasoning = '';

      if (essential.includes(category)) {
        // Essential: should be part of 50%
        recommendedBudget = Math.max(stats.average * 1.1, stats.max); // Add 10% buffer
        reasoning = 'Essential category - recommended to include 10% buffer';
      } else if (discretionary.includes(category)) {
        // Discretionary: should be part of 30%
        recommendedBudget = Math.max(stats.average * 1.05, stats.max);
        reasoning = 'Discretionary category - can be reduced';
      } else {
        // Other: should be part of 20%
        recommendedBudget = Math.max(stats.average * 1.05, stats.max);
        reasoning = 'Other spending - monitor closely';
      }

      budgets[category] = parseFloat(recommendedBudget.toFixed(2));

      // Check if optimization is needed
      if (stats.average > fiftyPercent / 3 && essential.includes(category)) {
        recommendations.push({
          category,
          type: 'warning',
          message: `${category} is above ideal essential spending. Consider reviewing.`,
          current: stats.average,
          suggested: recommendedBudget
        });
      } else if (stats.volatility > 50) {
        recommendations.push({
          category,
          type: 'info',
          message: `${category} spending is volatile (${stats.volatility.toFixed(0)}% variation). Set a stricter budget.`,
          current: stats.average,
          suggested: recommendedBudget
        });
      }
    });

    // Add positive recommendations
    const lowVolatility = Object.entries(categoryStats)
      .filter(([_, stats]) => stats.volatility < 20)
      .map(([cat]) => cat);

    if (lowVolatility.length > 0) {
      recommendations.push({
        type: 'positive',
        message: `${lowVolatility.join(', ')} have stable spending. Good control!`
      });
    }

    return {
      current_monthly_average: parseFloat(totalMonthly.toFixed(2)),
      breakdown: {
        essential: {
          categories: essential.filter(cat => categoryStats[cat]),
          current_spend: parseFloat(essentialSpend.toFixed(2)),
          recommended_percent: 50,
          recommended_amount: parseFloat((totalMonthly * 0.5).toFixed(2))
        },
        discretionary: {
          categories: discretionary.filter(cat => categoryStats[cat]),
          current_spend: parseFloat(discretionarySpend.toFixed(2)),
          recommended_percent: 30,
          recommended_amount: parseFloat((totalMonthly * 0.3).toFixed(2))
        },
        other: {
          current_spend: parseFloat(otherSpend.toFixed(2)),
          recommended_percent: 20,
          recommended_amount: parseFloat((totalMonthly * 0.2).toFixed(2))
        }
      },
      suggested_budgets: budgets,
      recommendations,
      savings_potential: this.calculateSavingsPotential(categoryStats, budgets)
    };
  }

  /**
   * Calculate potential savings
   * @param {object} categoryStats - Category statistics
   * @param {object} budgets - Suggested budgets
   * @returns {object} Savings analysis
   */
  static calculateSavingsPotential(categoryStats, budgets) {
    let totalSavings = 0;
    const savingsByCategory = [];

    Object.entries(categoryStats).forEach(([category, stats]) => {
      const currentMonthly = stats.average;
      const suggestedBudget = budgets[category];
      const potentialSaving = currentMonthly - suggestedBudget;

      if (potentialSaving > 0) {
        savingsByCategory.push({
          category,
          current: currentMonthly,
          suggested: suggestedBudget,
          potential_saving: parseFloat(potentialSaving.toFixed(2)),
          saving_percent: parseFloat(((potentialSaving / currentMonthly) * 100).toFixed(2))
        });

        totalSavings += potentialSaving;
      }
    });

    return {
      total_monthly_potential: parseFloat(totalSavings.toFixed(2)),
      annual_potential: parseFloat((totalSavings * 12).toFixed(2)),
      by_category: savingsByCategory.sort((a, b) => b.potential_saving - a.potential_saving)
    };
  }

  /**
   * Get budget health score (0-100)
   * @param {Array} expenses - Array of expense objects
   * @param {object} budgets - Current budgets
   * @returns {object} Health score analysis
   */
  static calculateBudgetHealth(expenses, budgets) {
    if (Object.keys(budgets).length === 0) {
      return { score: 0, message: 'No budgets set' };
    }

    const categorySpending = {};
    expenses.forEach(exp => {
      categorySpending[exp.category] = (categorySpending[exp.category] || 0) + exp.amount;
    });

    let totalOverBudget = 0;
    let totalBudgetLimit = 0;
    let categoriesOnTrack = 0;

    Object.entries(budgets).forEach(([category, limit]) => {
      const spent = categorySpending[category] || 0;
      totalBudgetLimit += limit;

      if (spent > limit) {
        totalOverBudget += (spent - limit);
      } else {
        categoriesOnTrack++;
      }
    });

    const score = Math.max(0, 100 - (totalOverBudget / totalBudgetLimit * 100));
    const health = score > 80 ? 'excellent' : score > 60 ? 'good' : score > 40 ? 'fair' : 'poor';

    return {
      score: parseFloat(score.toFixed(2)),
      health,
      categories_on_track: categoriesOnTrack,
      total_categories: Object.keys(budgets).length,
      total_over_budget: parseFloat(totalOverBudget.toFixed(2))
    };
  }
}

module.exports = BudgetOptimizationModel;
