import React from "react";
import {
  FaInstagram,
  FaBlogger,
  FaLinkedin,
  FaImage,
  FaFacebook,
} from "react-icons/fa";
import "./Content-type.css";
import Navbar from "./components/Navbar/Navbar";

const platforms = [
  {
    icon: <FaInstagram />,
    title: "Instagram Story",
    subtitle: "Social · Vertical",
  },
  {
    icon: <FaBlogger />,
    title: "Blog Post",
    subtitle: "Content · Long-form",
  },
  {
    icon: <FaLinkedin />,
    title: "LinkedIn Post",
    subtitle: "Professional · Network",
  },
  {
    icon: <FaImage />,
    title: "Post Image",
    subtitle: "Visual · Creative",
  },
  {
    icon: <FaFacebook />,
    title: "Facebook Post",
    subtitle: "Social · Engagement",
  },
  {
    icon: <FaInstagram />,
    title: "Instagram Post",
    subtitle: "Social · Square",
  },
];

const ContentType = () => {
  return (
    <>
    <Navbar />
    <div className="content-type-wrapper">
      <div className="content-type-header">
        <h2>Choose Content Type</h2>
        <p>Select a platform and format to get started</p>
      </div>

      <div className="content-type-grid">
        {platforms.map((platform, index) => (
          <div className="content-card" key={index}>
            <div className="card-icon-wrapper">{platform.icon}</div>
            <h3 className="card-title">{platform.title}</h3>
            <p className="card-subtitle">{platform.subtitle}</p>
            <div className="card-actions">
              <button className="btn-type text">Text</button>
              <button className="btn-type image">Image</button>
            </div>
          </div>
        ))}
      </div>
    </div>
</>
  );
};

export default ContentType;