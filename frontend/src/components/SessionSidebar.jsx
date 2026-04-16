import { useState, useEffect } from 'react';
import { sessionsAPI } from '../api';

/* ── SVG Icons ─────────────────────────────────────────────── */
function IconDNA() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" style={{ width: 18, height: 18 }}>
      <path d="M12 2C6.5 5 6 9 6 12C6 15 6.5 19 12 22" />
      <path d="M12 2C17.5 5 18 9 18 12C18 15 17.5 19 12 22" />
      <path d="M6.5 7.5C8.5 7 11 6.8 13.5 7.5" />
      <path d="M6.5 16.5C8.5 16 11 15.8 13.5 16.5" />
    </svg>
  );
}

function IconPlus() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" style={{ width: 14, height: 14 }}>
      <line x1="12" y1="5" x2="12" y2="19" />
      <line x1="5" y1="12" x2="19" y2="12" />
    </svg>
  );
}

function IconFlask() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" style={{ width: 13, height: 13, opacity: 0.5 }}>
      <path d="M9 3h6v8l3 9H6l3-9V3z" />
      <line x1="9" y1="3" x2="15" y2="3" />
      <line x1="6" y1="17" x2="18" y2="17" />
    </svg>
  );
}

export default function SessionSidebar({ currentSessionId, onSelectSession, onNewChat, open, isMobile }) {
  const [sessions, setSessions] = useState([]);

  const loadSessions = async () => {
    try {
      const res = await sessionsAPI.getAll();
      setSessions(res.data);
    } catch (err) {
      console.warn('Failed to load sessions:', err.message);
    }
  };

  useEffect(() => { loadSessions(); }, [currentSessionId]);

  const handleDelete = async (e, sessionId) => {
    e.stopPropagation();
    try {
      await sessionsAPI.delete(sessionId);
      setSessions((prev) => prev.filter((s) => s.sessionId !== sessionId));
      if (sessionId === currentSessionId) onNewChat();
    } catch (err) {
      console.error('Delete failed:', err.message);
    }
  };

  const formatDate = (dateStr) => {
    const d = new Date(dateStr);
    const now = new Date();
    const diffH = (now - d) / (1000 * 60 * 60);
    if (diffH < 1) return 'Just now';
    if (diffH < 24) return `${Math.floor(diffH)}h ago`;
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const sidebarClass = [
    'sidebar',
    isMobile ? 'sidebar-mobile' : 'sidebar-desktop',
    open ? 'sidebar-open' : 'sidebar-closed',
  ].join(' ');

  return (
    <aside className={sidebarClass}>
      <div className="sidebar-header">
        {/* Logo */}
        <div className="sidebar-logo">
          <div className="sidebar-logo-icon">
            <IconDNA />
          </div>
          <div className="sidebar-logo-info">
            <div className="sidebar-logo-text">Curalink</div>
            <div className="sidebar-logo-sub">AI Research</div>
          </div>
        </div>

        {/* New session CTA */}
        <button className="new-chat-btn" onClick={onNewChat} id="btn-new-session">
          <span className="new-chat-icon">
            <IconPlus />
          </span>
          New Research Session
        </button>
      </div>

      <div className="sidebar-sessions">
        {sessions.length === 0 ? (
          <div className="sidebar-empty">
            <div className="sidebar-empty-icon">⬡</div>
            No sessions yet.<br />Start a research query below.
          </div>
        ) : (
          <>
            <div className="sidebar-section-label">Recent Sessions</div>
            {sessions.map((s) => (
              <div
                key={s.sessionId}
                className={`session-item${s.sessionId === currentSessionId ? ' active' : ''}`}
                onClick={() => onSelectSession(s.sessionId)}
              >
                <div className="session-dot" />
                <div className="session-item-content">
                  <div className="session-disease">{s.disease || 'General Query'}</div>
                  {s.patientName && (
                    <div className="session-patient">{s.patientName}</div>
                  )}
                  <div className="session-date">{formatDate(s.updatedAt)}</div>
                </div>
                <button
                  className="session-delete"
                  onClick={(e) => handleDelete(e, s.sessionId)}
                  title="Delete session"
                >
                  ✕
                </button>
              </div>
            ))}
          </>
        )}
      </div>
    </aside>
  );
}
