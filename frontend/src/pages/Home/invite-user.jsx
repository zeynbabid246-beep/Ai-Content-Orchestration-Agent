import { useState } from "react";
import Navbar from "./components/Navbar/Navbar";

const AVATAR_COLORS = [
  { bg: "rgba(212,175,122,.2)",  color: "#d4af7a" },
  { bg: "rgba(197,160,204,.18)", color: "#c5a0cc" },
  { bg: "rgba(245,239,232,.12)", color: "#f5efe8" },
  { bg: "rgba(180,140,100,.2)",  color: "#e8cfa0" },
];

const INITIAL_MEMBERS = [
  { id: 1, name: "siwar attia", email: "siwar@acme.io", role: "Editor", status: "Accepted", initials: "SA", avatarClass: "sa" },
  { id: 2, name: "nawal",   email: "nawal@acme.io",  role: "Viewer", status: "Pending",  initials: "LB", avatarClass: "lb" },
];

function getInitials(email) {
  const name = email.split("@")[0].replace(/[._]/g, " ").trim();
  return name.split(" ").map((w) => w[0] || "").join("").toUpperCase().slice(0, 2) || "??";
}
function getDisplayName(email) {
  return email.split("@")[0].replace(/[._]/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

const ROLE_BADGES = {
  Editor:    { bg: "rgba(212,175,122,.15)", color: "#d4af7a",  border: "rgba(212,175,122,.3)" },
  Viewer:    { bg: "rgba(197,160,204,.15)", color: "#c5a0cc",  border: "rgba(197,160,204,.3)" },
  Admin:     { bg: "rgba(245,239,232,.1)",  color: "#f5efe8",  border: "rgba(245,239,232,.2)" },
  Commenter: { bg: "rgba(180,140,100,.15)", color: "#e8cfa0",  border: "rgba(180,140,100,.3)" },
};

let colorIdx = 0;
let memberId = 10;

export default function MembersTable() {
  const [members, setMembers] = useState(INITIAL_MEMBERS);
  const [email, setEmail]     = useState("");
  const [role, setRole]       = useState("Editor");
  const [focused, setFocused] = useState(false);
  const [shake, setShake]     = useState(false);

  const handleInvite = () => {
    if (!email.trim() || !email.includes("@")) {
      setShake(true); setTimeout(() => setShake(false), 600); return;
    }
    const c = AVATAR_COLORS[colorIdx++ % AVATAR_COLORS.length];
    setMembers(prev => [...prev, {
      id: memberId++, name: getDisplayName(email), email: email.trim(),
      role, status: "Pending", initials: getInitials(email), customColor: c,
    }]);
    setEmail("");
  };

  const handleRemove = (id) => setMembers(prev => prev.filter(m => m.id !== id));

  return (
    <>
    <Navbar />
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,600;1,400&family=Jost:wght@200;300;400;500&display=swap');
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

        .mt-wrap {
          background: #4A2C4F;
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 40px 24px;
          font-family: 'Jost', sans-serif;
        }

        .mt-panel {
          width: 100%;
          max-width: 720px;
          background: rgba(30,14,35,.55);
          border: 1px solid rgba(212,175,122,.18);
          border-radius: 3px;
          overflow: hidden;
          backdrop-filter: blur(20px);
          box-shadow: 0 1px 0 rgba(212,175,122,.12) inset, 0 32px 64px rgba(0,0,0,.4);
          position: relative;
          animation: rise .6s cubic-bezier(.22,1,.36,1) both;
        }

        @keyframes rise {
          from { opacity: 0; transform: translateY(18px); }
          to   { opacity: 1; transform: translateY(0); }
        }

        /* gold top rule */
        .mt-panel::before {
          content: '';
          position: absolute; top: 0; left: 8%; right: 8%; height: 1px;
          background: linear-gradient(90deg, transparent, #d4af7a, transparent);
        }

        
        .mt-invite { padding: 24px 24px 20px; }

        .mt-invite-label {
          font-size: 9px; font-weight: 400; letter-spacing: 3px;
          text-transform: uppercase; color: rgba(245,239,232,.4);
          margin-bottom: 12px;
        }

        .mt-invite-row {
          display: flex; gap: 8px;
        }
        .mt-invite-row.shaking { animation: shake .5s ease; }

        @keyframes shake {
          0%,100% { transform: translateX(0); }
          20%,60%  { transform: translateX(-5px); }
          40%,80%  { transform: translateX(5px); }
        }

        .mt-field {
          flex: 1; display: flex; align-items: center; gap: 9px;
          background: rgba(255,255,255,.04);
          border: 1px solid rgba(212,175,122,.18);
          border-radius: 2px; padding: 0 13px;
          transition: border-color .2s, box-shadow .2s;
        }
        .mt-field.focused {
          border-color: #d4af7a;
          box-shadow: 0 0 0 3px rgba(212,175,122,.08);
        }

        .mt-input {
          flex: 1; background: transparent; border: none; outline: none;
          color: #f5efe8; font-family: 'Jost', sans-serif;
          font-size: 13px; font-weight: 300; padding: 12px 0;
          letter-spacing: .04em;
        }
        .mt-input::placeholder { color: rgba(245,239,232,.28); letter-spacing: .06em; }

        .mt-select {
          background: rgba(255,255,255,.04);
          border: 1px solid rgba(212,175,122,.18);
          border-radius: 2px; color: #f5efe8;
          font-family: 'Jost', sans-serif;
          font-size: 12px; font-weight: 300;
          padding: 0 30px 0 11px;
          cursor: pointer; outline: none;
          height: 44px; appearance: none;
          background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='9' height='5'%3E%3Cpath d='M0 0l4.5 5 4.5-5' stroke='%23d4af7a' stroke-width='1.3' fill='none' stroke-linecap='round'/%3E%3C/svg%3E");
          background-repeat: no-repeat;
          background-position: right 9px center;
          letter-spacing: .04em;
          transition: border-color .2s;
        }
        .mt-select:focus { border-color: #d4af7a; }
        .mt-select option { background: #2e1a32; }

        .mt-btn-invite {
          padding: 0 18px; height: 44px;
          background: linear-gradient(135deg, #d4af7a 0%, #b8893e 100%);
          color: #1a0f1e;
          border: none; border-radius: 2px;
          font-family: 'Jost', sans-serif;
          font-size: 10px; font-weight: 500; letter-spacing: .2em;
          text-transform: uppercase;
          cursor: pointer; white-space: nowrap;
          box-shadow: 0 4px 14px rgba(212,175,122,.2);
          transition: opacity .18s, transform .15s;
        }
        .mt-btn-invite:hover { opacity: .88; transform: translateY(-1px); }

        
        .mt-table-wrap { border-top: 1px solid rgba(212,175,122,.1); }

        .mt-table-head {
          display: grid;
          grid-template-columns: 2.4fr 1.4fr 1fr 1fr 36px;
          align-items: center;
          padding: 10px 24px;
          background: rgba(18,8,22,.45);
          font-size: 9px; font-weight: 400;
          letter-spacing: 2.5px; text-transform: uppercase;
          color: rgba(245,239,232,.35);
          border-bottom: 1px solid rgba(212,175,122,.08);
        }

        .mt-table-body {
          max-height: 320px;
          overflow-y: auto;
        }
        .mt-table-body::-webkit-scrollbar { width: 3px; }
        .mt-table-body::-webkit-scrollbar-track { background: transparent; }
        .mt-table-body::-webkit-scrollbar-thumb { background: rgba(212,175,122,.2); border-radius: 99px; }

        .mt-row {
          display: grid;
          grid-template-columns: 2.4fr 1.4fr 1fr 1fr 36px;
          align-items: center;
          padding: 12px 24px;
          border-bottom: 1px solid rgba(212,175,122,.06);
          transition: background .18s;
          animation: slideIn .3s ease both;
        }
        .mt-row:last-child { border-bottom: none; }
        .mt-row:hover { background: rgba(212,175,122,.04); }

        @keyframes slideIn {
          from { opacity: 0; transform: translateX(-8px); }
          to   { opacity: 1; transform: translateX(0); }
        }

        .mt-user { display: flex; align-items: center; gap: 11px; }

        .mt-avatar {
          width: 34px; height: 34px; border-radius: 50%;
          display: flex; align-items: center; justify-content: center;
          font-family: 'Cormorant Garamond', serif;
          font-size: 11px; font-weight: 600; flex-shrink: 0;
        }

        .mt-name  { font-size: 13px; font-weight: 400; color: #f5efe8; }
        .mt-email { font-size: 11px; color: rgba(245,239,232,.4); margin-top: 1px; font-weight: 200; letter-spacing: .02em; }

        .mt-badge {
          font-size: 9px; font-weight: 500; letter-spacing: 1px;
          text-transform: uppercase; padding: 3px 9px; border-radius: 99px;
          display: inline-block;
        }

        .mt-remove {
          background: transparent; border: none; cursor: pointer;
          color: rgba(245,239,232,.2); font-size: 14px; line-height: 1;
          padding: 4px; border-radius: 2px;
          transition: color .18s, background .18s;
          display: flex; align-items: center; justify-content: center;
        }
        .mt-remove:hover { color: #f07a7a; background: rgba(240,122,122,.08); }

        /* footer count bar */
        .mt-footer {
          display: flex; justify-content: space-between; align-items: center;
          padding: 12px 24px;
          border-top: 1px solid rgba(212,175,122,.1);
          background: rgba(18,8,22,.3);
        }
        .mt-count {
          font-size: 10px; font-weight: 300; letter-spacing: .06em;
          color: rgba(245,239,232,.4);
        }
        .mt-count strong { color: #d4af7a; font-weight: 500; }

        .mt-legend { display: flex; gap: 12px; }
        .mt-legend-item {
          display: flex; align-items: center; gap: 5px;
          font-size: 9px; font-weight: 300; letter-spacing: .5px;
          color: rgba(245,239,232,.35);
        }
        .mt-legend-dot {
          width: 6px; height: 6px; border-radius: 50%;
        }
      `}</style>

      <div className="mt-wrap">
        <div className="mt-panel">

    
          <div className="mt-invite">
            <div className="mt-invite-label">Invite member</div>
            <div className={`mt-invite-row${shake ? " shaking" : ""}`}>
              <div className={`mt-field${focused ? " focused" : ""}`}>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="rgba(245,239,232,.3)" strokeWidth="1.6">
                  <rect x="2" y="4" width="20" height="16" rx="2"/>
                  <path d="M2 7l10 7 10-7"/>
                </svg>
                <input
                  className="mt-input"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  onFocus={() => setFocused(true)}
                  onBlur={() => setFocused(false)}
                  onKeyDown={(e) => e.key === "Enter" && handleInvite()}
                  placeholder="colleague@company.com"
                />
              </div>
              <select className="mt-select" value={role} onChange={(e) => setRole(e.target.value)}>
                <option>Editor</option>
                <option>Viewer</option>
                <option>Admin</option>
                <option>Commenter</option>
              </select>
              <button className="mt-btn-invite" onClick={handleInvite}>Invite</button>
            </div>
          </div>

        
          <div className="mt-table-wrap">
            <div className="mt-table-head">
              <span>Member</span>
              <span>Email</span>
              <span>Role</span>
              <span>Status</span>
              <span></span>
            </div>
            <div className="mt-table-body">
              {members.map((m, idx) => {
                const av =
                  m.avatarClass === "km" ? { background: "rgba(212,175,122,.2)",  color: "#d4af7a" }
                : m.avatarClass === "lb" ? { background: "rgba(197,160,204,.18)", color: "#c5a0cc" }
                : m.customColor          ? { background: m.customColor.bg, color: m.customColor.color }
                :                          { background: "rgba(255,255,255,.08)", color: "#f5efe8" };

                const rb = ROLE_BADGES[m.role] || ROLE_BADGES.Viewer;
                const sb = m.status === "Accepted"
                  ? { bg: "rgba(212,175,122,.12)", color: "#d4af7a", border: "rgba(212,175,122,.25)" }
                  : { bg: "rgba(197,160,204,.12)", color: "#c5a0cc", border: "rgba(197,160,204,.25)" };

                return (
                  <div key={m.id} className="mt-row" style={{ animationDelay: `${idx * 0.05}s` }}>
                    {/* Member */}
                    <div className="mt-user">
                      <div className="mt-avatar" style={av}>{m.initials}</div>
                      <div>
                        <div className="mt-name">{m.name}</div>
                      </div>
                    </div>
                    {/* Email */}
                    <div className="mt-email" style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {m.email}
                    </div>
                    {/* Role badge */}
                    <div>
                      <span className="mt-badge" style={{ background: rb.bg, color: rb.color, border: `1px solid ${rb.border}` }}>
                        {m.role}
                      </span>
                    </div>
                    {/* Status badge */}
                    <div>
                      <span className="mt-badge" style={{ background: sb.bg, color: sb.color, border: `1px solid ${sb.border}` }}>
                        {m.status}
                      </span>
                    </div>
                  
                    <button className="mt-remove" onClick={() => handleRemove(m.id)} title="Remove">
                      ×
                    </button>
                  </div>
                );
              })}
            </div>
          </div>

  
          <div className="mt-footer">
            <div className="mt-count">
              <strong>{members.length}</strong> member{members.length !== 1 ? "s" : ""} invited
            </div>
            <div className="mt-legend">
              <div className="mt-legend-item">
                <div className="mt-legend-dot" style={{ background: "#d4af7a" }} />
                Accepted
              </div>
              <div className="mt-legend-item">
                <div className="mt-legend-dot" style={{ background: "#c5a0cc" }} />
                Pending
              </div>
            </div>
          </div>

        </div>
      </div>
    </>
  );
}