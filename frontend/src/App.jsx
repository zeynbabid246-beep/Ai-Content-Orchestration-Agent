import React from 'react';
import { Routes, Route } from 'react-router-dom';
import Navbar from './pages/Home/components/Navbar/Navbar';
import Hero from './pages/Home/components/Hero/Hero';
import Login from './pages/Loginpages/Login';
import Register from './pages/Loginpages/Register';
import Bodypage from './pages/Home/Bodypage/Bodypage';
import InviteUser from './pages/Home/invite-user';
import ContentType from './pages/Home/Content-type';
import ContentFeed from './pages/Home/ContentFeed';
import SocialMedia from './pages/Home/Social-media';
import Scheduler from './pages/Home/scheduler';
import QuikPublish from './pages/Home/quick-publish';
import Home from './pages/Home/Home';
import Profile from './pages/Home/profile';
import { Navigate } from 'react-router-dom';

function PrivateRoute({ children }) {
  const token = localStorage.getItem("token");
  return token ? children : <Navigate to="/login" replace />;
}
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
      <Route path="/invite-user" element={<InviteUser />} />
      <Route path="/quick-publish" element={<QuikPublish />} />
      <Route path="/publish" element={<QuikPublish />} />
      <Route path="/content-type" element={<ContentType />} />
      <Route path="/content-feed" element={<ContentFeed />} />
      <Route path="/social-media" element={<SocialMedia />} />
      <Route path="/scheduler" element={<Scheduler />} />
      <Route path="/home" element={<Home />} />
       <Route path="/profile" element={<Profile />} />
       
    </Routes>
    
  );
};

export default App;