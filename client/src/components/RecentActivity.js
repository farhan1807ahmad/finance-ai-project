  import React, { useState, useEffect } from 'react';
import ExpenseFilter from './ExpenseFilter';
import './RecentActivity.css';

function RecentActivity({ refreshTrigger }) {
  const [activities, setActivities] = useState([]);
  const [filteredActivities, setFilteredActivities] = useState([]);
  const [allExpenses, setAllExpenses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchExpenses();
  }, [refreshTrigger]);

  const fetchExpenses = async () => {
    try {
      setLoading(true);
      setError('');
      const response = await fetch('http://localhost:5000/get-expenses');
      
      if (!response.ok) {
        throw new Error('Failed to fetch expenses');
      }

      const expenses = await response.json();
      setAllExpenses(expenses);
      
      // Format expenses for display
      const formattedActivities = expenses.map((expense) => {
        const date = new Date(expense.date);
        const timeString = date.toLocaleDateString('en-US', {
          month: 'short',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
        });

        return {
          _id: expense._id,
          title: expense.description,
          category: expense.category,
          time: timeString,
          amount: `-$${expense.amount.toFixed(2)}`,
          rawAmount: expense.amount,
          date: expense.date,
          notes: expense.notes,
        };
      });

      setActivities(formattedActivities);
      setFilteredActivities(formattedActivities.slice(0, 10));
    } catch (err) {
      setError(err.message);
      console.error('Error fetching expenses:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (filtered) => {
    // Format filtered expenses and show first 10
    const formattedFiltered = filtered.slice(0, 10).map((expense) => {
      const date = new Date(expense.date);
      const timeString = date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });

      return {
        _id: expense._id || expense.id,
        title: expense.description,
        category: expense.category,
        time: timeString,
        amount: `-$${expense.amount.toFixed(2)}`,
        rawAmount: expense.amount,
        date: expense.date,
        notes: expense.notes,
      };
    });

    setFilteredActivities(formattedFiltered);
  };

  return (
    <div className="recent-activity">
      <div className="activity-header">
        <h3>Recent Activity</h3>
        <button 
          onClick={fetchExpenses}
          className="view-all-link"
          style={{background: 'none', border: 'none', cursor: 'pointer', color: '#6366f1'}}
        >
          Refresh
        </button>
      </div>

      {!loading && !error && (
        <ExpenseFilter 
          expenses={activities} 
          onFilterChange={handleFilterChange}
        />
      )}

      <div className="activity-list">
        {loading && <p>Loading expenses...</p>}
        {error && <p style={{color: 'red'}}>Error: {error}</p>}
        {!loading && filteredActivities.length === 0 && <p>No expenses match your filters.</p>}
        {filteredActivities.map((activity) => (
          <div key={activity._id} className="activity-item">
            <div className="activity-details">
              <p className="activity-title">{activity.title}</p>
              <p className="activity-meta">{activity.category} • {activity.time}</p>
            </div>
            <p className="activity-amount expense">
              {activity.amount}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}

export default RecentActivity;
