import { useState, useEffect } from 'react';
import { sessionsAPI } from '../api';

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

  // On desktop: sidebar pushes content (open/closed via width)
  // On mobile: sidebar is a fixed drawer overlay
  const sidebarClass = [
    'sidebar',
    isMobile ? 'sidebar-mobile' : 'sidebar-desktop',
    open ? 'sidebar-open' : 'sidebar-closed',
  ].join(' ');

  return (
    <aside className={sidebarClass}>
      <div className="sidebar-header">
        <div className="sidebar-logo">
          <div className="sidebar-logo-icon">🧬</div>
          <div>
            <div className="sidebar-logo-text">Curalink</div>
            <div className="sidebar-logo-sub">AI Research</div>
          </div>
        </div>
        <button className="new-chat-btn" onClick={onNewChat} id="btn-new-session">
          <span className="new-chat-btn-icon">+</span>
          New Research Session
        </button>
      </div>

      <div className="sidebar-sessions">
        {sessions.length === 0 ? (
          <div className="sidebar-empty">
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
                <span className="session-icon">🔬</span>
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
