import { useState } from "react";
import { useNavigate } from "react-router-dom";

const styles = `
  @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@300;400;600&family=Jost:wght@200;300;400&display=swap');

  .login-container {
    min-height: 100vh;
    background-color: #1a0f1e;
    background-image:
      radial-gradient(ellipse 80% 60% at 20% 10%, rgba(74,44,79,0.9) 0%, transparent 60%),
      radial-gradient(ellipse 60% 80% at 80% 90%, rgba(122,77,130,0.35) 0%, transparent 60%),
      radial-gradient(ellipse 40% 40% at 50% 50%, rgba(212,175,122,0.04) 0%, transparent 70%);
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 2rem;
    position: relative;
    overflow: hidden;
  }

  .login-container::before,
  .login-container::after {
    content: '';
    position: absolute;
    width: 320px;
    height: 320px;
    border: 1px solid rgba(212,175,122,0.08);
    border-radius: 50%;
    pointer-events: none;
  }
  .login-container::before { top: -80px; left: -80px; }
  .login-container::after  { bottom: -80px; right: -80px; }

  .login-box {
    background: linear-gradient(160deg, rgba(255,255,255,0.07) 0%, rgba(255,255,255,0.03) 100%);
    border: 1px solid rgba(212,175,122,0.18);
    border-radius: 4px;
    padding: 3.5rem 3rem;
    width: 100%;
    max-width: 420px;
    position: relative;
    backdrop-filter: blur(24px);
    -webkit-backdrop-filter: blur(24px);
    box-shadow: 0 0 0 1px rgba(74,44,79,0.4), 0 32px 64px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.08);
    animation: cardRise 0.7s cubic-bezier(0.22,1,0.36,1) both;
  }

  @keyframes cardRise {
    from { opacity: 0; transform: translateY(28px); }
    to   { opacity: 1; transform: translateY(0); }
  }

  .login-box::before {
    content: '';
    position: absolute;
    top: 0; left: 10%; right: 10%;
    height: 1px;
    background: linear-gradient(90deg, transparent, #d4af7a, transparent);
  }

  .login-box h2 {
    font-weight: 300;
    font-size: 2.2rem;
    letter-spacing: 0.01em;
    color: #f5efe8;
    text-align: center;
    line-height: 1.15;
    margin: 0 0 0.5rem;
  }

  .login-subtitle {
    font-family: 'Jost', sans-serif;
    font-weight: 200;
    font-size: 0.75rem;
    letter-spacing: 0.25em;
    text-transform: uppercase;
    color: #c5a0cc;
    text-align: center;
    margin: 0 0 2.5rem;
  }

  .login-box input {
    display: block;
    width: 100%;
    margin-bottom: 0.35rem;
    padding: 0.85rem 1.1rem;
    background: rgba(255,255,255,0.04);
    border: 1px solid rgba(212,175,122,0.2);
    border-radius: 2px;
    color: #f5efe8;
    font-family: 'Jost', sans-serif;
    font-weight: 300;
    font-size: 0.9rem;
    letter-spacing: 0.04em;
    transition: border-color 0.25s, background 0.25s, box-shadow 0.25s;
    outline: none;
    box-sizing: border-box;
  }

  .login-box input.input-error {
    border-color: rgba(220, 80, 80, 0.7);
    background: rgba(220,80,80,0.04);
  }

  .login-box input::placeholder { color: rgba(197,160,204,0.45); font-weight: 200; letter-spacing: 0.06em; }
  .login-box input:focus {
    border-color: #d4af7a;
    background: rgba(212,175,122,0.05);
    box-shadow: 0 0 0 3px rgba(212,175,122,0.08);
  }

  .field-error {
    font-family: 'Jost', sans-serif;
    font-size: 0.7rem;
    color: rgba(240, 120, 120, 0.9);
    letter-spacing: 0.03em;
    margin-bottom: 0.75rem;
    padding-left: 0.25rem;
    display: block;
    min-height: 1rem;
  }

  .login-btn {
    display: block;
    width: 100%;
    padding: 0.9rem 1rem;
    background: linear-gradient(135deg, #d4af7a 0%, #c4974a 100%);
    border: none;
    border-radius: 2px;
    color: #1a0f1e;
    font-family: 'Jost', sans-serif;
    font-weight: 400;
    font-size: 0.78rem;
    letter-spacing: 0.22em;
    text-transform: uppercase;
    cursor: pointer;
    transition: opacity 0.2s, transform 0.15s, box-shadow 0.2s;
    box-shadow: 0 4px 18px rgba(212,175,122,0.25);
    margin-top: 0.5rem;
    margin-bottom: 1.75rem;
    box-sizing: border-box;
  }

  .login-btn:hover:not(:disabled) { opacity: 0.92; transform: translateY(-1px); box-shadow: 0 8px 28px rgba(212,175,122,0.35); }
  .login-btn:active:not(:disabled) { transform: translateY(0); opacity: 0.85; }
  .login-btn:disabled { opacity: 0.55; cursor: not-allowed; }

  .error-banner {
    font-family: 'Jost', sans-serif;
    font-size: 0.8rem;
    font-weight: 300;
    letter-spacing: 0.03em;
    color: rgba(240, 120, 120, 0.95);
    background: rgba(220, 80, 80, 0.08);
    border: 1px solid rgba(220, 80, 80, 0.25);
    border-radius: 2px;
    padding: 0.65rem 0.85rem;
    margin-bottom: 1.25rem;
    text-align: center;
  }

  .success-banner {
    font-family: 'Jost', sans-serif;
    font-size: 0.8rem;
    font-weight: 300;
    letter-spacing: 0.03em;
    color: rgba(130, 215, 160, 0.95);
    background: rgba(80, 180, 120, 0.08);
    border: 1px solid rgba(80, 180, 120, 0.25);
    border-radius: 2px;
    padding: 0.65rem 0.85rem;
    margin-bottom: 1.25rem;
    text-align: center;
  }

  .divider {
    display: flex;
    align-items: center;
    gap: 0.85rem;
    margin-bottom: 1.25rem;
  }

  .divider::before,
  .divider::after {
    content: '';
    flex: 1;
    height: 1px;
    background: linear-gradient(90deg, transparent, rgba(212,175,122,0.2), transparent);
  }

  .divider span {
    font-family: 'Jost', sans-serif;
    font-weight: 200;
    font-size: 0.68rem;
    letter-spacing: 0.18em;
    text-transform: uppercase;
    color: rgba(197,160,204,0.5);
    white-space: nowrap;
  }

  .social-buttons {
    display: flex;
    gap: 0.65rem;
    margin-bottom: 1.75rem;
  }

  .social-btn {
    flex: 1;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0.45rem;
    padding: 0.65rem 0.5rem;
    background: rgba(255,255,255,0.04);
    border: 1px solid rgba(212,175,122,0.15);
    border-radius: 2px;
    color: #c5a0cc;
    font-family: 'Jost', sans-serif;
    font-weight: 300;
    font-size: 0.72rem;
    letter-spacing: 0.06em;
    cursor: pointer;
    transition: background 0.2s, border-color 0.2s, color 0.2s, transform 0.15s;
  }

  .social-btn:hover { background: rgba(212,175,122,0.07); border-color: rgba(212,175,122,0.35); color: #f5efe8; transform: translateY(-1px); }
  .social-btn:active { transform: translateY(0); }

  .register-link {
    font-family: 'Jost', sans-serif;
    font-weight: 200;
    font-size: 0.8rem;
    color: #c5a0cc;
    text-align: center;
    letter-spacing: 0.04em;
    margin: 0;
  }

  .register-link span {
    color: #e8cfa0;
    cursor: pointer;
    text-decoration: underline;
    text-underline-offset: 3px;
    text-decoration-color: rgba(212,175,122,0.4);
    transition: color 0.2s, text-decoration-color 0.2s;
  }

  .register-link span:hover { color: #d4af7a; text-decoration-color: #d4af7a; }
`;

export default function Login() {
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errors, setErrors] = useState({});
  const [apiError, setApiError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const validate = () => {
    const e = {};
    if (!email.trim()) e.email = "Email is required";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) e.email = "Enter a valid email address";
    if (!password) e.password = "Password is required";
    return e;
  };

  const handleLogin = async () => {
    setApiError("");
    const e = validate();
    setErrors(e);
    if (Object.keys(e).length > 0) return;

    setIsLoading(true);
    try {
      const response = await fetch("http://localhost:5073/api/Auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ Email: email.trim(), Password: password }),
      });

      const data = await response.json();

      if (response.ok) {
        localStorage.setItem("accessToken", data.AccessToken);
        localStorage.setItem("refreshToken", data.RefreshToken);
        localStorage.setItem("userId", data.UserId);
        localStorage.setItem("username", data.Username);
        navigate("/home");
      } else {
        setApiError(data?.message || data?.error || `Error ${response.status}: Invalid credentials`);
      }
    } catch (error) {
      console.error("Network error:", error);
      setApiError("Cannot connect to server. Is the backend running on port 5073?");
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter") handleLogin();
  };

  return (
    <>
      <style>{styles}</style>
      <div className="login-container">
        <div className="login-box">
          <h2>Ai_content‑flow</h2>
          <p className="login-subtitle">Sign in to your account</p>

          {apiError && <div className="error-banner">{apiError}</div>}

          <input
            type="email"
            placeholder="Email address"
            value={email}
            onChange={(e) => { setEmail(e.target.value); setErrors((p) => ({ ...p, email: "" })); }}
            onKeyDown={handleKeyDown}
            className={errors.email ? "input-error" : ""}
            autoComplete="email"
          />
          <span className="field-error">{errors.email || ""}</span>

          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => { setPassword(e.target.value); setErrors((p) => ({ ...p, password: "" })); }}
            onKeyDown={handleKeyDown}
            className={errors.password ? "input-error" : ""}
            autoComplete="current-password"
          />
          <span className="field-error">{errors.password || ""}</span>

          <button className="login-btn" onClick={handleLogin} disabled={isLoading}>
            {isLoading ? "Signing in…" : "Sign in"}
          </button>

          <div className="divider"><span>or continue with</span></div>

          <div className="social-buttons">
            <button className="social-btn google">
              <svg width="15" height="15" viewBox="0 0 48 48">
                <path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.7 32.7 29.3 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3 0 5.7 1.1 7.8 3l5.7-5.7C34.5 6.1 29.6 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.7-.4-4z" />
                <path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.7 16.3 19 12 24 12c3 0 5.7 1.1 7.8 3l5.7-5.7C34.5 6.1 29.6 4 24 4c-7.7 0-14.3 4.3-17.7 10.7z" />
                <path fill="#4CAF50" d="M24 44c5.2 0 10-2 13.6-5.3l-6.3-5.2C29.3 35.8 26.8 36.7 24 36c-5.3 0-9.7-3.3-11.3-7.9l-6.6 5.1C9.3 39.7 16.1 44 24 44z" />
                <path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-1.1 3-3.4 5.3-6.3 6.5l6.3 5.2C38.7 36.5 44 31 44 24c0-1.3-.1-2.7-.4-4z" />
              </svg>
              Google
            </button>
            <button className="social-btn linkedin">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="#0A66C2">
                <path d="M20.45 20.45h-3.55v-5.57c0-1.33-.03-3.04-1.85-3.04-1.86 0-2.14 1.45-2.14 2.95v5.66H9.36V9h3.41v1.56h.05c.47-.9 1.63-1.85 3.36-1.85 3.6 0 4.26 2.37 4.26 5.45v6.29zM5.34 7.43a2.06 2.06 0 1 1 0-4.12 2.06 2.06 0 0 1 0 4.12zM7.12 20.45H3.56V9h3.56v11.45zM22.22 0H1.77C.79 0 0 .77 0 1.72v20.56C0 23.23.79 24 1.77 24h20.45c.98 0 1.78-.77 1.78-1.72V1.72C24 .77 23.2 0 22.22 0z" />
              </svg>
              LinkedIn
            </button>
            <button className="social-btn facebook">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="#1877F2">
                <path d="M24 12.07C24 5.41 18.63 0 12 0S0 5.41 0 12.07C0 18.1 4.39 23.1 10.13 24v-8.44H7.08v-3.49h3.04V9.41c0-3.02 1.8-4.7 4.54-4.7 1.31 0 2.68.24 2.68.24v2.97h-1.51c-1.49 0-1.95.93-1.95 1.88v2.27h3.32l-.53 3.5h-2.79V24C19.61 23.1 24 18.1 24 12.07z" />
              </svg>
              Facebook
            </button>
          </div>

          <p className="register-link">
            Don't have an account?{" "}
            <span onClick={() => navigate("/register")}>Register</span>
          </p>
        </div>
      </div>
    </>
  );
}