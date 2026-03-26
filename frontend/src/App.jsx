import React from 'react';
import { Routes, Route } from 'react-router-dom';
import Navbar from './pages/Home/components/Navbar/Navbar';
import Hero from './pages/Home/components/Hero/Hero';
import Login from './pages/Loginpages/Login';
import Register from './pages/Loginpages/Register';
import Bodypage from './pages/Home/Bodypage/Bodypage';

const App = () => {
  return (
    <Routes>
      <Route
        path="/"
        element={
          <div className="overflow-x-hidden">
            <Navbar />
            <Hero />
            <Bodypage />
          </div>
        }
      />

      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
    </Routes>
  );
};

export default App;