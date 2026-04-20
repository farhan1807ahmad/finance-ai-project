import React, { useState, useContext } from 'react';
import { useAuth } from '../context/AuthContext';
import { SidebarContext } from '../App';
import Sidebar from '../components/Sidebar';
import './Settings.css';

function Settings() {
  const { user } = useAuth();
  const { sidebarOpen } = useContext(SidebarContext);
  const [settings, setSettings] = useState({
    theme: localStorage.getItem('theme') || 'light',
    notifications: localStorage.getItem('notifications') === 'true' || true,
    emailAlerts: localStorage.getItem('emailAlerts') === 'true' || true,
    twoFactor: localStorage.getItem('twoFactor') === 'true' || false,
    privateProfile: localStorage.getItem('privateProfile') === 'true' || false,
  });

  const [saveMessage, setSaveMessage] = useState('');

  const handleToggle = (key) => {
    const newSettings = { ...settings, [key]: !settings[key] };
    setSettings(newSettings);
    localStorage.setItem(key, newSettings[key]);
    setSaveMessage('✅ Setting saved!');
    setTimeout(() => setSaveMessage(''), 2000);
  };

  const handleThemeChange = (theme) => {
    setSettings({ ...settings, theme });
    localStorage.setItem('theme', theme);
    document.documentElement.setAttribute('data-theme', theme);
    setSaveMessage('✅ Theme updated!');
    setTimeout(() => setSaveMessage(''), 2000);
  };

  const getDisplayName = (email) => {
    if (!email) return 'User';
    return email.split('@')[0].split('.').map(p => p.charAt(0).toUpperCase() + p.slice(1)).join(' ');
  };

  return (
    <div className="dashboard-container">
      <Sidebar />
      <div 
        className="settings-main"
        style={{ marginLeft: sidebarOpen ? '200px' : '60px' }}
      >
        <div className="settings-header">
          <h1 className="settings-title">Settings</h1>
          <p className="settings-subtitle">Manage your account preferences</p>
        </div>

        {saveMessage && <div className="save-message">{saveMessage}</div>}

        {/* Account Section */}
        <div className="settings-section">
          <h2 className="section-title">👤 Account</h2>
          <div className="settings-card">
            <div className="setting-item">
              <div className="setting-info">
                <h3>Email Address</h3>
                <p className="setting-desc">Your account email</p>
              </div>
              <span className="setting-value">{user?.email}</span>
            </div>
            <div className="setting-item border-top">
              <div className="setting-info">
                <h3>Display Name</h3>
                <p className="setting-desc">How your name appears</p>
              </div>
              <span className="setting-value">{getDisplayName(user?.email)}</span>
            </div>
            <div className="setting-item border-top">
              <div className="setting-info">
                <h3>Member Since</h3>
                <p className="setting-desc">Account created date</p>
              </div>
              <span className="setting-value">{new Date().toLocaleDateString()}</span>
            </div>
          </div>
        </div>

        {/* Preferences Section */}
        <div className="settings-section">
          <h2 className="section-title">🎨 Preferences</h2>
          <div className="settings-card">
            <div className="setting-item">
              <div className="setting-info">
                <h3>Theme</h3>
                <p className="setting-desc">Choose your preferred theme</p>
              </div>
              <div className="theme-selector">
                <button
                  className={`theme-btn ${settings.theme === 'light' ? 'active' : ''}`}
                  onClick={() => handleThemeChange('light')}
                >
                  ☀️ Light
                </button>
                <button
                  className={`theme-btn ${settings.theme === 'dark' ? 'active' : ''}`}
                  onClick={() => handleThemeChange('dark')}
                >
                  🌙 Dark
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Notifications Section */}
        <div className="settings-section">
          <h2 className="section-title">🔔 Notifications</h2>
          <div className="settings-card">
            <div className="setting-item">
              <div className="setting-info">
                <h3>Push Notifications</h3>
                <p className="setting-desc">Receive app notifications</p>
              </div>
              <label className="toggle-switch">
                <input
                  type="checkbox"
                  checked={settings.notifications}
                  onChange={() => handleToggle('notifications')}
                />
                <span className="slider"></span>
              </label>
            </div>
            <div className="setting-item border-top">
              <div className="setting-info">
                <h3>Email Alerts</h3>
                <p className="setting-desc">Get email notifications</p>
              </div>
              <label className="toggle-switch">
                <input
                  type="checkbox"
                  checked={settings.emailAlerts}
                  onChange={() => handleToggle('emailAlerts')}
                />
                <span className="slider"></span>
              </label>
            </div>
          </div>
        </div>

        {/* Security Section */}
        <div className="settings-section">
          <h2 className="section-title">🔒 Security</h2>
          <div className="settings-card">
            <div className="setting-item">
              <div className="setting-info">
                <h3>Two-Factor Authentication</h3>
                <p className="setting-desc">Add extra security to your account</p>
              </div>
              <label className="toggle-switch">
                <input
                  type="checkbox"
                  checked={settings.twoFactor}
                  onChange={() => handleToggle('twoFactor')}
                />
                <span className="slider"></span>
              </label>
            </div>
            <div className="setting-item border-top">
              <div className="setting-info">
                <h3>Change Password</h3>
                <p className="setting-desc">Update your password</p>
              </div>
              <button className="btn-secondary">Change</button>
            </div>
          </div>
        </div>

        {/* Privacy Section */}
        <div className="settings-section">
          <h2 className="section-title">🛡️ Privacy</h2>
          <div className="settings-card">
            <div className="setting-item">
              <div className="setting-info">
                <h3>Private Profile</h3>
                <p className="setting-desc">Make your profile private</p>
              </div>
              <label className="toggle-switch">
                <input
                  type="checkbox"
                  checked={settings.privateProfile}
                  onChange={() => handleToggle('privateProfile')}
                />
                <span className="slider"></span>
              </label>
            </div>
            <div className="setting-item border-top">
              <div className="setting-info">
                <h3>Data Export</h3>
                <p className="setting-desc">Download your data</p>
              </div>
              <button className="btn-secondary">Export</button>
            </div>
          </div>
        </div>

        {/* Danger Zone */}
        <div className="settings-section danger-zone">
          <h2 className="section-title">⚠️ Danger Zone</h2>
          <div className="settings-card">
            <div className="setting-item">
              <div className="setting-info">
                <h3>Delete Account</h3>
                <p className="setting-desc">Permanently delete your account and all data</p>
              </div>
              <button className="btn-danger">Delete</button>
            </div>
          </div>
        </div>

        <div className="settings-footer">
          <p>All settings are saved automatically</p>
        </div>
      </div>
    </div>
  );
}

export default Settings;
