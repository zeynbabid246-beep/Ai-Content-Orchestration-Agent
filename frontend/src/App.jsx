import { Routes, Route, Navigate } from 'react-router-dom';

import Login from "./pages/Loginpages/Login";
import Register from "./pages/Loginpages/Register";
import AppV2Entry from "./app-v2/app/AppV2Entry";

export default function App() {
  return (
    <Routes>
      {/* Public legacy routes (if not yet migrated fully) */}
      <Route path="/" element={<Navigate to="/app/dashboard" replace />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />

      {/* Main App V2 Route */}
      <Route path="/app/*" element={<AppV2Entry />} />

      {/* Fallback */}
      <Route path="*" element={<Navigate to="/app/dashboard" replace />} />
    </Routes>
  );
}