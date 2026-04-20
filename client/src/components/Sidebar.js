import React, { useContext } from 'react';
import { Link, useLocation } from 'react-router-dom';
import UserProfile from './UserProfile';
import { SidebarContext } from '../App';
import './Sidebar.css';

function Sidebar() {
  const location = useLocation();
  const { sidebarOpen, setSidebarOpen } = useContext(SidebarContext);

  const isActive = (path) => {
    return location.pathname === path;
  };

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  return (
    <div className={`sidebar ${sidebarOpen ? 'open' : 'closed'}`}>
      <div className="sidebar-header">
        <button className="sidebar-toggle" onClick={toggleSidebar} title="Toggle Sidebar">
          <span className="toggle-icon">{sidebarOpen ? '✕' : '☰'}</span>
        </button>
      </div>
      
      <nav className="sidebar-nav">
        <Link to="/dashboard" className={`nav-item ${isActive('/dashboard') ? 'active' : ''}`}>
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
        <Link to="/settings" className={`nav-item ${isActive('/settings') ? 'active' : ''}`}>
          <span className="nav-icon">⚙️</span>
          <span className="nav-text">Settings</span>
        </Link>
      </nav>

      <div className="sidebar-footer">
        <UserProfile />
      </div>
    </div>
  );
}

export default Sidebar;
