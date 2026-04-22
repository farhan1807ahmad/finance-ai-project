/**
 * Budget Management Module
 * Manages budget thresholds and alerts
 */

const fs = require('fs');
const path = require('path');

const BUDGETS_FILE = path.join(__dirname, '../server/data/budgets.json');

// Ensure data directory exists
const ensureDataDir = () => {
  const dataDir = path.dirname(BUDGETS_FILE);
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }
};

// Load budgets from file
const loadBudgets = () => {
  ensureDataDir();
  try {
    if (fs.existsSync(BUDGETS_FILE)) {
      return JSON.parse(fs.readFileSync(BUDGETS_FILE, 'utf8'));
    }
  } catch (error) {
    console.error('Error loading budgets:', error);
  }
  return {};
};

// Save budgets to file
const saveBudgets = (budgets) => {
  ensureDataDir();
  try {
    fs.writeFileSync(BUDGETS_FILE, JSON.stringify(budgets, null, 2));
  } catch (error) {
    console.error('Error saving budgets:', error);
  }
};

class BudgetManager {
  /**
   * Set budget limit for a category
   * @param {string} category - Category name
   * @param {number} amount - Budget amount
   * @returns {object} Updated budget
   */
  static setBudget(category, amount) {
    if (!category || amount <= 0) {
      throw new Error('Invalid category or amount');
    }

    const budgets = loadBudgets();
    budgets[category] = {
      limit: parseFloat(amount),
      alertThreshold: 80, // Alert at 80% of budget by default
      createdAt: budgets[category]?.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    saveBudgets(budgets);
    return budgets[category];
  }

  /**
   * Get budget for a category
   * @param {string} category - Category name
   * @returns {object} Budget object
   */
  static getBudget(category) {
    const budgets = loadBudgets();
    return budgets[category] || null;
  }

  /**
   * Get all budgets
   * @returns {object} All budgets
   */
  static getAllBudgets() {
    return loadBudgets();
  }

  /**
   * Delete budget for a category
   * @param {string} category - Category name
   * @returns {boolean} Success status
   */
  static deleteBudget(category) {
    const budgets = loadBudgets();
    if (budgets[category]) {
      delete budgets[category];
      saveBudgets(budgets);
      return true;
    }
    return false;
  }

  /**
   * Set alert threshold (percentage of budget)
   * @param {string} category - Category name
   * @param {number} threshold - Threshold percentage (0-100)
   * @returns {object} Updated budget
   */
  static setAlertThreshold(category, threshold) {
    const budgets = loadBudgets();
    if (!budgets[category]) {
      throw new Error(`Budget not found for category: ${category}`);
    }

    if (threshold < 0 || threshold > 100) {
      throw new Error('Threshold must be between 0 and 100');
    }

    budgets[category].alertThreshold = threshold;
    budgets[category].updatedAt = new Date().toISOString();

    saveBudgets(budgets);
    return budgets[category];
  }

  /**
   * Check budget status for a category
   * @param {string} category - Category name
   * @param {number} spent - Amount spent
   * @returns {object} Budget status
   */
  static checkBudgetStatus(category, spent) {
    const budget = this.getBudget(category);
    
    if (!budget) {
      return {
        category,
        hasBudget: false,
        status: 'no_budget'
      };
    }

    const percentageUsed = (spent / budget.limit) * 100;
    const remaining = budget.limit - spent;

    let status = 'ok';
    if (percentageUsed >= 100) {
      status = 'exceeded';
    } else if (percentageUsed >= budget.alertThreshold) {
      status = 'warning';
    }

    return {
      category,
      hasBudget: true,
      limit: budget.limit,
      spent: parseFloat(spent.toFixed(2)),
      remaining: parseFloat(remaining.toFixed(2)),
      percentageUsed: parseFloat(percentageUsed.toFixed(2)),
      status, // 'ok', 'warning', or 'exceeded'
      alertThreshold: budget.alertThreshold,
      isAlert: percentageUsed >= budget.alertThreshold
    };
  }

  /**
   * Check all budgets against current spending
   * @param {Array} expenses - Array of expense objects
   * @returns {Array} Array of budget statuses
   */
  static checkAllBudgets(expenses) {
    const budgets = this.getAllBudgets();
    const categorySpending = {};

    // Calculate spending by category
    expenses.forEach(expense => {
      categorySpending[expense.category] = 
        (categorySpending[expense.category] || 0) + expense.amount;
    });

    // Check status for each budgeted category
    const statuses = Object.keys(budgets).map(category => {
      const spent = categorySpending[category] || 0;
      return this.checkBudgetStatus(category, spent);
    });

    return statuses;
  }

  /**
   * Get budget summary
   * @param {Array} expenses - Array of expense objects
   * @returns {object} Summary of budget status
   */
  static getBudgetSummary(expenses) {
    const statuses = this.checkAllBudgets(expenses);
    
    const summary = {
      total_budgets: statuses.length,
      total_limit: 0,
      total_spent: 0,
      alerts: [],
      warnings: [],
      ok_categories: []
    };

    statuses.forEach(status => {
      if (status.hasBudget) {
        summary.total_limit += status.limit;
        summary.total_spent += status.spent;

        if (status.status === 'exceeded') {
          summary.alerts.push({
            category: status.category,
            message: `Budget exceeded by ₹${Math.abs(status.remaining).toFixed(2)}`,
            excess: Math.abs(status.remaining),
            percentageOver: parseFloat((status.percentageUsed - 100).toFixed(2))
          });
        } else if (status.status === 'warning') {
          summary.warnings.push({
            category: status.category,
            message: `${status.percentageUsed.toFixed(0)}% of budget used (₹${status.spent.toFixed(2)} of ₹${status.limit.toFixed(2)})`,
            percentageUsed: status.percentageUsed,
            remaining: status.remaining
          });
        } else {
          summary.ok_categories.push(status.category);
        }
      }
    });

    summary.total_limit = parseFloat(summary.total_limit.toFixed(2));
    summary.total_spent = parseFloat(summary.total_spent.toFixed(2));
    summary.budget_health = summary.total_limit > 0 
      ? parseFloat(((summary.total_spent / summary.total_limit) * 100).toFixed(2))
      : 0;

    return summary;
  }
}

module.exports = BudgetManager;
