import { useState } from "react";
import { useNavigate } from "react-router-dom";

const styles = `
@import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@300;400;600&family=Jost:wght@200;300;400&display=swap');

.register-container {
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
}

.register-box {
  background: rgba(255,255,255,0.04);
  border: 1px solid rgba(212,175,122,0.18);
  border-radius: 10px;
  padding: 3rem;
  width: 100%;
  max-width: 440px;
  backdrop-filter: blur(24px);
  box-shadow: 0 32px 64px rgba(0,0,0,0.5);
}

h2 {
  text-align: center;
  color: #f5efe8;
}

.register-subtitle {
  text-align: center;
  color: #c5a0cc;
  font-size: 0.75rem;
  margin-bottom: 1rem;
}

.row2 {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 0.75rem;
}

input {
  width: 100%;
  padding: 0.9rem;
  margin-bottom: 0.4rem;
  border-radius: 6px;
  border: 1px solid rgba(212,175,122,0.18);
  background: rgba(255,255,255,0.03);
  color: white;
}

input:focus {
  outline: none;
  border-color: #d4af7a;
}

.field-error {
  font-size: 0.7rem;
  color: red;
  margin-bottom: 0.3rem;
}

.register-btn {
  width: 100%;
  padding: 0.9rem;
  border: none;
  border-radius: 6px;
  background: linear-gradient(135deg, #d4af7a, #c4974a);
  cursor: pointer;
  margin-top: 0.5rem;
}

.register-btn:disabled {
  opacity: 0.6;
}

.error-banner {
  background: rgba(255,0,0,0.1);
  color: red;
  padding: 0.7rem;
  text-align: center;
  margin-bottom: 1rem;
  border-radius: 6px;
}

.success-banner {
  background: rgba(0,255,0,0.1);
  color: lightgreen;
  padding: 0.7rem;
  text-align: center;
  margin-bottom: 1rem;
  border-radius: 6px;
}

.login-link {
  text-align: center;
  font-size: 0.8rem;
  color: #c5a0cc;
}
`;

export default function Register() {
  const navigate = useNavigate();

  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    confirm: ""
  });

  const [errors, setErrors] = useState({});
  const [apiError, setApiError] = useState("");
  const [success, setSuccess] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const set = (field) => (e) => {
    setForm((p) => ({ ...p, [field]: e.target.value }));
    setErrors((p) => ({ ...p, [field]: "" }));
  };

  const validate = () => {
    const e = {};
    if (!form.firstName.trim()) e.firstName = "Required";
    if (!form.lastName.trim()) e.lastName = "Required";
    if (!form.email.trim()) e.email = "Required";
    if (!form.password) e.password = "Required";
    if (form.password !== form.confirm) e.confirm = "Passwords do not match";
    return e;
  };

  const handleRegister = async () => {
    setApiError("");
    setSuccess("");

    const e = validate();
    setErrors(e);
    if (Object.keys(e).length > 0) return;

    setIsLoading(true);

    try {
      const response = await fetch("http://localhost:5073/api/Auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          Username: form.firstName.trim(),
          Email: form.email.trim(),
          Password: form.password
        }),
      });

      let data;
      try {
        data = await response.json();
      } catch {
        data = {};
      }

      console.log("Register response:", response.status, data);

      if (response.ok) {
        localStorage.setItem("accessToken", data.AccessToken);
        localStorage.setItem("refreshToken", data.RefreshToken);
        localStorage.setItem("userId", data.UserId);
        localStorage.setItem("username", data.Username);
        setSuccess("Account created!");
        setTimeout(() => navigate("/home"), 1200);
      } else {
        const errorMsg = data?.message || data?.error || data?.errors?.[0] || `Error ${response.status}`;
        setApiError(errorMsg);
      }
    } catch (err) {
      console.error("Register error:", err);
      setApiError("Server not reachable");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <style>{styles}</style>
      <div className="register-container">
        <div className="register-box">
          <h2>Ai_content-flow</h2>
          <p className="register-subtitle">Create your account</p>

          {apiError && <div className="error-banner">{apiError}</div>}
          {success && <div className="success-banner">{success}</div>}

          {/* ✅ First & last name inputs — were missing entirely */}
          <div className="row2">
            <div>
              <input placeholder="First name" value={form.firstName} onChange={set("firstName")} />
              {errors.firstName && <p className="field-error">{errors.firstName}</p>}
            </div>
            <div>
              <input placeholder="Last name" value={form.lastName} onChange={set("lastName")} />
              {errors.lastName && <p className="field-error">{errors.lastName}</p>}
            </div>
          </div>

          {/* ✅ Field errors now displayed under each input */}
          <input placeholder="Email" value={form.email} onChange={set("email")} />
          {errors.email && <p className="field-error">{errors.email}</p>}

          <input type="password" placeholder="Password" value={form.password} onChange={set("password")} />
          {errors.password && <p className="field-error">{errors.password}</p>}

          <input type="password" placeholder="Confirm password" value={form.confirm} onChange={set("confirm")} />
          {errors.confirm && <p className="field-error">{errors.confirm}</p>}

          <button className="register-btn" onClick={handleRegister} disabled={isLoading}>
            {isLoading ? "Creating..." : "Create account"}
          </button>

          <p className="login-link">
            Already have an account?{" "}
            <span onClick={() => navigate("/login")}>Sign in</span>
          </p>
        </div>
      </div>
    </>
  );
}