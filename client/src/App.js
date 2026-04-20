import React, { useState, createContext } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import Dashboard from './pages/Dashboard';
import Activity from './pages/Activity';
import Analytics from './pages/Analytics';
import Settings from './pages/Settings';
import Login from './pages/Login';
import SignUp from './pages/SignUp';
import ProtectedRoute from './components/ProtectedRoute';
import './App.css';

export const SidebarContext = createContext();

function App() {
  const [currentPage, setCurrentPage] = useState('Dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(true);

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
