import { useState } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "../Home/components/Navbar/Navbar";

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
    padding-top: 8rem;
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
    max-width: 460px;
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
    font-family: 'Cormorant Garamond', serif;
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
    margin: 0 0 2rem;
  }

  .login-box input {
    display: block;
    width: 100%;
    margin-bottom: 1rem;
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

  .login-box input::placeholder { color: rgba(197,160,204,0.45); font-weight: 200; letter-spacing: 0.06em; }
  .login-box input:focus {
    border-color: #d4af7a;
    background: rgba(212,175,122,0.05);
    box-shadow: 0 0 0 3px rgba(212,175,122,0.08);
  }

  /* Role section label */
  .role-label {
    font-family: 'Jost', sans-serif;
    font-weight: 200;
    font-size: 0.68rem;
    letter-spacing: 0.2em;
    text-transform: uppercase;
    color: rgba(197,160,204,0.6);
    margin: 0.25rem 0 0.75rem;
    display: block;
  }

  /* Role grid */
  .role-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 0.5rem;
    margin-bottom: 1.75rem;
  }

  .role-chip {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.6rem 0.85rem;
    background: rgba(255,255,255,0.03);
    border: 1px solid rgba(212,175,122,0.15);
    border-radius: 2px;
    color: #c5a0cc;
    font-family: 'Jost', sans-serif;
    font-weight: 300;
    font-size: 0.75rem;
    letter-spacing: 0.05em;
    cursor: pointer;
    transition: all 0.2s;
    user-select: none;
  }

  .role-chip:hover {
    border-color: rgba(212,175,122,0.35);
    background: rgba(212,175,122,0.05);
    color: #f5efe8;
  }

  .role-chip.selected {
    border-color: #d4af7a;
    background: rgba(212,175,122,0.12);
    color: #f5efe8;
    box-shadow: 0 0 0 1px rgba(212,175,122,0.2);
  }

  .role-chip .role-icon {
    font-size: 0.95rem;
    line-height: 1;
    flex-shrink: 0;
  }

  .role-chip .role-check {
    margin-left: auto;
    width: 14px;
    height: 14px;
    border: 1px solid rgba(212,175,122,0.3);
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
    transition: all 0.2s;
  }

  .role-chip.selected .role-check {
    background: #d4af7a;
    border-color: #d4af7a;
  }

  .role-chip.selected .role-check::after {
    content: '';
    width: 5px;
    height: 5px;
    background: #1a0f1e;
    border-radius: 50%;
    display: block;
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
    margin-bottom: 1.75rem;
    box-sizing: border-box;
  }

  .login-btn:hover:not(:disabled) { opacity: 0.92; transform: translateY(-1px); box-shadow: 0 8px 28px rgba(212,175,122,0.35); }
  .login-btn:active:not(:disabled) { transform: translateY(0); opacity: 0.85; }
  .login-btn:disabled { opacity: 0.55; cursor: not-allowed; }

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

const ROLES = [
  { id: "marketing",   label: "Marketing",       icon: "📣" },
  { id: "sales",       label: "Sales",            icon: "💼" },
  { id: "content",     label: "Content Creator",  icon: "✍️" },
  { id: "design",      label: "Design",           icon: "🎨" },
  { id: "engineering", label: "Engineering",      icon: "⚙️" },
  { id: "product",     label: "Product",          icon: "🗂️" },
  { id: "hr",          label: "Human Resources",  icon: "🤝" },
  { id: "finance",     label: "Finance",          icon: "📊" },
  { id: "operations",  label: "Operations",       icon: "🏗️" },
  { id: "other",       label: "Other",            icon: "🌐" },
];

export default function Register() {
  const navigate = useNavigate();

  const [email, setEmail]                   = useState("");
  const [password, setPassword]             = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [selectedRole, setSelectedRole]     = useState("");
  const [isLoading, setIsLoading]           = useState(false);

  const handleRegister = async () => {
    if (!email || !password || !confirmPassword) {
      alert("Please fill in all fields");
      return;
    }
    if (!selectedRole) {
      alert("Please select your role");
      return;
    }
    if (password !== confirmPassword) {
      alert("Passwords do not match");
      return;
    }
    if (password.length < 6) {
      alert("Password must be at least 6 characters long");
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch("http://localhost:5073/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, role: selectedRole }),
      });
      const data = await response.json();
      if (response.ok) {
        alert("Registration successful! Please login.");
        navigate("/login");
      } else {
        alert("Registration failed: " + (data.message || data.title || "Please try again"));
      }
    } catch (error) {
      console.error("Network error:", error);
      alert("Cannot connect to server. Please check if the backend is running.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <style>{styles}</style>
      <Navbar />
      <div className="login-container">
        <div className="login-box">
          <h2>Create Account</h2>
          <p className="login-subtitle">Begin your journey</p>

          <input
            type="email"
            placeholder="Email address"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          <input
            type="password"
            placeholder="Confirm password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
          />

          <span className="role-label">Your role in the company</span>
          <div className="role-grid">
            {ROLES.map((role) => (
              <div
                key={role.id}
                className={`role-chip${selectedRole === role.id ? " selected" : ""}`}
                onClick={() => setSelectedRole(role.id)}
              >
                <span className="role-icon">{role.icon}</span>
                {role.label}
                <span className="role-check" />
              </div>
            ))}
          </div>

          <button className="login-btn" onClick={handleRegister} disabled={isLoading}>
            {isLoading ? "Creating account…" : "Register"}
          </button>

          <p className="register-link">
            Already have an account?{" "}
            <span onClick={() => navigate("/login")}>Sign in</span>
          </p>
        </div>
      </div>
    </>
  );
}