import { useState } from "react";
import Navbar from "./components/Navbar/Navbar";

const DAYS = ["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"];
const MONTH_NAMES = ["Janvier","Février","Mars","Avril","Mai","Juin","Juillet","Août","Septembre","Octobre","Novembre","Décembre"];
const COLORS = ["#e53935","#1976d2","#43a047","#f57c00","#8e24aa","#00897b","#d81b60","#6d4c41"];

function getDaysInMonth(year, month) { return new Date(year, month + 1, 0).getDate(); }
function getFirstDayOfMonth(year, month) { return (new Date(year, month, 1).getDay() + 6) % 7; }
function dateKey(y, m, d) { return `${y}-${String(m+1).padStart(2,'0')}-${String(d).padStart(2,'0')}`; }
function formatTime(t) {
  if (!t) return '';
  const [h, m] = t.split(':'); const hour = parseInt(h);
  return `${hour > 12 ? hour - 12 : hour || 12}:${m} ${hour >= 12 ? 'PM' : 'AM'}`;
}

const STATUS_LABELS = { pending: '⏳ En attente', progress: '🔄 En cours', done: '✅ Fait' };
const STATUS_STYLES = {
  pending: { background: '#f5f5f5', color: '#757575' },
  progress: { background: '#e3f2fd', color: '#1565c0' },
  done: { background: '#e8f5e9', color: '#2e7d32' },
};

export default function Scheduler() {
  const today = new Date();
  const [viewYear, setViewYear] = useState(today.getFullYear());
  const [viewMonth, setViewMonth] = useState(today.getMonth());
  const [events, setEvents] = useState({});
  const [selectedDate, setSelectedDate] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState({ title: '', time: '09:00', status: 'pending', notes: '', color: COLORS[0] });

  const daysInMonth = getDaysInMonth(viewYear, viewMonth);
  const firstDay = getFirstDayOfMonth(viewYear, viewMonth);

  const cells = [];
  for (let i = 0; i < firstDay; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);
  while (cells.length % 7 !== 0) cells.push(null);
  const weeks = [];
  for (let i = 0; i < cells.length; i += 7) weeks.push(cells.slice(i, i + 7));

  const selectedEvents = selectedDate ? (events[selectedDate] || []) : [];

  function openModal(day) {
    setSelectedDate(dateKey(viewYear, viewMonth, day));
    setForm({ title: '', time: '09:00', status: 'pending', notes: '', color: COLORS[0] });
    setModalOpen(true);
  }

  function addEvent() {
    if (!form.title.trim()) return;
    setEvents(prev => ({ ...prev, [selectedDate]: [...(prev[selectedDate] || []), { ...form }] }));
    setForm(f => ({ ...f, title: '', notes: '' }));
  }

  function deleteEvent(i) {
    setEvents(prev => {
      const updated = [...(prev[selectedDate] || [])];
      updated.splice(i, 1);
      return { ...prev, [selectedDate]: updated };
    });
  }

  function prevMonth() { if (viewMonth === 0) { setViewMonth(11); setViewYear(y => y - 1); } else setViewMonth(m => m - 1); }
  function nextMonth() { if (viewMonth === 11) { setViewMonth(0); setViewYear(y => y + 1); } else setViewMonth(m => m + 1); }
  function isToday(day) { return day === today.getDate() && viewMonth === today.getMonth() && viewYear === today.getFullYear(); }

  return (
    <>
      <Navbar />
      <div style={{ background: "#4A2C4F", minHeight: "100vh", padding: "70px 20px", fontFamily: "'DM Sans', Arial, sans-serif" }}>
        <div style={{ maxWidth: "1100px", margin: "auto", background: "#fff", borderRadius: "20px", padding: "32px", boxShadow: "0 20px 60px rgba(0,0,0,0.3)" }}>
          <h1 style={{ fontFamily: "serif", marginBottom: "4px", color: "#4A2C4F" }}>Content Calendar</h1>
          <p style={{ color: "#aaa", marginBottom: "24px", fontSize: "0.9rem" }}>Cliquez sur n'importe quel jour pour gérer vos contenus</p>

          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
            <button onClick={prevMonth} style={btnStyle}>‹</button>
            <h2 style={{ margin: 0, fontFamily: "serif", color: "#4A2C4F" }}>{MONTH_NAMES[viewMonth]} {viewYear}</h2>
            <button onClick={nextMonth} style={btnStyle}>›</button>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: "6px" }}>
            {DAYS.map(d => (
              <div key={d} style={{ textAlign: "center", fontWeight: 600, color: "#aaa", fontSize: "0.75rem", textTransform: "uppercase", letterSpacing: "0.05em", padding: "6px 0" }}>{d}</div>
            ))}
            {weeks.map((week, wi) => week.map((day, di) => {
              const key = day ? dateKey(viewYear, viewMonth, day) : null;
              const dayEvs = key ? (events[key] || []) : [];
              const tod = isToday(day);
              return (
                <div key={`${wi}-${di}`}
                  onClick={() => day && openModal(day)}
                  style={{
                    background: tod ? "#f0e6f2" : "#fafafa",
                    borderRadius: "12px", padding: "8px",
                    minHeight: "100px",
                    border: tod ? "2px solid #4A2C4F" : "1.5px solid #f0f0f0",
                    cursor: day ? "pointer" : "default",
                    transition: "all 0.15s",
                  }}
                  onMouseEnter={e => day && Object.assign(e.currentTarget.style, { borderColor: "#6b3f72", background: "#f7f0f8", transform: "translateY(-1px)", boxShadow: "0 4px 12px rgba(74,44,79,0.12)" })}
                  onMouseLeave={e => day && Object.assign(e.currentTarget.style, { borderColor: tod ? "#4A2C4F" : "#f0f0f0", background: tod ? "#f0e6f2" : "#fafafa", transform: "none", boxShadow: "none" })}
                >
                  {day && <>
                    <div style={{ fontWeight: 600, fontSize: "0.85rem", marginBottom: 5, color: tod ? "#4A2C4F" : "#333" }}>{day}</div>
                    {dayEvs.map((ev, i) => (
                      <div key={i} style={{ background: ev.color, color: "#fff", padding: "3px 6px", borderRadius: 6, fontSize: 10, marginBottom: 3, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                        {formatTime(ev.time)} {ev.title}
                      </div>
                    ))}
                    {dayEvs.length === 0 && <div style={{ color: "#ddd", fontSize: 10, textAlign: "center", marginTop: 6 }}>+</div>}
                  </>}
                </div>
              );
            }))}
          </div>
        </div>
      </div>

      {/* MODAL OVERLAY */}
      {modalOpen && (
        <div onClick={e => e.target === e.currentTarget && setModalOpen(false)}
          style={{ position: "fixed", inset: 0, background: "rgba(30,10,35,0.55)", backdropFilter: "blur(4px)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 100 }}>
          <div style={{ background: "#fff", borderRadius: 20, padding: 28, width: 440, maxWidth: "95vw", boxShadow: "0 30px 80px rgba(0,0,0,0.25)", maxHeight: "90vh", overflowY: "auto" }}>
            
            {/* Header */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
              <div style={{ fontFamily: "serif", fontSize: "1.3rem", color: "#4A2C4F" }}>
                {selectedDate && (() => { const [y,m,d] = selectedDate.split('-'); return `${MONTH_NAMES[parseInt(m)-1]} ${parseInt(d)}, ${y}`; })()}
              </div>
              <button onClick={() => setModalOpen(false)} style={{ background: "none", border: "none", fontSize: 22, cursor: "pointer", color: "#aaa" }}>×</button>
            </div>

            {/* Events list */}
            {selectedEvents.length === 0
              ? <div style={{ textAlign: "center", color: "#ccc", fontSize: "0.85rem", padding: "10px 0" }}>Aucun événement pour ce jour</div>
              : selectedEvents.map((ev, i) => (
                <div key={i} style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 12px", borderRadius: 10, border: "1.5px solid #f0f0f0", background: "#fafafa", marginBottom: 8 }}>
                  <div style={{ width: 4, height: 36, borderRadius: 4, background: ev.color, flexShrink: 0 }} />
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 600, fontSize: "0.88rem" }}>{ev.title}</div>
                    <div style={{ fontSize: "0.75rem", color: "#999" }}>{formatTime(ev.time)}{ev.notes && ` · ${ev.notes.substring(0,40)}${ev.notes.length > 40 ? '…' : ''}`}</div>
                  </div>
                  <span style={{ ...STATUS_STYLES[ev.status], fontSize: 10, fontWeight: 600, padding: "2px 8px", borderRadius: 20 }}>{STATUS_LABELS[ev.status]}</span>
                  <button onClick={() => deleteEvent(i)} style={{ background: "none", border: "none", cursor: "pointer", color: "#ddd", fontSize: 16 }}
                    onMouseEnter={e => e.currentTarget.style.color = '#e53935'}
                    onMouseLeave={e => e.currentTarget.style.color = '#ddd'}>✕</button>
                </div>
              ))
            }

            <hr style={{ border: "none", borderTop: "1.5px solid #f0f0f0", margin: "16px 0" }} />
            <div style={{ fontWeight: 600, fontSize: "0.9rem", color: "#4A2C4F", marginBottom: 12 }}>+ Ajouter un événement</div>

            {/* Form */}
            <div style={{ marginBottom: 12 }}>
              <label style={labelStyle}>Titre</label>
              <input type="text" value={form.title} onChange={e => setForm(f => ({...f, title: e.target.value}))} placeholder="Ex: Webinar SEO, Post LinkedIn..." style={inputStyle} />
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 12 }}>
              <div>
                <label style={labelStyle}>Heure</label>
                <input type="time" value={form.time} onChange={e => setForm(f => ({...f, time: e.target.value}))} style={inputStyle} />
              </div>
              <div>
                <label style={labelStyle}>Statut</label>
                <select value={form.status} onChange={e => setForm(f => ({...f, status: e.target.value}))} style={inputStyle}>
                  <option value="pending">⏳ En attente</option>
                  <option value="progress">🔄 En cours</option>
                  <option value="done">✅ Fait</option>
                </select>
              </div>
            </div>
            <div style={{ marginBottom: 12 }}>
              <label style={labelStyle}>Notes</label>
              <textarea value={form.notes} onChange={e => setForm(f => ({...f, notes: e.target.value}))} placeholder="Détails, liens, instructions..." style={{ ...inputStyle, resize: "vertical", minHeight: 70 }} />
            </div>
            <div style={{ marginBottom: 16 }}>
              <label style={labelStyle}>Couleur</label>
              <div style={{ display: "flex", gap: 8 }}>
                {COLORS.map(c => (
                  <div key={c} onClick={() => setForm(f => ({...f, color: c}))}
                    style={{ width: 26, height: 26, borderRadius: "50%", background: c, cursor: "pointer", border: form.color === c ? "3px solid #333" : "3px solid transparent", transform: form.color === c ? "scale(1.15)" : "scale(1)", transition: "all 0.15s" }} />
                ))}
              </div>
            </div>

            <button onClick={addEvent} style={{ width: "100%", padding: 11, background: "#4A2C4F", color: "#fff", border: "none", borderRadius: 12, fontWeight: 600, fontSize: "0.9rem", cursor: "pointer" }}>
              Ajouter l'événement
            </button>
          </div>
        </div>
      )}
    </>
  );
}

const btnStyle = { background: "#4A2C4F", color: "#fff", border: "none", padding: "8px 12px", borderRadius: 8, cursor: "pointer", fontSize: 16 };
const labelStyle = { display: "block", fontSize: "0.78rem", fontWeight: 600, color: "#888", marginBottom: 4, textTransform: "uppercase", letterSpacing: "0.04em" };
const inputStyle = { width: "100%", padding: "9px 12px", border: "1.5px solid #e8e8e8", borderRadius: 10, fontFamily: "inherit", fontSize: "0.88rem", color: "#333", background: "#fafafa", outline: "none" };