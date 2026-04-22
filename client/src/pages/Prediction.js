import React, { useState, useEffect, useContext } from 'react';
import Sidebar from '../components/Sidebar';
import { SidebarContext } from '../App';
import './Prediction.css';

function Prediction() {
  const { sidebarOpen } = useContext(SidebarContext);
  const [forecast, setForecast] = useState(null);
  const [budgetSummary, setBudgetSummary] = useState(null);
  const [anomalies, setAnomalies] = useState(null);
  const [optimization, setOptimization] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [activeTab, setActiveTab] = useState('predictions'); // predictions, alerts, anomalies, optimize

  useEffect(() => {
    fetchAllData();
  }, []);

  const fetchAllData = async () => {
    setLoading(true);
    setError('');
    try {
      const [predRes, alertRes, anomRes, optimRes] = await Promise.all([
        fetch('http://localhost:5000/predictions/expense'),
        fetch('http://localhost:5000/budgets-summary'),
        fetch('http://localhost:5000/anomalies/detect'),
        fetch('http://localhost:5000/optimize/budgets')
      ]);

      if (!predRes.ok || !alertRes.ok || !anomRes.ok || !optimRes.ok) {
        throw new Error('Failed to fetch data');
      }

      const predData = await predRes.json();
      const alertData = await alertRes.json();
      const anomData = await anomRes.json();
      const optimData = await optimRes.json();

      setForecast(predData.forecast);
      setBudgetSummary(alertData.summary);
      setAnomalies(anomData.report);
      setOptimization(optimData.optimization);

      if (predData.forecast.predictions) {
        setSelectedCategory(Object.keys(predData.forecast.predictions)[0]);
      }
    } catch (err) {
      setError(err.message || 'Failed to generate insights');
    } finally {
      setLoading(false);
    }
  };

  const handleExportCSV = async () => {
    try {
      const response = await fetch('http://localhost:5000/export/predictions');
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'predictions.csv';
      a.click();
    } catch (err) {
      alert('Failed to export CSV: ' + err.message);
    }
  };

  const handleExportJSON = async () => {
    try {
      const response = await fetch('http://localhost:5000/export/full-report');
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'full-report.json';
      a.click();
    } catch (err) {
      alert('Failed to export JSON: ' + err.message);
    }
  };

  const getTrendIcon = (direction) => {
    switch(direction) {
      case 'increasing': return '📈';
      case 'decreasing': return '📉';
      default: return '➡️';
    }
  };

  const getTrendColor = (direction) => {
    switch(direction) {
      case 'increasing': return '#e74c3c';
      case 'decreasing': return '#27ae60';
      default: return '#3498db';
    }
  };

  return (
    <div className="prediction-container">
      <Sidebar />

      <div 
        className="prediction-main"
        style={{ marginLeft: sidebarOpen ? '200px' : '60px' }}
      >
        <div className="prediction-header">
          <div>
            <h1 className="page-title">🔮 Financial Intelligence</h1>
            <p className="page-subtitle">AI insights, predictions, alerts & budget optimization</p>
          </div>
          <div className="header-actions">
            <button className="refresh-btn" onClick={fetchAllData} disabled={loading}>
              {loading ? '⏳ Analyzing...' : '🔄 Refresh'}
            </button>
            <div className="export-dropdown">
              <button className="export-btn" title="Export data">📥 Export</button>
              <div className="dropdown-menu">
                <button onClick={handleExportCSV}>📊 Export as CSV</button>
                <button onClick={handleExportJSON}>📄 Export as JSON</button>
              </div>
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="tab-navigation">
          <button 
            className={`tab-btn ${activeTab === 'predictions' ? 'active' : ''}`}
            onClick={() => setActiveTab('predictions')}
          >
            📊 Predictions
          </button>
          <button 
            className={`tab-btn ${activeTab === 'alerts' ? 'active' : ''}`}
            onClick={() => setActiveTab('alerts')}
          >
            🚨 Budget Alerts {budgetSummary?.alerts && budgetSummary.alerts.length > 0 && 
            <span className="alert-badge">{budgetSummary.alerts.length}</span>}
          </button>
          <button 
            className={`tab-btn ${activeTab === 'anomalies' ? 'active' : ''}`}
            onClick={() => setActiveTab('anomalies')}
          >
            🔍 Anomalies {anomalies?.total_anomalies && anomalies.total_anomalies > 0 && 
            <span className="alert-badge">{anomalies.total_anomalies}</span>}
          </button>
          <button 
            className={`tab-btn ${activeTab === 'optimize' ? 'active' : ''}`}
            onClick={() => setActiveTab('optimize')}
          >
            💡 Optimize Budget
          </button>
        </div>

        {loading ? (
          <div className="prediction-card loading">
            <div className="loading-spinner"></div>
            <p>Analyzing your spending patterns...</p>
          </div>
        ) : error ? (
          <div className="prediction-card error">
            <p className="error-text">❌ {error}</p>
          </div>
        ) : (
          <>
            {/* PREDICTIONS TAB */}
            {activeTab === 'predictions' && forecast && (
              <>
                <div className="summary-card prediction-summary">
                  <div className="summary-icon">💰</div>
                  <div className="summary-content">
                    <p className="summary-label">Predicted Next Month Spending</p>
                    <p className="summary-value">₹{forecast.total_predicted_next_month?.toFixed(2) || '0.00'}</p>
                  </div>
                </div>

                {forecast.high_risk_categories && forecast.high_risk_categories.length > 0 && (
                  <div className="high-risk-section">
                    <h2>⚠️ Categories to Watch</h2>
                    <div className="risk-cards">
                      {forecast.high_risk_categories.map((risk, idx) => (
                        <div key={idx} className="risk-card">
                          <h3>{risk.category}</h3>
                          <p className="risk-amount">₹{risk.predicted?.toFixed(2)}</p>
                          <p className="risk-trend">Increasing by ₹{risk.trend_strength?.toFixed(2)}/month</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="predictions-section">
                  <h2>📊 Category Predictions</h2>
                  
                  <div className="category-tabs">
                    {forecast.predictions && Object.keys(forecast.predictions).map(category => (
                      <button
                        key={category}
                        className={`category-tab ${selectedCategory === category ? 'active' : ''}`}
                        onClick={() => setSelectedCategory(category)}
                      >
                        {category}
                      </button>
                    ))}
                  </div>

                  {selectedCategory && forecast.predictions[selectedCategory] && (
                    <div className="category-details">
                      <div className="category-header">
                        <h3>{selectedCategory}</h3>
                        <div className="trend-indicator">
                          <span style={{ color: getTrendColor(forecast.predictions[selectedCategory].trend_direction) }}>
                            {getTrendIcon(forecast.predictions[selectedCategory].trend_direction)} {forecast.predictions[selectedCategory].trend_direction}
                          </span>
                        </div>
                      </div>

                      <div className="stats-grid">
                        <div className="stat-box">
                          <p className="stat-label">Historical Average</p>
                          <p className="stat-value">₹{forecast.predictions[selectedCategory].historical_average?.toFixed(2)}</p>
                        </div>
                        <div className="stat-box">
                          <p className="stat-label">Trend Strength</p>
                          <p className="stat-value">{forecast.predictions[selectedCategory].trend_strength?.toFixed(2)}</p>
                        </div>
                        <div className="stat-box">
                          <p className="stat-label">Last 3 Months</p>
                          <div className="mini-chart">
                            {forecast.predictions[selectedCategory].last_months && 
                              forecast.predictions[selectedCategory].last_months.map((value, idx) => (
                                <div
                                  key={idx}
                                  className="bar"
                                  style={{
                                    height: `${(value / Math.max(...forecast.predictions[selectedCategory].last_months)) * 100}%`
                                  }}
                                  title={`₹${value.toFixed(2)}`}
                                ></div>
                              ))
                            }
                          </div>
                        </div>
                      </div>

                      <div className="predictions-table">
                        <h4>Next 3 Months Forecast</h4>
                        <table>
                          <thead>
                            <tr>
                              <th>Month</th>
                              <th>Predicted Amount</th>
                              <th>Range (Lower - Upper)</th>
                              <th>Confidence</th>
                            </tr>
                          </thead>
                          <tbody>
                            {forecast.predictions[selectedCategory].predictions && 
                              forecast.predictions[selectedCategory].predictions.map((pred, idx) => (
                                <tr key={idx}>
                                  <td>{pred.month}</td>
                                  <td className="amount">₹{pred.predicted?.toFixed(2)}</td>
                                  <td className="range">
                                    ₹{pred.lower_bound?.toFixed(2)} - ₹{pred.upper_bound?.toFixed(2)}
                                  </td>
                                  <td className="confidence">
                                    <div className="confidence-bar">
                                      <div 
                                        className="confidence-fill"
                                        style={{ width: `${Math.max(0, Math.min(100, pred.confidence))}%` }}
                                      ></div>
                                    </div>
                                    {(pred.confidence).toFixed(0)}%
                                  </td>
                                </tr>
                              ))
                            }
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}
                </div>

                {forecast.recommendations && forecast.recommendations.length > 0 && (
                  <div className="recommendations-section">
                    <h2>💡 Recommendations</h2>
                    <div className="recommendations-list">
                      {forecast.recommendations.map((rec, idx) => (
                        <div key={idx} className={`recommendation-item ${rec.type}`}>
                          <span className="rec-icon">
                            {rec.type === 'warning' && '⚠️'}
                            {rec.type === 'positive' && '✅'}
                            {rec.type === 'info' && 'ℹ️'}
                          </span>
                          <p>{rec.message}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </>
            )}

            {/* BUDGET ALERTS TAB */}
            {activeTab === 'alerts' && budgetSummary && (
              <>
                <div className="summary-card prediction-summary">
                  <div className="summary-icon">📊</div>
                  <div className="summary-content">
                    <p className="summary-label">Budget Health</p>
                    <p className="summary-value">{budgetSummary.budget_health?.toFixed(1)}%</p>
                  </div>
                </div>

                {budgetSummary.alerts && budgetSummary.alerts.length > 0 && (
                  <div className="alerts-section">
                    <h2>🚨 Budget Exceeded</h2>
                    <div className="alerts-grid">
                      {budgetSummary.alerts.map((alert, idx) => (
                        <div key={idx} className="alert-card exceeded">
                          <div className="alert-header">
                            <h3>{alert.category}</h3>
                            <span className="alert-percentage">{alert.percentageOver.toFixed(0)}% over</span>
                          </div>
                          <p className="alert-message">{alert.message}</p>
                          <p className="alert-excess">Excess: ₹{alert.excess.toFixed(2)}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {budgetSummary.warnings && budgetSummary.warnings.length > 0 && (
                  <div className="alerts-section">
                    <h2>⚠️ Budget Warnings</h2>
                    <div className="alerts-grid">
                      {budgetSummary.warnings.map((warning, idx) => (
                        <div key={idx} className="alert-card warning">
                          <div className="alert-header">
                            <h3>{warning.category}</h3>
                            <span className="alert-percentage">{warning.percentageUsed.toFixed(0)}% used</span>
                          </div>
                          <p className="alert-message">{warning.message}</p>
                          <p className="alert-remaining">Remaining: ₹{warning.remaining.toFixed(2)}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {budgetSummary.ok_categories && budgetSummary.ok_categories.length > 0 && (
                  <div className="alerts-section">
                    <h2>✅ On Track</h2>
                    <div className="ok-categories">
                      {budgetSummary.ok_categories.map((category, idx) => (
                        <span key={idx} className="category-badge">{category}</span>
                      ))}
                    </div>
                  </div>
                )}
              </>
            )}

            {/* ANOMALIES TAB */}
            {activeTab === 'anomalies' && anomalies && (
              <>
                <div className="summary-card prediction-summary">
                  <div className="summary-icon">🔍</div>
                  <div className="summary-content">
                    <p className="summary-label">Anomalies Detected</p>
                    <p className="summary-value">{anomalies.total_anomalies || 0}</p>
                  </div>
                </div>

                {anomalies.transaction_anomalies && anomalies.transaction_anomalies.length > 0 && (
                  <div className="anomalies-section">
                    <h2>💸 Unusual Transactions</h2>
                    <div className="anomalies-table">
                      <table>
                        <thead>
                          <tr>
                            <th>Description</th>
                            <th>Category</th>
                            <th>Amount</th>
                            <th>Severity</th>
                            <th>Z-Score</th>
                          </tr>
                        </thead>
                        <tbody>
                          {anomalies.transaction_anomalies.map((anom, idx) => (
                            <tr key={idx} className={`anomaly-${anom.severity}`}>
                              <td>{anom.description}</td>
                              <td>{anom.category}</td>
                              <td className="amount">₹{anom.amount?.toFixed(2)}</td>
                              <td><span className={`severity-badge ${anom.severity}`}>{anom.severity}</span></td>
                              <td>{anom.zScore}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {anomalies.pattern_anomalies && anomalies.pattern_anomalies.length > 0 && (
                  <div className="anomalies-section">
                    <h2>📈 Spending Pattern Changes</h2>
                    <div className="pattern-cards">
                      {anomalies.pattern_anomalies.map((pattern, idx) => (
                        <div key={idx} className={`pattern-card ${pattern.direction}`}>
                          <h3>{pattern.category}</h3>
                          <p className="pattern-change">{pattern.changePercent > 0 ? '📈' : '📉'} {Math.abs(pattern.changePercent).toFixed(0)}% {pattern.direction}</p>
                          <p className="pattern-months">{pattern.previousMonth} → {pattern.month}</p>
                          <p className="pattern-amounts">₹{pattern.previousAmount.toFixed(2)} → ₹{pattern.currentAmount.toFixed(2)}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {anomalies.recommendations && anomalies.recommendations.length > 0 && (
                  <div className="recommendations-section">
                    <h2>💡 Recommendations</h2>
                    <div className="recommendations-list">
                      {anomalies.recommendations.map((rec, idx) => (
                        <div key={idx} className={`recommendation-item ${rec.type}`}>
                          <span className="rec-icon">
                            {rec.type === 'alert' && '⚠️'}
                            {rec.type === 'warning' && '🔔'}
                            {rec.type === 'info' && 'ℹ️'}
                          </span>
                          <p>{rec.message}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </>
            )}

            {/* OPTIMIZE TAB */}
            {activeTab === 'optimize' && optimization && (
              <>
                <div className="summary-card prediction-summary">
                  <div className="summary-icon">💡</div>
                  <div className="summary-content">
                    <p className="summary-label">Current Monthly Spending</p>
                    <p className="summary-value">₹{optimization.current_monthly_average?.toFixed(2)}</p>
                  </div>
                </div>

                <div className="budget-breakdown-section">
                  <h2>50-30-20 Budget Rule</h2>
                  <div className="breakdown-grid">
                    <div className="breakdown-card essential">
                      <div className="breakdown-header">
                        <h3>Essential (50%)</h3>
                        <span className="breakdown-percent">50%</span>
                      </div>
                      <p className="breakdown-categories">
                        {optimization.breakdown?.essential?.categories?.join(', ')}
                      </p>
                      <p className="breakdown-current">Currently: ₹{optimization.breakdown?.essential?.current_spend?.toFixed(2)}</p>
                      <p className="breakdown-recommended">Recommended: ₹{optimization.breakdown?.essential?.recommended_amount?.toFixed(2)}</p>
                    </div>

                    <div className="breakdown-card discretionary">
                      <div className="breakdown-header">
                        <h3>Discretionary (30%)</h3>
                        <span className="breakdown-percent">30%</span>
                      </div>
                      <p className="breakdown-categories">
                        {optimization.breakdown?.discretionary?.categories?.join(', ')}
                      </p>
                      <p className="breakdown-current">Currently: ₹{optimization.breakdown?.discretionary?.current_spend?.toFixed(2)}</p>
                      <p className="breakdown-recommended">Recommended: ₹{optimization.breakdown?.discretionary?.recommended_amount?.toFixed(2)}</p>
                    </div>

                    <div className="breakdown-card other">
                      <div className="breakdown-header">
                        <h3>Other (20%)</h3>
                        <span className="breakdown-percent">20%</span>
                      </div>
                      <p className="breakdown-current">Currently: ₹{optimization.breakdown?.other?.current_spend?.toFixed(2)}</p>
                      <p className="breakdown-recommended">Recommended: ₹{optimization.breakdown?.other?.recommended_amount?.toFixed(2)}</p>
                    </div>
                  </div>
                </div>

                {optimization.savings_potential && optimization.savings_potential.total_monthly_potential > 0 && (
                  <div className="savings-section">
                    <h2>💰 Potential Savings</h2>
                    <div className="savings-cards">
                      <div className="savings-card total">
                        <h3>Monthly Potential</h3>
                        <p className="savings-amount">₹{optimization.savings_potential?.total_monthly_potential?.toFixed(2)}</p>
                      </div>
                      <div className="savings-card annual">
                        <h3>Annual Potential</h3>
                        <p className="savings-amount">₹{optimization.savings_potential?.annual_potential?.toFixed(2)}</p>
                      </div>
                    </div>

                    {optimization.savings_potential?.by_category?.length > 0 && (
                      <div className="savings-by-category">
                        <h3>Savings by Category</h3>
                        <table>
                          <thead>
                            <tr>
                              <th>Category</th>
                              <th>Current</th>
                              <th>Suggested</th>
                              <th>Potential Saving</th>
                              <th>Percent</th>
                            </tr>
                          </thead>
                          <tbody>
                            {optimization.savings_potential.by_category.map((item, idx) => (
                              <tr key={idx}>
                                <td>{item.category}</td>
                                <td>₹{item.current.toFixed(2)}</td>
                                <td>₹{item.suggested.toFixed(2)}</td>
                                <td className="amount">₹{item.potential_saving.toFixed(2)}</td>
                                <td>{item.saving_percent.toFixed(1)}%</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                )}

                {optimization.recommendations && optimization.recommendations.length > 0 && (
                  <div className="recommendations-section">
                    <h2>💡 Optimization Tips</h2>
                    <div className="recommendations-list">
                      {optimization.recommendations.map((rec, idx) => (
                        <div key={idx} className={`recommendation-item ${rec.type}`}>
                          <span className="rec-icon">
                            {rec.type === 'warning' && '⚠️'}
                            {rec.type === 'positive' && '✅'}
                            {rec.type === 'info' && 'ℹ️'}
                          </span>
                          <p>{rec.message}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </>
            )}
          </>
        )}
      </div>
    </div>
  );
}

export default Prediction;
