import React, { useState, useEffect, useContext } from 'react';
import Sidebar from '../components/Sidebar';
import { SidebarContext } from '../App';
import './Activity.css';

function Activity() {
  const [expenses, setExpenses] = useState([]);
  const [filter, setFilter] = useState('All');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const { sidebarOpen } = useContext(SidebarContext);

  useEffect(() => {
    fetchExpenses();
  }, []);

  const fetchExpenses = async () => {
    try {
      setLoading(true);
      setError('');
      const response = await fetch('http://localhost:5000/get-expenses');
      
      if (!response.ok) {
        throw new Error('Failed to fetch expenses');
      }

      const data = await response.json();
      setExpenses(data);
    } catch (err) {
      setError(err.message);
      console.error('Error fetching expenses:', err);
    } finally {
      setLoading(false);
    }
  };

  const getCategoryIcon = (category) => {
    const icons = {
      'Food': '🍔',
      'Transportation': '🚗',
      'Entertainment': '🎬',
      'Utilities': '💡',
      'Health': '🏥',
      'Shopping': '🛍️',
      'Other': '📦'
    };
    return icons[category] || '📊';
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    const isToday = date.toDateString() === today.toDateString();
    const isYesterday = date.toDateString() === yesterday.toDateString();

    if (isToday) {
      return `Today at ${date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}`;
    } else if (isYesterday) {
      return `Yesterday at ${date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}`;
    } else {
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) + 
             ` at ${date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}`;
    }
  };

  const filteredExpenses = filter === 'All' ? expenses : 
                           filter === 'Expenses' ? expenses : 
                           [];

  return (
    <div className="activity-page">
      <Sidebar currentPage="Activity" />
      <div 
        className="activity-main"
        style={{ marginLeft: sidebarOpen ? '200px' : '60px' }}
      >
        <div className="activity-header">
          <h1 className="page-title">Activity</h1>
          <p className="page-subtitle">Complete timeline of your transactions</p>
        </div>

        <div className="filter-buttons">
          <span className="filter-label">Filter by:</span>
          <button 
            className={`filter-btn ${filter === 'All' ? 'active' : ''}`}
            onClick={() => setFilter('All')}
          >
            All
          </button>
          <button 
            className={`filter-btn ${filter === 'Expenses' ? 'active' : ''}`}
            onClick={() => setFilter('Expenses')}
          >
            Expenses
          </button>
          <button 
            className={`filter-btn ${filter === 'Income' ? 'active' : ''}`}
            onClick={() => setFilter('Income')}
          >
            Income
          </button>
        </div>

        <div className="transactions-list">
          {loading && <p className="loading">Loading expenses...</p>}
          {error && <p className="error">Error: {error}</p>}
          
          {!loading && filteredExpenses.length === 0 && (
            <p className="no-data">No expenses yet. Add one to get started!</p>
          )}

          {!loading && filteredExpenses.map((expense) => (
            <div key={expense.id} className="transaction-item">
              <div className="transaction-icon">
                {getCategoryIcon(expense.category)}
              </div>
              
              <div className="transaction-details">
                <p className="transaction-title">{expense.description}</p>
                <p className="transaction-meta">
                  {expense.category} • {formatDate(expense.date)}
                </p>
              </div>

              <div className="transaction-amount">
                -${expense.amount.toFixed(2)}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default Activity;
