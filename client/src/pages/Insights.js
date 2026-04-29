import React, { useState, useEffect, useContext } from 'react';
import Sidebar from '../components/Sidebar';
import { SidebarContext } from '../App';
import './Insights.css';

function Insights() {
  const { sidebarOpen } = useContext(SidebarContext);
  const [summary, setSummary] = useState(null);
  const [predictions, setPredictions] = useState([]);
  const [anomalies, setAnomalies] = useState([]);
  const [trends, setTrends] = useState([]);
  const [loading, setLoading] = useState(true);
  const [retraining, setRetraining] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [expenses, setExpenses] = useState([]);

  useEffect(() => {
    fetchAllData();
  }, []);

  const fetchAllData = async () => {
    setLoading(true);
    setError('');
    setSuccessMessage('');
    
    try {
      // Fetch all data in parallel
      const [expensesRes, trendsRes, summaryRes] = await Promise.all([
        fetch('http://localhost:5000/get-expenses'),
        fetch('http://localhost:5000/ml/trends'),
        fetch('http://localhost:5000/analytics/summary')
      ]);

      if (!expensesRes.ok || !trendsRes.ok || !summaryRes.ok) {
        throw new Error('Failed to fetch data');
      }

      const expensesData = await expensesRes.json();
      const trendsData = await trendsRes.json();
      const summaryData = await summaryRes.json();

      setExpenses(expensesData);
      setSummary(summaryData);
      setTrends(trendsData.trends || []);

      // Fetch predictions for each category
      const categories = [...new Set(expensesData.map(e => e.category))];
      const predictionsData = [];
      
      for (const category of categories) {
        try {
          const predRes = await fetch('http://localhost:5000/ml/predict', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              category,
              month: new Date().getMonth() + 1
            })
          });
          
          if (predRes.ok) {
            const predData = await predRes.json();
            predictionsData.push(predData);
          }
        } catch (err) {
          console.log(`Could not fetch prediction for ${category}`);
        }
      }
      
      setPredictions(predictionsData);

      // Detect anomalies in recent expenses (last 30 days)
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      
      const recentExpenses = expensesData.filter(exp => 
        new Date(exp.date) >= thirtyDaysAgo
      );

      const anomaliesData = [];
      for (const expense of recentExpenses) {
        try {
          const anomRes = await fetch('http://localhost:5000/ml/anomaly', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              amount: expense.amount,
              category: expense.category
            })
          });
          
          if (anomRes.ok) {
            const anomData = await anomRes.json();
            if (anomData.is_anomaly) {
              anomaliesData.push({
                ...anomData,
                expense: expense,
                date: new Date(expense.date).toLocaleDateString()
              });
            }
          }
        } catch (err) {
          console.log(`Could not check anomaly for expense`);
        }
      }
      
      setAnomalies(anomaliesData);

    } catch (err) {
      setError(err.message || 'Failed to load insights');
      console.error('Error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleRetrain = async () => {
    setRetraining(true);
    setError('');
    setSuccessMessage('');
    
    try {
      const response = await fetch('http://localhost:5000/ml/retrain', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });

      if (!response.ok) {
        throw new Error('Failed to retrain models');
      }

      const data = await response.json();
      setSuccessMessage('✅ Models retrained successfully! Refreshing data...');
      
      // Refresh data after retraining
      setTimeout(() => {
        fetchAllData();
      }, 1000);
    } catch (err) {
      setError('❌ Retraining failed: ' + (err.message || 'Unknown error'));
    } finally {
      setRetraining(false);
    }
  };

  const getTrendEmoji = (trend) => {
    if (trend === 'increasing') return '📈';
    if (trend === 'decreasing') return '📉';
    return '➡️';
  };

  const getSeverityColor = (severity) => {
    switch(severity) {
      case 'critical': return '#ff4444';
      case 'high': return '#ff8800';
      case 'medium': return '#ffaa00';
      default: return '#00aa00';
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
            <p className="page-subtitle">ML-powered spending analysis & predictions</p>
          </div>
          <div style={{ display: 'flex', gap: '10px' }}>
            <button 
              className="refresh-btn" 
              onClick={fetchAllData} 
              disabled={loading}
              style={{ cursor: loading ? 'not-allowed' : 'pointer' }}
            >
              {loading ? '⏳ Loading...' : '🔄 Refresh'}
            </button>
            <button 
              className="retrain-btn"
              onClick={handleRetrain}
              disabled={retraining}
              style={{ 
                cursor: retraining ? 'not-allowed' : 'pointer',
                padding: '10px 20px',
                backgroundColor: '#6366f1',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                fontSize: '14px',
                fontWeight: '600'
              }}
            >
              {retraining ? '⏳ Retraining...' : '🔄 Retrain Models'}
            </button>
          </div>
        </div>

        {successMessage && (
          <div style={{
            padding: '12px 16px',
            backgroundColor: '#d4edda',
            color: '#155724',
            borderRadius: '8px',
            marginBottom: '16px',
            border: '1px solid #c3e6cb'
          }}>
            {successMessage}
          </div>
        )}

        {error && (
          <div style={{
            padding: '12px 16px',
            backgroundColor: '#f8d7da',
            color: '#721c24',
            borderRadius: '8px',
            marginBottom: '16px',
            border: '1px solid #f5c6cb'
          }}>
            {error}
          </div>
        )}

        {loading ? (
          <div className="insight-card loading" style={{ textAlign: 'center', padding: '40px' }}>
            <div className="loading-spinner"></div>
            <p>Analyzing your spending patterns...</p>
          </div>
        ) : (
          <>
            {/* Summary Stats */}
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

            {/* Spending Predictions */}
            <div className="insight-card">
              <div className="insight-header">
                <h2>🎯 Next Month Predictions</h2>
                <p style={{ margin: '4px 0 0 0', color: '#666', fontSize: '14px' }}>
                  Predicted spending by category
                </p>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginTop: '16px' }}>
                {predictions.length > 0 ? (
                  predictions.map((pred, idx) => (
                    <div key={idx} style={{
                      padding: '16px',
                      backgroundColor: '#f8f9fa',
                      borderRadius: '8px',
                      border: '1px solid #e9ecef'
                    }}>
                      <p style={{ margin: '0 0 8px 0', fontWeight: '600', color: '#333' }}>
                        {pred.category}
                      </p>
                      <p style={{ margin: '0 0 4px 0', fontSize: '20px', fontWeight: 'bold', color: '#6366f1' }}>
                        ₹{pred.predicted_amount?.toFixed(2) || '0.00'}
                      </p>
                      <p style={{ margin: '0', fontSize: '12px', color: '#666' }}>
                        Confidence: {((pred.confidence || 0) * 100).toFixed(0)}%
                      </p>
                    </div>
                  ))
                ) : (
                  <p style={{ gridColumn: '1 / -1', color: '#666' }}>
                    Add more expenses to generate predictions
                  </p>
                )}
              </div>
            </div>

            {/* Spending Trends */}
            <div className="insight-card">
              <div className="insight-header">
                <h2>📈 Category Trends</h2>
                <p style={{ margin: '4px 0 0 0', color: '#666', fontSize: '14px' }}>
                  Month-over-month spending changes
                </p>
              </div>
              <div style={{ marginTop: '16px' }}>
                {trends.length > 0 ? (
                  <div style={{ display: 'grid', gap: '12px' }}>
                    {trends.map((trend, idx) => (
                      <div key={idx} style={{
                        padding: '12px 16px',
                        backgroundColor: trend.direction === 'up' ? '#ffe6e6' : trend.direction === 'down' ? '#e6f3ff' : '#f8f9fa',
                        borderRadius: '8px',
                        border: `1px solid ${trend.direction === 'up' ? '#ffcccc' : trend.direction === 'down' ? '#cce6ff' : '#e9ecef'}`,
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center'
                      }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                          <span style={{ fontSize: '20px' }}>
                            {getTrendEmoji(trend.trend)}
                          </span>
                          <div>
                            <p style={{ margin: '0', fontWeight: '600', color: '#333' }}>
                              {trend.category}
                            </p>
                            <p style={{ margin: '2px 0 0 0', fontSize: '12px', color: '#666' }}>
                              {trend.trend.charAt(0).toUpperCase() + trend.trend.slice(1)}
                            </p>
                          </div>
                        </div>
                        <p style={{ 
                          margin: '0', 
                          fontWeight: 'bold',
                          color: trend.direction === 'up' ? '#d32f2f' : trend.direction === 'down' ? '#1976d2' : '#666',
                          fontSize: '14px'
                        }}>
                          ₹{Math.abs(trend.monthly_change)?.toFixed(0) || '0'}/mo
                        </p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p style={{ color: '#666' }}>Not enough data to analyze trends</p>
                )}
              </div>
            </div>

            {/* Anomaly Alerts */}
            {anomalies.length > 0 && (
              <div className="insight-card">
                <div className="insight-header">
                  <h2>⚠️ Unusual Expenses Detected</h2>
                  <p style={{ margin: '4px 0 0 0', color: '#666', fontSize: '14px' }}>
                    {anomalies.length} anomalies found in the last 30 days
                  </p>
                </div>
                <div style={{ marginTop: '16px', display: 'grid', gap: '12px' }}>
                  {anomalies.map((anom, idx) => (
                    <div key={idx} style={{
                      padding: '12px 16px',
                      backgroundColor: anom.severity === 'critical' ? '#ffebee' : anom.severity === 'high' ? '#fff3e0' : '#fffde7',
                      borderRadius: '8px',
                      border: `2px solid ${getSeverityColor(anom.severity)}`,
                      borderLeft: `4px solid ${getSeverityColor(anom.severity)}`
                    }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                        <p style={{ margin: '0', fontWeight: '600', color: '#333' }}>
                          {anom.expense?.description || 'Expense'} - {anom.category}
                        </p>
                        <span style={{
                          padding: '2px 8px',
                          backgroundColor: getSeverityColor(anom.severity),
                          color: 'white',
                          borderRadius: '4px',
                          fontSize: '11px',
                          fontWeight: 'bold'
                        }}>
                          {anom.severity?.toUpperCase() || 'NORMAL'}
                        </span>
                      </div>
                      <p style={{ margin: '0 0 8px 0', fontSize: '14px', fontWeight: 'bold', color: '#333' }}>
                        ₹{anom.amount?.toFixed(2) || '0.00'}
                      </p>
                      <p style={{ margin: '0', fontSize: '13px', color: '#555' }}>
                        {anom.message}
                      </p>
                      <p style={{ margin: '4px 0 0 0', fontSize: '12px', color: '#999' }}>
                        {anom.date}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Tips Section */}
            <div className="insight-card" style={{ backgroundColor: '#f0f4ff' }}>
              <h3 style={{ margin: '0 0 12px 0', color: '#333' }}>💡 Financial Tips</h3>
              <ul style={{ margin: '0', paddingLeft: '20px', color: '#555', lineHeight: '1.8' }}>
                <li>Check anomaly alerts regularly to identify unusual spending patterns</li>
                <li>Use predictions to plan your budget for the upcoming month</li>
                <li>Review trend analysis to understand which categories need attention</li>
                <li>Retrain models monthly with fresh data for better accuracy</li>
                <li>Categorize all expenses consistently for accurate analysis</li>
              </ul>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default Insights;
