import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import Sidebar from '../components/Sidebar';
import StatCard from '../components/StatCard';
import RecentActivity from '../components/RecentActivity';
import QuickAddExpense from '../components/QuickAddExpense';
import './Dashboard.css';

function Dashboard() {
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const { user } = useAuth();

  const handleExpenseAdded = () => {
    // Trigger refresh of RecentActivity
    setRefreshTrigger(prev => prev + 1);
  };

  const stats = [
    {
      icon: { emoji: '💰', bgColor: '#e8d5f2' },
      label: 'Total Expenses',
      change: '12.5%',
      changeType: 'up',
    },
    {
      icon: { emoji: '📈', bgColor: '#d5f0e8' },
      label: 'Monthly Spend',
      change: '8.2%',
      changeType: 'down',
    },
    {
      icon: { emoji: '🎯', bgColor: '#f5e8d5' },
      label: 'Savings Estimate',
      change: '23.1%',
      changeType: 'down',
    },
  ];

  return (
    <div className="dashboard-container">
      <Sidebar />
      <div className="dashboard-main">
        <div className="dashboard-header">
          <div>
            <h1 className="page-title">Dashboard</h1>
            <p className="page-subtitle">Your financial overview at a glance</p>
          </div>
        </div>

        <div className="stats-grid">
          {stats.map((stat, index) => (
            <StatCard key={index} {...stat} />
          ))}
        </div>

        <div className="dashboard-content">
          <div className="content-left">
            <RecentActivity refreshTrigger={refreshTrigger} />
          </div>
          <div className="content-right">
            <QuickAddExpense onExpenseAdded={handleExpenseAdded} />
          </div>
        </div>
      </div>
    </div>
  );
}

export default Dashboard;
