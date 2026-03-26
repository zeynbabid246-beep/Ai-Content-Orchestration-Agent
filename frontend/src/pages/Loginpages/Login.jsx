import { useNavigate } from "react-router-dom";
import "./Login.css";

export default function Login() {
  const navigate = useNavigate();

  return (
    <div className="login-container">
      <div className="login-box">

        <h2>Welcome to Ai_content-flow</h2>
        <p className="login-subtitle">Sign in to your account</p>

        <input type="email" placeholder="Email" />
        <input type="password" placeholder="Password" />

        <button className="login-btn" onClick={() => console.log("login!")}>
          Se connecter
        </button>

        <div className="divider">
          <span>or continue with</span>
        </div>

        <div className="social-buttons">
          <button className="social-btn google">
            <svg width="18" height="18" viewBox="0 0 48 48">
              <path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.7 32.7 29.3 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3 0 5.7 1.1 7.8 3l5.7-5.7C34.5 6.1 29.6 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.7-.4-4z"/>
              <path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.7 16.3 19 12 24 12c3 0 5.7 1.1 7.8 3l5.7-5.7C34.5 6.1 29.6 4 24 4c-7.7 0-14.3 4.3-17.7 10.7z"/>
              <path fill="#4CAF50" d="M24 44c5.2 0 10-2 13.6-5.3l-6.3-5.2C29.3 35.8 26.8 36.7 24 36c-5.3 0-9.7-3.3-11.3-7.9l-6.6 5.1C9.3 39.7 16.1 44 24 44z"/>
              <path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-1.1 3-3.4 5.3-6.3 6.5l6.3 5.2C38.7 36.5 44 31 44 24c0-1.3-.1-2.7-.4-4z"/>
            </svg>
            Google
          </button>

        
          <button className="social-btn linkedin">
            LinkedIn
          </button>

          
          <button className="social-btn facebook">
            Facebook
          </button>

        </div>

        <p className="register-link">
          Don't have an account?{" "}
          <span onClick={() => navigate("/register")}>
            Please Register
          </span>
        </p>

      </div>
    </div>
  );
}