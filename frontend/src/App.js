import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from './services/authStore';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import WasteLogs from './pages/WasteLogs';
import Analytics from './pages/Analytics';
import Meals from './pages/Meals';
import Alerts from './pages/Alerts';
import Login from './pages/Login';

const ProtectedRoute = ({ children }) => {
  const token = useAuthStore((s) => s.token);
  return token ? children : <Navigate to="/login" replace />;
};

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/" element={<ProtectedRoute><Layout /></ProtectedRoute>}>
        <Route index element={<Navigate to="/dashboard" replace />} />
        <Route path="dashboard" element={<Dashboard />} />
        <Route path="waste"     element={<WasteLogs />} />
        <Route path="analytics" element={<Analytics />} />
        <Route path="meals"     element={<Meals />} />
        <Route path="alerts"    element={<Alerts />} />
      </Route>
    </Routes>
  );
}
