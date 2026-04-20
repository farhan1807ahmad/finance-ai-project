import React, { useContext } from 'react';
import Sidebar from '../components/Sidebar';
import { SidebarContext } from '../App';
import {
  CategoryBreakdownChart,
  SpendingTrendChart,
  SpendingDistributionChart,
  StatCard
} from '../components/AnalyticsCharts';
import { useAnalyticsData } from '../hooks/useAnalyticsData';
import { formatCurrency } from '../utils/chartUtils';
import './Analytics.css';

function Analytics() {
  const { categoryBreakdown, spendingTrend, summary, loading, error } = useAnalyticsData();
  const { sidebarOpen } = useContext(SidebarContext);

  if (error) {
    return (
      <div className="analytics-page">
        <Sidebar />
        <div 
          className="analytics-main"
          style={{ marginLeft: sidebarOpen ? '200px' : '60px' }}
        >
          <p className="error-message">Error: {error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="analytics-page">
      <Sidebar />
      <div 
        className="analytics-main"
        style={{ marginLeft: sidebarOpen ? '200px' : '60px' }}
      >
        {/* Header */}
        <div className="analytics-header">
          <h1 className="page-title">Analytics</h1>
          <p className="page-subtitle">Deep insights into your spending patterns</p>
        </div>

        {/* Summary Stats */}
        {summary && !loading && (
          <div className="summary-stats">
            <StatCard
              label="Average Daily Spend"
              value={formatCurrency(summary.averageTransaction)}
              icon="💰"
            />
            <StatCard
              label="Highest Category"
              value={summary.topCategory}
              icon="📊"
            />
            <StatCard
              label="Monthy Spends"
              value={formatCurrency(summary.monthlySpend)}
              icon="📈"
            />
            <StatCard
              label="Total Transactions"
              value={summary.transactionCount}
              icon="🔢"
            />
          </div>
        )}

        {/* Charts Grid */}
        <div className="charts-grid">
          {loading ? (
            <div className="loading">Loading analytics...</div>
          ) : (
            <>
              {categoryBreakdown.length > 0 && (
                <div className="chart-wrapper full-width">
                  <CategoryBreakdownChart data={categoryBreakdown} />
                </div>
              )}

              <div className="chart-row">
                {spendingTrend.length > 0 && (
                  <div className="chart-wrapper half-width">
                    <SpendingTrendChart data={spendingTrend} />
                  </div>
                )}

                {categoryBreakdown.length > 0 && (
                  <div className="chart-wrapper half-width">
                    <SpendingDistributionChart data={categoryBreakdown} />
                  </div>
                )}
              </div>
            </>
          )}

          {!loading && categoryBreakdown.length === 0 && (
            <div className="no-data">
              <p>No expense data available. Add some expenses to see analytics!</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default Analytics;
