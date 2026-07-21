import React, { useState, useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { Box } from '@mui/material';
import Layout from './components/Layout';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Campaigns from './pages/Campaigns';
import CampaignCreate from './pages/CampaignCreate';
import CampaignDetail from './pages/CampaignDetail';
import Contacts from './pages/Contacts';
import CRM from './pages/CRM';
import BusinessData from './pages/BusinessData';
import Analytics from './pages/Analytics';
import Settings from './pages/Settings';
import Profile from './pages/Profile';
import ProTips from './pages/ProTips'; // 💡 NEW: Pro Tips page
import ProgressTrackerDemo from './pages/ProgressTrackerDemo';
import { ProgressTrackerProvider } from './contexts/ProgressTrackerContext';
import ProgressTrackerManager from './components/ProgressTrackerManager';
import DeveloperDebugPanel from './components/DeveloperDebugPanel'; // 🐛 Debug panel

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Simple token check for now
    const token = localStorage.getItem('token');
    setIsAuthenticated(!!token);
    setLoading(false);
  }, []);

  if (loading) {
    return (
      <Box 
        display="flex" 
        justifyContent="center" 
        alignItems="center" 
        height="100vh"
      >
        <div className="loading-spinner" />
      </Box>
    );
  }

  if (!isAuthenticated) {
    return <Login />;
  }

  return (
    <ProgressTrackerProvider>
      <Layout>
        <Routes>
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/campaigns" element={<Campaigns />} />
          <Route path="/campaigns/create" element={<CampaignCreate />} />
          <Route path="/campaigns/:id" element={<CampaignDetail />} />
          <Route path="/contacts" element={<Contacts />} />
          <Route path="/crm" element={<CRM />} />
          <Route path="/business-data" element={<BusinessData />} />
          <Route path="/analytics" element={<Analytics />} />
          <Route path="/pro-tips" element={<ProTips />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/progress-demo" element={<ProgressTrackerDemo />} />
          <Route path="/settings" element={<Settings />} />
        </Routes>
        
        {/* Global Progress Tracker Manager */}
        <ProgressTrackerManager />
        
        {/* 🐛 DEVELOPER DEBUG PANEL - Pure additive enhancement */}
        <DeveloperDebugPanel />
      </Layout>
    </ProgressTrackerProvider>
  );
}

export default App;