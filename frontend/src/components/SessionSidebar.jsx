import { useState, useEffect } from 'react';
import { sessionsAPI, bookmarksAPI } from '../api';
import { useAuth } from '../contexts/AuthContext';

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

function IconBell() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ width: 14, height: 14 }}>
      <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
      <path d="M13.73 21a2 2 0 0 1-3.46 0" />
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

function IconSearch() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" style={{ width: 13, height: 13 }}>
      <circle cx="11" cy="11" r="8" />
      <line x1="21" y1="21" x2="16.65" y2="16.65" />
    </svg>
  );
}

function IconChart() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ width: 14, height: 14 }}>
      <line x1="18" y1="20" x2="18" y2="10" />
      <line x1="12" y1="20" x2="12" y2="4" />
      <line x1="6" y1="20" x2="6" y2="14" />
    </svg>
  );
}

function IconBookmark() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ width: 14, height: 14 }}>
      <path d="M19 21l-7-5-7 5V5a2 2 0 012-2h10a2 2 0 012 2z" />
    </svg>
  );
}

function IconLogout() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ width: 14, height: 14 }}>
      <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4" />
      <polyline points="16 17 21 12 16 7" />
      <line x1="21" y1="12" x2="9" y2="12" />
    </svg>
  );
}

export default function SessionSidebar({ currentSessionId, onSelectSession, onNewChat, open, isMobile, onShowDashboard, showDashboard, onShowAlerts }) {
  const { user, logout } = useAuth();
  const [sessions, setSessions] = useState([]);
  const [bookmarks, setBookmarks] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('sessions');

  const loadSessions = async () => {
    try {
      const res = await sessionsAPI.getAll();
      setSessions(res.data);
    } catch (err) {
      console.warn('Failed to load sessions:', err.message);
    }
  };

  const loadBookmarks = async () => {
    try {
      const res = await bookmarksAPI.getAll();
      setBookmarks(res.data);
    } catch (err) {
      console.warn('Failed to load bookmarks:', err.message);
    }
  };

  useEffect(() => { loadSessions(); loadBookmarks(); }, [currentSessionId]);

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

  const handleDeleteBookmark = async (e, id) => {
    e.stopPropagation();
    try {
      await bookmarksAPI.delete(id);
      setBookmarks((prev) => prev.filter((b) => b._id !== id));
    } catch (err) {
      console.error('Delete bookmark failed:', err.message);
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

  const filteredSessions = searchQuery.trim()
    ? sessions.filter((s) =>
        (s.disease || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        (s.patientName || '').toLowerCase().includes(searchQuery.toLowerCase())
      )
    : sessions;

  const sidebarClass = [
    'sidebar',
    isMobile ? 'sidebar-mobile' : 'sidebar-desktop',
    open ? 'sidebar-open' : 'sidebar-closed',
  ].join(' ');

  const userInitial = user?.name ? user.name.charAt(0).toUpperCase() : '?';

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

        {/* Search */}
        <div className="sidebar-search">
          <IconSearch />
          <input
            className="sidebar-search-input"
            placeholder="Search sessions..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      {/* Tabs */}
      <div className="sidebar-tabs">
        <button
          className={`sidebar-tab ${activeTab === 'sessions' ? 'active' : ''}`}
          onClick={() => setActiveTab('sessions')}
        >
          Sessions
        </button>
        <button
          className={`sidebar-tab ${activeTab === 'bookmarks' ? 'active' : ''}`}
          onClick={() => setActiveTab('bookmarks')}
        >
          <IconBookmark /> Saved
        </button>
      </div>

      <div className="sidebar-sessions">
        {activeTab === 'sessions' ? (
          filteredSessions.length === 0 ? (
            <div className="sidebar-empty">
              <div className="sidebar-empty-icon">⬡</div>
              {searchQuery ? 'No matching sessions.' : 'No sessions yet.\nStart a research query below.'}
            </div>
          ) : (
            <>
              <div className="sidebar-section-label">Recent Sessions</div>
              {filteredSessions.map((s) => (
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
          )
        ) : (
          bookmarks.length === 0 ? (
            <div className="sidebar-empty">
              <div className="sidebar-empty-icon">🔖</div>
              No bookmarks yet. Save research responses for quick access.
            </div>
          ) : (
            <>
              <div className="sidebar-section-label">Saved Research</div>
              {bookmarks.map((b) => (
                <div
                  key={b._id}
                  className="session-item"
                  onClick={() => onSelectSession(b.sessionId)}
                >
                  <div className="session-dot" style={{ background: 'var(--amber)' }} />
                  <div className="session-item-content">
                    <div className="session-disease">{b.disease || b.title || 'Saved'}</div>
                    {b.preview && <div className="session-patient">{b.preview}</div>}
                    <div className="session-date">{formatDate(b.createdAt)}</div>
                  </div>
                  <button
                    className="session-delete"
                    onClick={(e) => handleDeleteBookmark(e, b._id)}
                    title="Remove bookmark"
                  >
                    ✕
                  </button>
                </div>
              ))}
            </>
          )
        )}
      </div>

      {/* Bottom bar */}
      <div className="sidebar-footer">
        <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
          <button className="sidebar-nav-btn" onClick={onShowDashboard} title="Analytics Dashboard" style={{ flex: 1 }}>
            <IconChart />
            <span>Dashboard</span>
          </button>
          <button className="sidebar-nav-btn" onClick={onShowAlerts} title="Research Alerts" style={{ flex: 1 }}>
            <IconBell />
            <span>Alerts</span>
          </button>
        </div>

        <div className="sidebar-user">
          <div className="sidebar-user-avatar">{userInitial}</div>
          <div className="sidebar-user-info">
            <div className="sidebar-user-name">{user?.name || 'User'}</div>
            <div className="sidebar-user-email">{user?.email || ''}</div>
          </div>
          <button className="sidebar-logout-btn" onClick={logout} title="Sign out">
            <IconLogout />
          </button>
        </div>
      </div>
    </aside>
  );
}
