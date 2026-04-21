import React, { useState } from 'react';
import { EXPENSE_CATEGORIES } from '../utils/categories';
import './QuickAddExpense.css';

function QuickAddExpense({ onExpenseAdded }) {
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState(EXPENSE_CATEGORIES[0]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleAddExpense = async () => {
    if (!description || !amount) {
      setError('Please fill in all fields');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await fetch('http://localhost:5000/add-expense', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          description,
          amount: parseFloat(amount),
          category,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to add expense');
      }

      const newExpense = await response.json();
      console.log('Expense added:', newExpense);

      // Reset form
      setDescription('');
      setAmount('');
      setCategory(EXPENSE_CATEGORIES[0]);

      // Notify parent component to refresh expenses
      if (onExpenseAdded) {
        onExpenseAdded();
      }
    } catch (err) {
      setError(err.message);
      console.error('Error adding expense:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="quick-add-expense">
      <div className="form-header">
        <h3>Quick Add Expense</h3>
      </div>

      <div className="form-group">
        <label>Description</label>
        <input
          type="text"
          placeholder="Coffee at Starbucks"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className="form-input"
        />
      </div>

      <div className="form-row">
        <div className="form-group">
          <label>Amount</label>
          <div className="amount-input-wrapper">
            <span className="currency">$</span>
            <input
              type="number"
              placeholder="0.00"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="form-input amount-input"
            />
          </div>
        </div>

        <div className="form-group">
          <label>Category</label>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="form-select"
          >
            {EXPENSE_CATEGORIES.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>
        </div>
      </div>

      {error && <p className="error-message" style={{color: 'red', marginTop: '10px'}}>{error}</p>}

      <button 
        className="add-expense-btn" 
        onClick={handleAddExpense}
        disabled={loading}
      >
        <span className="btn-icon">{loading ? '...' : '+'}</span>
        {loading ? 'Adding...' : 'Add Expense'}
      </button>
    </div>
  );
}

export default QuickAddExpense;
