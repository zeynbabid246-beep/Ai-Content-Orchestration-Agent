import { useState } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "../Home/components/Navbar/Navbar";

const TABS = ["Overview", "Security", "Preferences", "Danger Zone"];

const STATS = [
  { label: "Content Published", value: "142" },
  { label: "Campaigns Active",  value: "8"   },
  { label: "Team Members",      value: "24"  },
  { label: "AI Tokens Used",    value: "91k" },
];

const ACTIVITY = [
  { action: "Published campaign",  target: "Q2 Product Launch",    time: "2h ago",    dot: "#d4af7a" },
  { action: "Invited member",      target: "nawal@acme.io",        time: "5h ago",    dot: "#c5a0cc" },
  { action: "Updated brand kit",   target: "Color & typography",   time: "Yesterday", dot: "#a0c4cc" },
  { action: "Scheduled post",      target: "LinkedIn · 3 posts",   time: "2d ago",    dot: "#d4af7a" },
  { action: "Generated content",   target: "Blog series · 6 docs", time: "3d ago",    dot: "#c5a0cc" },
];

export default function Profile() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab]         = useState("Overview");
  const [editing, setEditing]             = useState(false);
  const [name, setName]                   = useState("Siwar Attia");
  const [email, setEmail]                 = useState("siwarattia700@gmail.com");
  const [role, setRole]                   = useState("Content Creator");
  const [bio, setBio]                     = useState("Building AI-powered content workflows that scale. Passionate about brand voice and automation.");
  const [saved, setSaved]                 = useState(false);
  const [currentPw, setCurrentPw]         = useState("");
  const [newPw, setNewPw]                 = useState("");
  const [confirmPw, setConfirmPw]         = useState("");
  const [notifications, setNotifications] = useState({ email: true, push: false, weekly: true });

  const initials = name.split(" ").map(w => w[0]).join("").toUpperCase().slice(0, 2);

  const handleSave = () => {
    setEditing(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("refreshToken");
    navigate("/login");
  };

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,600;1,300&family=Jost:wght@200;300;400;500&display=swap');
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: rgba(212,175,122,0.2); border-radius: 99px; }

        .pf-wrap {
          min-height: 100vh;
          background: #4A2C4F;
          background-image:
            radial-gradient(ellipse 70% 55% at 10% 5%,  rgba(122,77,130,0.5)   0%, transparent 55%),
            radial-gradient(ellipse 50% 60% at 90% 95%, rgba(74,44,79,0.9)     0%, transparent 55%),
            radial-gradient(ellipse 35% 35% at 55% 45%, rgba(212,175,122,0.04) 0%, transparent 70%);
          padding: 100px 24px 60px;
          font-family: 'Jost', sans-serif;
        }

        .pf-inner {
          max-width: 900px;
          margin: 0 auto;
        }

        .pf-heading { margin-bottom: 24px; }
        .pf-heading h1 {
          font-family: 'Cormorant Garamond', serif;
          font-size: 32px; font-weight: 300;
          color: #f5efe8; letter-spacing: 0.01em; line-height: 1.1;
        }
        .pf-heading p {
          font-size: 11px; font-weight: 200;
          letter-spacing: 0.22em; text-transform: uppercase;
          color: rgba(197,160,204,0.6); margin-top: 5px;
        }

        /* ── Hero ── */
        .pf-hero {
          border-radius: 6px; overflow: hidden;
          border: 1px solid rgba(212,175,122,0.16);
          box-shadow: 0 24px 56px rgba(0,0,0,0.4);
          margin-bottom: 20px;
          animation: rise 0.55s cubic-bezier(.22,1,.36,1) both;
        }
        @keyframes rise {
          from { opacity: 0; transform: translateY(18px); }
          to   { opacity: 1; transform: translateY(0); }
        }

        .pf-banner {
          position: relative; height: 130px;
          background: linear-gradient(135deg,
            rgba(212,175,122,0.18) 0%,
            rgba(122,77,130,0.28) 50%,
            rgba(74,44,79,0.5) 100%);
          overflow: hidden;
        }
        .pf-banner::before {
          content: ''; position: absolute; inset: 0;
          background-image: repeating-linear-gradient(
            45deg,
            rgba(212,175,122,0.04) 0px, rgba(212,175,122,0.04) 1px,
            transparent 1px, transparent 28px
          );
        }
        .pf-banner-orb {
          position: absolute; top: -50%; left: 25%;
          width: 240px; height: 240px; border-radius: 50%;
          background: radial-gradient(circle, rgba(212,175,122,0.14) 0%, transparent 65%);
          pointer-events: none;
        }

        .pf-identity-bg {
          background: rgba(20, 9, 26, 0.72);
          backdrop-filter: blur(24px);
          position: relative;
        }
        .pf-identity-bg::after {
          content: ''; position: absolute; top: 0; left: 8%; right: 8%; height: 1px;
          background: linear-gradient(90deg, transparent, rgba(212,175,122,0.5), transparent);
        }

        .pf-identity {
          display: flex; align-items: flex-end; gap: 20px;
          padding: 0 28px 20px;
          transform: translateY(-38px);
          margin-bottom: -18px;
        }
        .pf-avatar-wrap { position: relative; flex-shrink: 0; }
        .pf-avatar {
          width: 82px; height: 82px; border-radius: 50%;
          background: linear-gradient(135deg, rgba(212,175,122,0.3), rgba(122,77,130,0.45));
          border: 3px solid #3a1f40;
          box-shadow: 0 0 0 1.5px rgba(212,175,122,0.4), 0 8px 24px rgba(0,0,0,0.4);
          display: flex; align-items: center; justify-content: center;
          font-family: 'Cormorant Garamond', serif;
          font-size: 28px; font-weight: 400; color: #d4af7a; letter-spacing: 0.04em;
        }
        .pf-avatar-dot {
          position: absolute; bottom: 5px; right: 5px;
          width: 13px; height: 13px; border-radius: 50%;
          background: #4ade80; border: 2.5px solid #3a1f40;
          box-shadow: 0 0 8px rgba(74,222,128,0.6);
        }
        .pf-name-block { padding-bottom: 4px; flex: 1; }
        .pf-name {
          font-family: 'Cormorant Garamond', serif;
          font-size: 28px; font-weight: 400; color: #f5efe8;
          letter-spacing: 0.01em; line-height: 1.1;
        }
        .pf-role-tag {
          font-size: 10px; font-weight: 200; letter-spacing: 0.22em;
          text-transform: uppercase; color: rgba(197,160,204,0.65); margin-top: 4px;
        }
        .pf-edit-btn {
          margin-bottom: 4px; flex-shrink: 0;
          padding: 8px 20px; border-radius: 2px;
          background: transparent; border: 1px solid rgba(212,175,122,0.32);
          color: #d4af7a; font-family: 'Jost', sans-serif;
          font-size: 10px; font-weight: 400; letter-spacing: 0.18em;
          text-transform: uppercase; cursor: pointer; transition: all 0.18s;
        }
        .pf-edit-btn:hover { background: rgba(212,175,122,0.08); border-color: #d4af7a; }
        .pf-edit-btn.active {
          background: linear-gradient(135deg, #d4af7a, #b8893e);
          color: #1a0f1e; border-color: transparent;
          box-shadow: 0 4px 14px rgba(212,175,122,0.25);
        }

        .pf-stats {
          display: grid; grid-template-columns: repeat(4, 1fr);
          border-top: 1px solid rgba(212,175,122,0.1);
          background: rgba(14, 6, 18, 0.45);
        }
        .pf-stat {
          padding: 18px 0; text-align: center;
          border-right: 1px solid rgba(212,175,122,0.08);
          transition: background 0.2s;
        }
        .pf-stat:last-child { border-right: none; }
        .pf-stat:hover { background: rgba(212,175,122,0.04); }
        .pf-stat-val {
          font-family: 'Cormorant Garamond', serif;
          font-size: 30px; font-weight: 300; color: #d4af7a;
          letter-spacing: 0.02em; line-height: 1;
        }
        .pf-stat-label {
          font-size: 9px; font-weight: 300; letter-spacing: 0.16em;
          text-transform: uppercase; color: rgba(245,239,232,0.35); margin-top: 5px;
        }

        /* ── Tab card ── */
        .pf-tab-card {
          background: rgba(20, 9, 26, 0.65);
          border: 1px solid rgba(212,175,122,0.14);
          border-radius: 5px; backdrop-filter: blur(22px);
          overflow: hidden; box-shadow: 0 20px 48px rgba(0,0,0,0.35);
          position: relative;
          animation: rise 0.6s 0.08s cubic-bezier(.22,1,.36,1) both;
        }
        .pf-tab-card::before {
          content: ''; position: absolute; top: 0; left: 8%; right: 8%; height: 1px;
          background: linear-gradient(90deg, transparent, rgba(212,175,122,0.4), transparent);
        }

        .pf-tabs {
          display: flex; border-bottom: 1px solid rgba(212,175,122,0.1);
          padding: 0 28px; background: rgba(10,4,14,0.3);
        }
        .pf-tab {
          padding: 16px 18px; font-size: 10px; font-weight: 300;
          letter-spacing: 0.14em; text-transform: uppercase;
          color: rgba(245,239,232,0.35); cursor: pointer;
          background: transparent; border: none; position: relative;
          transition: color 0.2s; font-family: 'Jost', sans-serif;
        }
        .pf-tab:hover { color: rgba(245,239,232,0.6); }
        .pf-tab.active { color: #d4af7a; }
        .pf-tab.active::after {
          content: ''; position: absolute; bottom: -1px; left: 0; right: 0; height: 1px;
          background: linear-gradient(90deg, transparent, #d4af7a, transparent);
        }

        .pf-tab-body { padding: 28px; }

        .pf-section-title {
          font-family: 'Cormorant Garamond', serif;
          font-size: 18px; font-weight: 400; color: #f5efe8;
          letter-spacing: 0.02em; margin-bottom: 20px;
        }

        
        .pf-grid2 { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
        .pf-field { margin-bottom: 18px; }
        .pf-label {
          display: block; font-size: 9px; font-weight: 400;
          letter-spacing: 0.2em; text-transform: uppercase;
          color: rgba(245,239,232,0.35); margin-bottom: 7px;
        }
        .pf-input {
          width: 100%; background: rgba(255,255,255,0.04);
          border: 1px solid rgba(212,175,122,0.18); border-radius: 2px;
          padding: 10px 14px; color: #f5efe8;
          font-family: 'Jost', sans-serif; font-size: 13px; font-weight: 300;
          letter-spacing: 0.04em; outline: none;
          transition: border-color 0.2s, box-shadow 0.2s;
        }
        .pf-input:focus { border-color: #d4af7a; box-shadow: 0 0 0 3px rgba(212,175,122,0.08); }
        textarea.pf-input { resize: vertical; min-height: 85px; line-height: 1.65; }
        .pf-input-static {
          padding: 10px 0; color: rgba(245,239,232,0.7);
          font-family: 'Jost', sans-serif; font-size: 13px; font-weight: 300;
          letter-spacing: 0.03em; border-bottom: 1px solid rgba(212,175,122,0.08);
          line-height: 1.6;
        }

        .pf-overview-grid { display: grid; grid-template-columns: 1.15fr 1fr; gap: 32px; }

        /* Activity */
        .pf-activity { display: flex; flex-direction: column; }
        .pf-activity-item {
          display: flex; align-items: center; gap: 14px;
          padding: 13px 0; border-bottom: 1px solid rgba(212,175,122,0.06);
          animation: rise 0.4s cubic-bezier(.22,1,.36,1) both;
        }
        .pf-activity-item:last-child { border-bottom: none; }
        .pf-activity-dot { width: 7px; height: 7px; border-radius: 50%; flex-shrink: 0; }
        .pf-activity-action { font-size: 11px; color: rgba(245,239,232,0.45); font-weight: 300; }
        .pf-activity-target { font-size: 13px; color: #f5efe8; font-weight: 400; margin-top: 1px; }
        .pf-activity-time {
          margin-left: auto; font-size: 10px;
          color: rgba(245,239,232,0.25); letter-spacing: 0.06em; white-space: nowrap;
        }

        /* Save row */
        .pf-save-row {
          display: flex; justify-content: flex-end; gap: 10px;
          margin-top: 22px; padding-top: 18px;
          border-top: 1px solid rgba(212,175,122,0.1);
        }
        .pf-btn-ghost {
          padding: 8px 20px; border-radius: 2px; cursor: pointer;
          font-family: 'Jost', sans-serif; font-size: 10px;
          letter-spacing: 0.15em; text-transform: uppercase; font-weight: 400;
          border: 1px solid rgba(212,175,122,0.22); color: rgba(245,239,232,0.45);
          background: transparent; transition: all 0.18s;
        }
        .pf-btn-ghost:hover { border-color: rgba(212,175,122,0.5); color: #f5efe8; }
        .pf-btn-gold {
          padding: 8px 24px; border-radius: 2px; cursor: pointer;
          font-family: 'Jost', sans-serif; font-size: 10px;
          letter-spacing: 0.18em; text-transform: uppercase; font-weight: 500;
          border: none; background: linear-gradient(135deg, #d4af7a, #b8893e);
          color: #1a0f1e; box-shadow: 0 4px 14px rgba(212,175,122,0.22);
          transition: all 0.18s;
        }
        .pf-btn-gold:hover { opacity: 0.88; transform: translateY(-1px); }

        /* Toggle */
        .pf-toggle-row {
          display: flex; align-items: center; justify-content: space-between;
          padding: 15px 0; border-bottom: 1px solid rgba(212,175,122,0.06);
        }
        .pf-toggle-row:last-child { border-bottom: none; }
        .pf-toggle-label { font-size: 13px; font-weight: 300; color: #f5efe8; }
        .pf-toggle-desc {
          font-size: 11px; font-weight: 200; color: rgba(245,239,232,0.35);
          margin-top: 3px; letter-spacing: 0.02em;
        }
        .pf-toggle {
          position: relative; width: 42px; height: 23px;
          background: rgba(255,255,255,0.07); border: 1px solid rgba(212,175,122,0.18);
          border-radius: 99px; cursor: pointer; transition: all 0.25s; flex-shrink: 0;
        }
        .pf-toggle.on { background: rgba(212,175,122,0.25); border-color: rgba(212,175,122,0.6); }
        .pf-toggle::after {
          content: ''; position: absolute; top: 2px; left: 2px;
          width: 17px; height: 17px; border-radius: 50%;
          background: rgba(245,239,232,0.35); transition: transform 0.25s, background 0.25s;
        }
        .pf-toggle.on::after { transform: translateX(19px); background: #d4af7a; }

        /* Password strength */
        .pw-strength-bar { display: flex; gap: 4px; margin-bottom: 6px; }
        .pw-strength-seg { flex: 1; height: 3px; border-radius: 99px; transition: background 0.3s; }

        /* Danger */
        .pf-danger-card {
          border: 1px solid rgba(240,100,100,0.18); border-radius: 3px;
          padding: 16px 20px; background: rgba(240,100,100,0.035);
          display: flex; align-items: center; justify-content: space-between;
          gap: 16px; margin-bottom: 12px; transition: border-color 0.2s;
        }
        .pf-danger-card:hover { border-color: rgba(240,100,100,0.3); }
        .pf-danger-card:last-child { margin-bottom: 0; }
        .pf-danger-title { font-size: 13px; color: #f5efe8; font-weight: 400; }
        .pf-danger-desc { font-size: 11px; color: rgba(245,239,232,0.38); margin-top: 2px; font-weight: 200; }
        .pf-danger-btn {
          padding: 7px 16px; border-radius: 2px; cursor: pointer;
          font-family: 'Jost', sans-serif; font-size: 10px;
          letter-spacing: 0.14em; text-transform: uppercase; font-weight: 400;
          transition: all 0.18s; flex-shrink: 0;
          border: 1px solid rgba(240,100,100,0.3); color: #f07a7a; background: transparent;
        }
        .pf-danger-btn:hover { background: rgba(240,100,100,0.1); border-color: #f07a7a; }
        .pf-export-btn { border-color: rgba(197,160,204,0.28); color: #c5a0cc; }
        .pf-export-btn:hover { background: rgba(197,160,204,0.08); border-color: #c5a0cc; }

        /* Toast */
        .pf-toast {
          display: flex; align-items: center; gap: 9px;
          position: fixed; bottom: 28px; right: 28px;
          background: rgba(20,9,26,0.92); border: 1px solid rgba(212,175,122,0.32);
          backdrop-filter: blur(20px); padding: 12px 22px; border-radius: 3px;
          font-size: 12px; color: #d4af7a; letter-spacing: 0.08em;
          box-shadow: 0 8px 32px rgba(0,0,0,0.45);
          animation: toastIn 0.3s cubic-bezier(.22,1,.36,1); z-index: 9999;
        }
        @keyframes toastIn {
          from { opacity: 0; transform: translateY(14px); }
          to   { opacity: 1; transform: translateY(0); }
        }

        @media (max-width: 680px) {
          .pf-overview-grid { grid-template-columns: 1fr; }
          .pf-grid2 { grid-template-columns: 1fr; }
          .pf-stats { grid-template-columns: repeat(2, 1fr); }
          .pf-stat:nth-child(2) { border-right: none; }
          .pf-identity { flex-wrap: wrap; padding: 0 16px 16px; }
          .pf-edit-btn { margin-left: 0; }
          .pf-tab-body { padding: 20px 16px; }
          .pf-tabs { padding: 0 16px; overflow-x: auto; }
        }
      `}</style>

      <Navbar />

      <div className="pf-wrap">
        <div className="pf-inner">
          <div className="pf-heading">
            <h1>My Profile</h1>
            <p>Manage your account and preferences</p>
          </div>
          <div className="pf-hero">
            <div className="pf-banner">
              <div className="pf-banner-orb" />
            </div>
            <div className="pf-identity-bg">
              <div className="pf-identity">
                <div className="pf-avatar-wrap">
                  <div className="pf-avatar">{initials}</div>
                  <div className="pf-avatar-dot" />
                </div>
                <div className="pf-name-block">
                  <div className="pf-name">{name}</div>
                  <div className="pf-role-tag">{role}</div>
                </div>
                <button
                  className={`pf-edit-btn${editing ? " active" : ""}`}
                  onClick={() => editing ? handleSave() : setEditing(true)}
                >
                  {editing ? "Save profile" : "Edit profile"}
                </button>
              </div>
              <div className="pf-stats">
                {STATS.map((s, i) => (
                  <div className="pf-stat" key={i}>
                    <div className="pf-stat-val">{s.value}</div>
                    <div className="pf-stat-label">{s.label}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
          <div className="pf-tab-card">
            <div className="pf-tabs">
              {TABS.map(t => (
                <button
                  key={t}
                  className={`pf-tab${activeTab === t ? " active" : ""}`}
                  onClick={() => setActiveTab(t)}
                >
                  {t}
                </button>
              ))}
            </div>

            <div className="pf-tab-body">

        
              {activeTab === "Overview" && (
                <div className="pf-overview-grid">
                  <div>
                    <div className="pf-section-title">Personal information</div>
                    <div className="pf-grid2">
                      <div className="pf-field">
                        <label className="pf-label">Full name</label>
                        {editing
                          ? <input className="pf-input" value={name} onChange={e => setName(e.target.value)} />
                          : <div className="pf-input-static">{name}</div>}
                      </div>
                      <div className="pf-field">
                        <label className="pf-label">Role</label>
                        {editing
                          ? <input className="pf-input" value={role} onChange={e => setRole(e.target.value)} />
                          : <div className="pf-input-static">{role}</div>}
                      </div>
                    </div>
                    <div className="pf-field">
                      <label className="pf-label">Email address</label>
                      {editing
                        ? <input className="pf-input" type="email" value={email} onChange={e => setEmail(e.target.value)} />
                        : <div className="pf-input-static">{email}</div>}
                    </div>
                    <div className="pf-field">
                      <label className="pf-label">Bio</label>
                      {editing
                        ? <textarea className="pf-input" value={bio} onChange={e => setBio(e.target.value)} />
                        : <div className="pf-input-static">{bio}</div>}
                    </div>
                    {editing && (
                      <div className="pf-save-row">
                        <button className="pf-btn-ghost" onClick={() => setEditing(false)}>Cancel</button>
                        <button className="pf-btn-gold" onClick={handleSave}>Save changes</button>
                      </div>
                    )}
                  </div>
                  <div>
                    <div className="pf-section-title">Recent activity</div>
                    <div className="pf-activity">
                      {ACTIVITY.map((a, i) => (
                        <div className="pf-activity-item" key={i} style={{ animationDelay: `${i * 0.06}s` }}>
                          <div className="pf-activity-dot" style={{ background: a.dot }} />
                          <div>
                            <div className="pf-activity-action">{a.action}</div>
                            <div className="pf-activity-target">{a.target}</div>
                          </div>
                          <div className="pf-activity-time">{a.time}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
              {activeTab === "Security" && (
                <div style={{ maxWidth: 460 }}>
                  <div className="pf-section-title">Change password</div>
                  <div className="pf-field">
                    <label className="pf-label">Current password</label>
                    <input className="pf-input" type="password" placeholder="••••••••"
                      value={currentPw} onChange={e => setCurrentPw(e.target.value)} />
                  </div>
                  <div className="pf-field">
                    <label className="pf-label">New password</label>
                    <input className="pf-input" type="password" placeholder="••••••••"
                      value={newPw} onChange={e => setNewPw(e.target.value)} />
                  </div>
                  {newPw.length > 0 && (
                    <div style={{ marginBottom: 16 }}>
                      <div className="pw-strength-bar">
                        {[1,2,3,4].map(i => {
                          const color = newPw.length >= 12 ? "#d4af7a" : newPw.length >= 8 ? "#c5a0cc" : "#f07a7a";
                          return <div key={i} className="pw-strength-seg"
                            style={{ background: newPw.length >= i * 3 ? color : "rgba(255,255,255,0.08)" }} />;
                        })}
                      </div>
                      <div style={{ fontSize: 10, color: "rgba(245,239,232,0.35)", letterSpacing: "0.08em" }}>
                        {newPw.length < 6 ? "Too short" : newPw.length < 9 ? "Fair" : newPw.length < 12 ? "Good" : "Strong"}
                      </div>
                    </div>
                  )}
                  <div className="pf-field">
                    <label className="pf-label">Confirm new password</label>
                    <input className="pf-input" type="password" placeholder="••••••••"
                      value={confirmPw} onChange={e => setConfirmPw(e.target.value)} />
                  </div>
                  <div className="pf-save-row" style={{ borderTop: "none", marginTop: 8 }}>
                    <button className="pf-btn-gold" onClick={() => {
                      setSaved(true); setTimeout(() => setSaved(false), 2500);
                      setCurrentPw(""); setNewPw(""); setConfirmPw("");
                    }}>Update password</button>
                  </div>
                </div>
              )}
              {activeTab === "Preferences" && (
                <div style={{ maxWidth: 520 }}>
                  <div className="pf-section-title">Notification preferences</div>
                  {[
                    { key: "email",  label: "Email notifications", desc: "Receive campaign updates and alerts via email" },
                    { key: "push",   label: "Push notifications",  desc: "Browser push alerts for real-time activity" },
                    { key: "weekly", label: "Weekly digest",       desc: "Performance summary delivered every Monday" },
                  ].map(({ key, label, desc }) => (
                    <div className="pf-toggle-row" key={key}>
                      <div>
                        <div className="pf-toggle-label">{label}</div>
                        <div className="pf-toggle-desc">{desc}</div>
                      </div>
                      <div
                        className={`pf-toggle${notifications[key] ? " on" : ""}`}
                        onClick={() => setNotifications(prev => ({ ...prev, [key]: !prev[key] }))}
                      />
                    </div>
                  ))}
                </div>
              )}
              {activeTab === "Danger Zone" && (
                <div style={{ maxWidth: 560 }}>
                  <div className="pf-section-title">Account actions</div>
                  <div className="pf-danger-card">
                    <div>
                      <div className="pf-danger-title">Sign out everywhere</div>
                      <div className="pf-danger-desc">Revoke all active sessions across all devices</div>
                    </div>
                    <button className="pf-danger-btn" onClick={handleLogout}>Log out</button>
                  </div>
                  <div className="pf-danger-card">
                    <div>
                      <div className="pf-danger-title">Export my data</div>
                      <div className="pf-danger-desc">Download a complete copy of your content and settings</div>
                    </div>
                    <button className="pf-danger-btn pf-export-btn">Export</button>
                  </div>
                  <div className="pf-danger-card">
                    <div>
                      <div className="pf-danger-title">Delete account</div>
                      <div className="pf-danger-desc">Permanently remove your account and all associated data</div>
                    </div>
                    <button className="pf-danger-btn">Delete</button>
                  </div>
                </div>
              )}

            </div>
          </div>

        </div>
      </div>
      {saved && (
        <div className="pf-toast">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <polyline points="20 6 9 17 4 12"/>
          </svg>
          Changes saved successfully
        </div>
      )}
    </>
  );
}