import { useState, useEffect } from 'react';
import { sessionsAPI } from '../api';
import MessageCard from './MessageCard';

export default function SharedSessionPage({ token }) {
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchSharedSession = async () => {
      try {
        const res = await sessionsAPI.getShared(token);
        setSession(res.data);
      } catch (err) {
        console.error('Failed to load shared session:', err);
        setError('Shared session not found or link has expired.');
      } finally {
        setLoading(false);
      }
    };
    fetchSharedSession();
  }, [token]);

  if (loading) {
    return (
      <div className="shared-page-loading">
        <div className="typing-dots">
          <div className="typing-dot" />
          <div className="typing-dot" />
          <div className="typing-dot" />
        </div>
        <p>Loading shared research...</p>
      </div>
    );
  }

  if (error || !session) {
    return (
      <div className="shared-page-error">
        <div className="shared-error-icon">⚠️</div>
        <h2>Link Expired or Invalid</h2>
        <p>{error || 'This research session is no longer available.'}</p>
        <button className="submit-btn" onClick={() => window.location.hash = ''} style={{ marginTop: 24 }}>
          Go to Curalink
        </button>
      </div>
    );
  }

  return (
    <div className="app-layout">
      <div className="main-area">
        <header className="header">
          <div className="header-brand">
            <div className="header-brand-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" style={{ width: 16, height: 16, color: 'white' }}>
                <path d="M12 2C6.5 5 6 9 6 12C6 15 6.5 19 12 22" />
                <path d="M12 2C17.5 5 18 9 18 12C18 15 17.5 19 12 22" />
                <path d="M6.5 7.5C8.5 7 11 6.8 13.5 7.5" />
                <path d="M6.5 16.5C8.5 16 11 15.8 13.5 16.5" />
              </svg>
            </div>
            <div>
              <div className="header-brand-name">Curalink</div>
              <div className="header-brand-tagline">Shared Research Session</div>
            </div>
          </div>
          <div className="header-sep" />
          <div className="header-context">
            {session.disease && (
              <div className="context-pill">
                <div className="context-pill-dot" />
                <span className="context-pill-label">Disease</span>
                <span className="context-pill-value">{session.disease}</span>
              </div>
            )}
            <div className="context-pill">
              <div className="context-pill-dot" />
              <span className="context-pill-label">Date</span>
              <span className="context-pill-value">{new Date(session.createdAt).toLocaleDateString()}</span>
            </div>
          </div>
          <div style={{ marginLeft: 'auto' }}>
            <button className="submit-btn" onClick={() => window.location.hash = ''} style={{ padding: '6px 14px', fontSize: 13 }}>
              Create Your Own
            </button>
          </div>
        </header>

        <div className="chat-container">
          <div className="shared-banner">
            <strong>Read-Only View:</strong> You are viewing a research session shared by a Curalink user.
            This information is AI-generated and not medical advice.
          </div>
          {session.messages.map((msg, index) => (
            <MessageCard
              key={index}
              message={msg}
              sessionId={null} // null so they can't bookmark
              index={index}
            />
          ))}
          <div style={{ height: 40 }} />
        </div>
      </div>
    </div>
  );
}
