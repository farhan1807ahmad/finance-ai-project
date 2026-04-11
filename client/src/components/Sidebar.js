import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import './Sidebar.css';

function Sidebar() {
  const location = useLocation();

  const isActive = (path) => {
    return location.pathname === path;
  };

  return (
    <div className="sidebar">
      <nav className="sidebar-nav">
        <Link to="/" className={`nav-item ${isActive('/') ? 'active' : ''}`}>
          <span className="nav-icon">📊</span>
          <span className="nav-text">Dashboard</span>
        </Link>
        <Link to="/activity" className={`nav-item ${isActive('/activity') ? 'active' : ''}`}>
          <span className="nav-icon">📈</span>
          <span className="nav-text">Activity</span>
        </Link>
        <div className="nav-item">
          <span className="nav-icon">🤖</span>
          <span className="nav-text">Insights (AI)</span>
        </div>
        <Link to="/analytics" className={`nav-item ${isActive('/analytics') ? 'active' : ''}`}>
          <span className="nav-icon">📉</span>
          <span className="nav-text">Analytics</span>
        </Link>
        <div className="nav-item">
          <span className="nav-icon">💼</span>
          <span className="nav-text">Budgets</span>
        </div>
        <div className="nav-item">
          <span className="nav-icon">🔮</span>
          <span className="nav-text">Predictions</span>
        </div>
        <div className="nav-item">
          <span className="nav-icon">⚙️</span>
          <span className="nav-text">Settings</span>
        </div>
      </nav>

      <div className="sidebar-footer">
        <div className="user-profile">
          <div className="user-avatar">AM</div>
          <div className="user-info">
            <p className="user-name">Alex Morgan</p>
            <p className="user-status">Premium</p>
          </div>
        </div>
        <div className="logout-btn">
          <span className="logout-icon">🚪</span>
          <span className="logout-text">Logout</span>
        </div>
      </div>
    </div>
  );
}

export default Sidebar;
