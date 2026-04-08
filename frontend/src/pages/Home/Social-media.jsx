import React from "react";
import {
  FaInstagram,
  FaLinkedin,
  FaFacebook,
} from "react-icons/fa";
import Navbar from "./components/Navbar/Navbar";

const platforms = [
  {
    icon: <FaInstagram />,
    title: "Instagram Post",
    subtitle: "Social · Vertical",
  },
  {
    icon: <FaLinkedin />,
    title: "LinkedIn Post",
    subtitle: "Professional · Network",
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

const SocialMedia = () => {
  return (
    <div style={{ backgroundColor: "#4A2C4F", minHeight: "100vh", color: "#fff" }}>
      <Navbar />

      <div style={{ padding: "9rem"  }}>
        <h1 style={{ marginBottom: "0.5rem" }}>Social Media</h1>
        <p style={{ marginBottom: "2rem", color: "#ddd" }}>
          Manage your social media accounts and posts.
        </p>

        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            gap: "1.5rem",
            paddingTop: "2rem"
          }}
        >
          {platforms.map((platform, index) => (
            <div
              key={index}
              style={{
                backgroundColor: "#fff",
                color: "#333",
                borderRadius: "12px",
                padding: "1.5rem",
                width: "200px",
                textAlign: "center",
                boxShadow: "0 4px 12px rgba(0,0,0,0.2)",
                transition: "transform 0.2s",
                
              }}
            >
              <div style={{ fontSize: "2.5rem", marginBottom: "0.5rem" }}>
                {platform.icon}
              </div>

              <h3 style={{ margin: "0.5rem 0" }}>{platform.title}</h3>
              <p style={{ fontSize: "0.8rem", color: "#777" }}>
                {platform.subtitle}
              </p>

            
              <div
                style={{
                  display: "flex",
                  justifyContent: "center",
                  gap: "0.5rem",
                  marginTop: "1rem",
                }}
              >
                <button
                  style={{
                    padding: "0.4rem 0.8rem",
                    borderRadius: "6px",
                    border: "none",
                    backgroundColor: "#4A2C4F",
                    color: "#fff",
                    cursor: "pointer",
                    fontSize: "0.8rem",
                  }}
                >
                  Connect
                </button>

                <button
                  style={{
                    padding: "0.4rem 0.8rem",
                    borderRadius: "6px",
                    border: "1px solid #4A2C4F",
                    backgroundColor: "transparent",
                    color: "#4A2C4F",
                    cursor: "pointer",
                    fontSize: "0.8rem",
                  }}
                >
                  Settings
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default SocialMedia;