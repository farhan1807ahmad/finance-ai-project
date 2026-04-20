import React, { useState, useEffect, useContext } from 'react';
import Sidebar from '../components/Sidebar';
import { SidebarContext } from '../App';
import './Insights.css';

function Insights() {
  const { sidebarOpen } = useContext(SidebarContext);
  const [insights, setInsights] = useState('');
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchInsights();
  }, []);

  const fetchInsights = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await fetch('http://localhost:5000/insights/ai');
      if (!response.ok) throw new Error('Failed to fetch insights');
      
      const data = await response.json();
      setInsights(data.insights);
      setSummary(data.summary);
    } catch (err) {
      setError(err.message || 'Failed to generate insights');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="insights-container">
      <Sidebar />

      <div 
        className="insights-main"
        style={{ marginLeft: sidebarOpen ? '200px' : '60px' }}
      >
        <div className="insights-header">
          <div>
            <h1 className="page-title">💡 AI Insights</h1>
            <p className="page-subtitle">Personalized financial analysis powered by AI</p>
          </div>
          <button className="refresh-btn" onClick={fetchInsights} disabled={loading}>
            {loading ? '⏳ Analyzing...' : '🔄 Refresh Insights'}
          </button>
        </div>

        {loading ? (
          <div className="insight-card loading">
            <div className="loading-spinner"></div>
            <p>Analyzing your spending patterns...</p>
          </div>
        ) : error ? (
          <div className="insight-card error">
            <p className="error-text">❌ {error}</p>
            <p className="error-hint">Make sure you have:</p>
            <ul>
              <li>Installed OpenAI: <code>npm install openai</code></li>
              <li>Added OPENAI_API_KEY to .env file</li>
              <li>Restarted the server</li>
            </ul>
          </div>
        ) : (
          <>
            {summary && (
              <div className="summary-grid">
                <div className="summary-card">
                  <div className="summary-icon">💰</div>
                  <div className="summary-content">
                    <p className="summary-label">Total Expenses</p>
                    <p className="summary-value">₹{summary.totalSpent?.toFixed(2) || '0.00'}</p>
                  </div>
                </div>

                <div className="summary-card">
                  <div className="summary-icon">📊</div>
                  <div className="summary-content">
                    <p className="summary-label">This Month</p>
                    <p className="summary-value">₹{summary.monthlySpend?.toFixed(2) || '0.00'}</p>
                  </div>
                </div>

                <div className="summary-card">
                  <div className="summary-icon">🏆</div>
                  <div className="summary-content">
                    <p className="summary-label">Top Category</p>
                    <p className="summary-value">{summary.topCategory || 'N/A'}</p>
                  </div>
                </div>

                <div className="summary-card">
                  <div className="summary-icon">📈</div>
                  <div className="summary-content">
                    <p className="summary-label">Transactions</p>
                    <p className="summary-value">{summary.transactionCount || 0}</p>
                  </div>
                </div>
              </div>
            )}

            <div className="insight-card">
              <div className="insight-header">
                <h2>🤖 AI Analysis</h2>
              </div>
              <div className="insight-content">
                {insights.split('\n').map((line, index) => (
                  <p key={index} className="insight-text">
                    {line}
                  </p>
                ))}
              </div>
            </div>

            <div className="insight-tips">
              <h3>💡 Tips to improve your finances:</h3>
              <ul>
                <li>Track all expenses regularly for better insights</li>
                <li>Review your budgets monthly</li>
                <li>Categorize expenses properly for accurate analysis</li>
                <li>Use the insights to make informed spending decisions</li>
              </ul>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default Insights;
