import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './UserProfile.css';

function UserProfile() {
  const [logoutLoading, setLogoutLoading] = useState(false);
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      setLogoutLoading(true);
      await logout();
      navigate('/login');
    } catch (error) {
      console.error('Logout failed:', error);
      setLogoutLoading(false);
    }
  };

  // Get initials from email
  const getInitials = (email) => {
    if (!email) return 'U';
    const parts = email.split('@')[0].split('.');
    if (parts.length > 1) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return email.substring(0, 2).toUpperCase();
  };

  // Get display name from email
  const getDisplayName = (email) => {
    if (!email) return 'User';
    return email.split('@')[0].split('.').map(p => p.charAt(0).toUpperCase() + p.slice(1)).join(' ');
  };

  return (
    <div className="user-profile-card">
      <div className="user-profile-header">
        <div className="user-avatar-large">{getInitials(user?.email)}</div>
        <div className="user-info-details">
          <p className="user-name-display">{getDisplayName(user?.email)}</p>
          <p className="user-email-display">{user?.email}</p>
          <p className="user-tier">Premium Member</p>
        </div>
      </div>

      <button 
        className="logout-button" 
        onClick={handleLogout}
        disabled={logoutLoading}
      >
        <span className="logout-icon">🚪</span>
        {logoutLoading ? 'Logging out...' : 'Logout'}
      </button>
    </div>
  );
}

export default UserProfile;
