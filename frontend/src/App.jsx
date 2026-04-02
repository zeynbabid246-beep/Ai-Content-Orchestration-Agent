import React from 'react';
import { Routes, Route } from 'react-router-dom';
import Navbar from './pages/Home/components/Navbar/Navbar';
import Hero from './pages/Home/components/Hero/Hero';
import Login from './pages/Loginpages/Login';
import Register from './pages/Loginpages/Register';
import Bodypage from './pages/Home/Bodypage/Bodypage';
import Overview from './pages/Home/overview';
import Interests from './pages/Home/interests';
import ContentType from './pages/Home/content-type';
import ContentFeed from './pages/Home/content-feed';
import SocialMedia from './pages/Home/social-media';
import Publish from './pages/Home/scheduler';
import QuikPublish from './pages/Home/QuikPublish';

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
     
        <Route path="/overview" element={<Overview />} />
        <Route path="/quick-publish" element={<QuikPublish />} />
        <Route path="/content-type" element={<ContentType />} />
        <Route path="/content-feed" element={<ContentFeed />} />
        <Route path="/social-media" element={<SocialMedia />} />
        <Route path="/publish" element={<Publish />} />
      </Routes>
    
  );
};

export default App;