import React, { useState, useEffect, useContext } from 'react';
import Sidebar from '../components/Sidebar';
import { SidebarContext } from '../App';
import { EXPENSE_CATEGORIES } from '../utils/categories';
import './Budgets.css';

function Budgets() {
  const { sidebarOpen } = useContext(SidebarContext);
  // Initialize state from localStorage
  const [budgets, setBudgets] = useState(() => {
    try {
      const savedBudgets = localStorage.getItem('budgets');
      return savedBudgets ? JSON.parse(savedBudgets) : [];
    } catch (error) {
      console.error('Error loading budgets from localStorage:', error);
      return [];
    }
  });
  
  const [showForm, setShowForm] = useState(false);
  const [newBudget, setNewBudget] = useState({
    category: EXPENSE_CATEGORIES[0],
    limit: '',
    description: '',
  });
  const [spending, setSpending] = useState({});

  // Save budgets to localStorage whenever they change
  useEffect(() => {
    try {
      localStorage.setItem('budgets', JSON.stringify(budgets));
      console.log('Budgets saved to localStorage:', budgets);
    } catch (error) {
      console.error('Error saving budgets to localStorage:', error);
    }
  }, [budgets]);

  // Fetch spending on mount
  useEffect(() => {
    fetchSpending();
  }, []);

  const fetchSpending = async () => {
    try {
      const response = await fetch('http://localhost:5000/get-expenses');
      if (!response.ok) throw new Error('Failed to fetch expenses');
      
      const expenses = await response.json();
      const categorySpending = {};
      
      expenses.forEach(expense => {
        const category = expense.category;
        categorySpending[category] = (categorySpending[category] || 0) + expense.amount;
      });
      
      setSpending(categorySpending);
    } catch (error) {
      console.error('Error fetching spending:', error);
    }
  };

  const addBudget = () => {
    if (!newBudget.category || !newBudget.limit) {
      alert('Please fill all fields');
      return;
    }

    const budget = {
      id: Date.now(),
      category: newBudget.category,
      limit: Number(newBudget.limit),
      description: newBudget.description,
      spent: spending[newBudget.category] || 0,
    };

    setBudgets([...budgets, budget]);
    setNewBudget({ category: EXPENSE_CATEGORIES[0], limit: '', description: '' });
    setShowForm(false);
  };

  const deleteBudget = (id) => {
    setBudgets(budgets.filter(b => b.id !== id));
  };

  const getProgressPercentage = (spent, limit) => {
    return Math.min((spent / limit) * 100, 100);
  };

  const getProgressColor = (percentage) => {
    if (percentage >= 100) return '#dc2626'; // Red
    if (percentage >= 80) return '#f59e0b'; // Amber
    return '#10b981'; // Green
  };

  return (
    <div className="budgets-container">
      <Sidebar />

      <div 
        className="budgets-main"
        style={{ marginLeft: sidebarOpen ? '200px' : '60px' }}
      >
        <div className="budgets-header">
          <div>
            <h1 className="page-title">Budgets</h1>
            <p className="page-subtitle">Set and track your spending budgets</p>
          </div>
          <button className="add-budget-btn" onClick={() => setShowForm(!showForm)}>
            {showForm ? '✕ Cancel' : '+ Add Budget'}
          </button>
        </div>

        {showForm && (
          <div className="budget-form-container">
            <div className="budget-form">
              <h3>Create New Budget</h3>
              
              <div className="form-group">
                <label>Category</label>
                <select
                  className="form-select"
                  value={newBudget.category}
                  onChange={(e) => setNewBudget({ ...newBudget, category: e.target.value })}
                >
                  {EXPENSE_CATEGORIES.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label>Budget Limit ($)</label>
                <input
                  type="number"
                  placeholder="0.00"
                  value={newBudget.limit}
                  onChange={(e) => setNewBudget({ ...newBudget, limit: e.target.value })}
                  className="form-input"
                />
              </div>

              <div className="form-group">
                <label>Description (Optional)</label>
                <input
                  type="text"
                  placeholder="e.g., Monthly grocery budget"
                  value={newBudget.description}
                  onChange={(e) => setNewBudget({ ...newBudget, description: e.target.value })}
                  className="form-input"
                />
              </div>

              <button className="submit-btn" onClick={addBudget}>
                Create Budget
              </button>
            </div>
          </div>
        )}

        <div className="budgets-grid">
          {budgets.length === 0 ? (
            <div className="empty-state">
              <p className="empty-icon">💼</p>
              <p className="empty-text">No budgets yet. Create one to get started!</p>
            </div>
          ) : (
            budgets.map(budget => {
              const percentage = getProgressPercentage(budget.spent, budget.limit);
              const color = getProgressColor(percentage);
              const remaining = Math.max(0, budget.limit - budget.spent);
              const isOverBudget = budget.spent > budget.limit;

              return (
                <div key={budget.id} className="budget-card">
                  <div className="budget-header-card">
                    <div className="budget-title">
                      <h3>{budget.category}</h3>
                      {budget.description && <p className="budget-desc">{budget.description}</p>}
                    </div>
                    <button
                      className="delete-btn"
                      onClick={() => deleteBudget(budget.id)}
                      title="Delete budget"
                    >
                      🗑️
                    </button>
                  </div>

                  <div className="budget-progress">
                    <div className="progress-bar-container">
                      <div
                        className="progress-bar"
                        style={{
                          width: `${percentage}%`,
                          backgroundColor: color,
                        }}
                      />
                    </div>
                    <div className="progress-text">
                      <span className="spent">${budget.spent.toFixed(2)}</span>
                      <span className="separator">of</span>
                      <span className="limit">${budget.limit.toFixed(2)}</span>
                    </div>
                  </div>

                  <div className="budget-stats">
                    <div className="stat">
                      <span className="stat-label">Remaining</span>
                      <span className={`stat-value ${isOverBudget ? 'over' : ''}`}>
                        ${remaining.toFixed(2)}
                      </span>
                    </div>
                    <div className="stat">
                      <span className="stat-label">Percentage</span>
                      <span className="stat-value">{percentage.toFixed(0)}%</span>
                    </div>
                  </div>

                  {isOverBudget && (
                    <div className="over-budget-warning">
                      ⚠️ Over budget by ${(budget.spent - budget.limit).toFixed(2)}
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}

export default Budgets;
