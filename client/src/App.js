import React, { useState, createContext, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import Dashboard from './pages/Dashboard';
import Activity from './pages/Activity';
import Analytics from './pages/Analytics';
import Budgets from './pages/Budgets';
import Insights from './pages/Insights';
import Prediction from './pages/Prediction';
import Settings from './pages/Settings';
import Login from './pages/Login';
import SignUp from './pages/SignUp';
import ProtectedRoute from './components/ProtectedRoute';
import './App.css';

export const SidebarContext = createContext();

function App() {
  const [currentPage, setCurrentPage] = useState('Dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(true);

  // Apply saved theme on mount
  useEffect(() => {
    const savedTheme = localStorage.getItem('theme') || 'light';
    document.documentElement.setAttribute('data-theme', savedTheme);
    document.body.setAttribute('data-theme', savedTheme);
  }, []);

  return (
    <Router>
      <AuthProvider>
        <SidebarContext.Provider value={{ sidebarOpen, setSidebarOpen }}>
          <div className="App">
            <Routes>

              {/* Public Routes */}
              <Route path="/login" element={<Login />} />
              <Route path="/signup" element={<SignUp />} />
              
              {/* Protected Routes */}
              <Route 
                path="/" 
                element={<Navigate to="/dashboard" />} 
              />
              <Route 
                path="/dashboard" 
                element={
                  <ProtectedRoute>
                    <Dashboard onPageChange={setCurrentPage} />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/activity" 
                element={
                  <ProtectedRoute>
                    <Activity onPageChange={setCurrentPage} />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/analytics" 
                element={
                  <ProtectedRoute>
                    <Analytics onPageChange={setCurrentPage} />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/budgets" 
                element={
                  <ProtectedRoute>
                    <Budgets onPageChange={setCurrentPage} />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/insights" 
                element={
                  <ProtectedRoute>
                    <Insights onPageChange={setCurrentPage} />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/predictions" 
                element={
                  <ProtectedRoute>
                    <Prediction onPageChange={setCurrentPage} />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/settings" 
                element={
                  <ProtectedRoute>
                    <Settings onPageChange={setCurrentPage} />
                  </ProtectedRoute>
                } 
              />
            </Routes>
          </div>
        </SidebarContext.Provider>
      </AuthProvider>
    </Router>
  );
}

// hello test
export default App;
