import { Routes, Route, Navigate } from 'react-router-dom';
import AppV2Entry from './app-v2/app/AppV2Entry';

export default function App() {
  return (
    <Routes>
      {/* Redirect legacy routes into the v2 app */}
      <Route path="/" element={<Navigate to="/app/dashboard" replace />} />
      <Route path="/login" element={<Navigate to="/app/login" replace />} />
      <Route path="/register" element={<Navigate to="/app/register" replace />} />

      {/* Main App V2 */}
      <Route path="/app/*" element={<AppV2Entry />} />

      {/* Fallback */}
      <Route path="*" element={<Navigate to="/app/dashboard" replace />} />
    </Routes>
  );
}