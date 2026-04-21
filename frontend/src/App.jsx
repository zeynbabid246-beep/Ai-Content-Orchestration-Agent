// src/App.tsx

import { Routes, Route, Navigate } from 'react-router-dom';
import AppV2Entry from './app-v2/app/AppV2Entry';

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/app/login" replace />} />
      <Route path="/login" element={<Navigate to="/app/login" replace />} />
      <Route path="/register" element={<Navigate to="/app/register" replace />} />
      <Route path="/app/*" element={<AppV2Entry />} />
      <Route path="*" element={<Navigate to="/app/login" replace />} />
    </Routes>
  );
}