import { useState, useEffect, useRef, useCallback } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import SessionSidebar from './components/SessionSidebar';
import InputPanel from './components/InputPanel';
import AuthPage from './components/AuthPage';
import { UserMessage, AIMessage, TypingIndicator } from './components/MessageCard';
import { chatAPI, sessionsAPI } from './api';
import './index.css';

const WELCOME_QUERIES = [
  'Latest treatment for lung cancer',
  'Clinical trials for diabetes',
  'Top researchers in Alzheimer\'s disease',
  'Recent studies on heart disease',
];

/* ── SVG Icons ──────────────────────────────────────────────── */
function IconDNA() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 2C6.5 5 6 9 6 12C6 15 6.5 19 12 22" />
      <path d="M12 2C17.5 5 18 9 18 12C18 15 17.5 19 12 22" />
      <path d="M6.5 7.5C8.5 7 11 6.8 13.5 7.5" />
      <path d="M6.5 16.5C8.5 16 11 15.8 13.5 16.5" />
      <path d="M10.5 7.5C11.5 7 13 6.8 17.5 7.5" opacity="0.5"/>
      <path d="M10.5 16.5C11.5 16 13 15.8 17.5 16.5" opacity="0.5"/>
    </svg>
  );
}

function IconMenu() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
      <line x1="3" y1="7" x2="21" y2="7" />
      <line x1="3" y1="12" x2="21" y2="12" />
      <line x1="3" y1="17" x2="21" y2="17" />
    </svg>
  );
}

function useIsMobile() {
  const [isMobile, setIsMobile] = useState(() => window.innerWidth < 768);
  useEffect(() => {
    const mq = window.matchMedia('(max-width: 767px)');
    const handler = (e) => setIsMobile(e.matches);
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);
  return isMobile;
}

/* ── Initials avatar ────────────────────────────────────────── */
function UserAvatar({ name, onClick }) {
  const initials = name
    ? name.split(' ').map((w) => w[0]).slice(0, 2).join('').toUpperCase()
    : '?';
  return (
    <button
      className="header-user-avatar"
      onClick={onClick}
      id="btn-user-menu"
      title={`Signed in as ${name}`}
      aria-label="User menu"
    >
      {initials}
    </button>
  );
}

/* ── Main app (authenticated) ───────────────────────────────── */
function MainApp() {
  const { user, logout } = useAuth();
  const isMobile = useIsMobile();
  const [sidebarOpen, setSidebarOpen] = useState(() => window.innerWidth >= 768);
  const [currentSessionId, setCurrentSessionId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [sessionContext, setSessionContext] = useState({ patientName: '', disease: '', location: '' });
  const [showUserMenu, setShowUserMenu] = useState(false);

  const messagesEndRef = useRef(null);

  useEffect(() => { setSidebarOpen(!isMobile); }, [isMobile]);
  useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages, isLoading]);

  // Close user menu on outside click
  useEffect(() => {
    if (!showUserMenu) return;
    const handler = () => setShowUserMenu(false);
    document.addEventListener('click', handler);
    return () => document.removeEventListener('click', handler);
  }, [showUserMenu]);

  const closeSidebarOnMobile = useCallback(() => {
    if (isMobile) setSidebarOpen(false);
  }, [isMobile]);

  const handleNewChat = () => {
    setCurrentSessionId(null);
    setMessages([]);
    setError(null);
    setSessionContext({ patientName: '', disease: '', location: '' });
    closeSidebarOnMobile();
  };

  const handleSelectSession = async (sessionId) => {
    try {
      const res = await sessionsAPI.getOne(sessionId);
      const session = res.data;
      setCurrentSessionId(sessionId);
      setSessionContext({
        patientName: session.patientName || '',
        disease: session.disease || '',
        location: session.location || '',
      });
      const reconstructed = session.messages.map((m) => ({
        role: m.role,
        content: m.content,
        metadata: m.metadata || null,
        timestamp: m.timestamp,
      }));
      setMessages(reconstructed);
      setError(null);
      closeSidebarOnMobile();
    } catch {
      setError('Failed to load session.');
    }
  };

  const handleSubmit = async ({ message, patientName, disease, location }) => {
    if (!message.trim() || isLoading) return;
    setError(null);

    const userMsg = { role: 'user', content: message, timestamp: new Date().toISOString() };
    setMessages((prev) => [...prev, userMsg]);
    setIsLoading(true);

    try {
      const payload = {
        message,
        sessionId: currentSessionId,
        patientName: patientName || sessionContext.patientName,
        disease: disease || sessionContext.disease,
        location: location || sessionContext.location,
      };

      const res = await chatAPI.sendMessage(payload);
      const { sessionId, result, sessionContext: newCtx } = res.data;

      setCurrentSessionId(sessionId);
      setSessionContext(newCtx || sessionContext);

      const aiMsg = {
        role: 'assistant',
        content: result.llmResponse?.conditionOverview || 'Research complete.',
        metadata: {
          publications: result.publications,
          clinicalTrials: result.clinicalTrials,
          expandedQuery: result.expandedQuery,
          llmResponse: result.llmResponse,
          stats: result.stats,
        },
        timestamp: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, aiMsg]);
    } catch (err) {
      setError(err.response?.data?.error || err.message || 'Something went wrong.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleWelcomeChip = (query) => handleSubmit({ message: query });
  const hasMessages = messages.length > 0;

  return (
    <div className="app-layout">
      {/* Mobile overlay backdrop */}
      {isMobile && sidebarOpen && (
        <div
          className="sidebar-backdrop"
          onClick={() => setSidebarOpen(false)}
          aria-hidden="true"
        />
      )}

      <SessionSidebar
        currentSessionId={currentSessionId}
        onSelectSession={handleSelectSession}
        onNewChat={handleNewChat}
        open={sidebarOpen}
        isMobile={isMobile}
      />

      <div className="main-area">
        {/* Header */}
        <header className="header">
          <button
            className="header-toggle"
            onClick={() => setSidebarOpen((p) => !p)}
            title="Toggle sidebar"
            id="btn-toggle-sidebar"
            aria-label="Toggle sidebar"
          >
            <IconMenu />
          </button>

          <div className="header-brand">
            <div className="header-brand-icon">
              <IconDNA />
            </div>
            <div>
              <div className="header-brand-name">Curalink</div>
              <div className="header-brand-tagline">AI Medical Research Assistant</div>
            </div>
          </div>

          {hasMessages && (sessionContext.disease || sessionContext.patientName || sessionContext.location) && (
            <>
              <div className="header-sep" />
              <div className="header-context">
                {sessionContext.disease && (
                  <div className="context-pill">
                    <div className="context-pill-dot" />
                    <span className="context-pill-label">Disease</span>
                    <span className="context-pill-value">{sessionContext.disease}</span>
                  </div>
                )}
                {sessionContext.patientName && (
                  <div className="context-pill">
                    <div className="context-pill-dot" />
                    <span className="context-pill-label">Patient</span>
                    <span className="context-pill-value">{sessionContext.patientName}</span>
                  </div>
                )}
                {sessionContext.location && (
                  <div className="context-pill">
                    <div className="context-pill-dot" />
                    <span className="context-pill-label">Location</span>
                    <span className="context-pill-value">{sessionContext.location}</span>
                  </div>
                )}
              </div>
            </>
          )}

          <div className="header-status" style={{ marginLeft: hasMessages ? undefined : 'auto' }}>
            <div className="status-dot" />
            <span>Live</span>
          </div>

          {/* User avatar + dropdown */}
          <div className="header-user-wrap" style={{ position: 'relative' }}>
            <UserAvatar
              name={user?.name}
              onClick={(e) => { e.stopPropagation(); setShowUserMenu((p) => !p); }}
            />
            {showUserMenu && (
              <div className="user-dropdown" onClick={(e) => e.stopPropagation()}>
                <div className="user-dropdown-info">
                  <div className="user-dropdown-name">{user?.name}</div>
                  <div className="user-dropdown-email">{user?.email}</div>
                </div>
                <div className="user-dropdown-divider" />
                <button
                  className="user-dropdown-logout"
                  onClick={logout}
                  id="btn-logout"
                >
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" style={{ width: 14, height: 14 }}>
                    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                    <polyline points="16 17 21 12 16 7" />
                    <line x1="21" y1="12" x2="9" y2="12" />
                  </svg>
                  Sign Out
                </button>
              </div>
            )}
          </div>
        </header>

        {/* Chat Area */}
        <div className="chat-container" id="chat-container">
          {!hasMessages ? (
            <div className="chat-welcome">
              <div className="welcome-icon-wrap">
                <div className="welcome-icon-halo" />
                <div className="welcome-icon-ring" />
                <div className="welcome-icon-core">
                  <IconDNA />
                </div>
              </div>

              <h1>
                Medical Research,{' '}
                <span className="gradient-text">Powered by AI</span>
              </h1>
              <p>
                Welcome, <strong style={{ color: 'var(--p-bright)' }}>{user?.name?.split(' ')[0]}</strong>. Enter your medical query and patient context below.
                Curalink retrieves research from PubMed, OpenAlex, and ClinicalTrials.gov, then reasons
                over it with Llama 3 to deliver structured, source-backed insights.
              </p>
              <div className="welcome-chips">
                {WELCOME_QUERIES.map((q) => (
                  <button
                    key={q}
                    className="welcome-chip"
                    onClick={() => handleWelcomeChip(q)}
                    disabled={isLoading}
                  >
                    {q}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <>
              {messages.map((msg, i) =>
                msg.role === 'user' ? (
                  <UserMessage key={i} content={msg.content} timestamp={msg.timestamp} />
                ) : (
                  <AIMessage key={i} message={msg} />
                )
              )}
              {isLoading && <TypingIndicator />}
              {error && (
                <div className="message-row ai">
                  <div className="message-avatar ai">
                    <IconDNA />
                  </div>
                  <div className="message-content">
                    <div className="error-bubble">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ width: 16, height: 16, flexShrink: 0 }}>
                        <circle cx="12" cy="12" r="10" />
                        <line x1="12" y1="8" x2="12" y2="12" />
                        <line x1="12" y1="16" x2="12.01" y2="16" />
                      </svg>
                      {error}
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <InputPanel
          onSubmit={handleSubmit}
          isLoading={isLoading}
          sessionContext={sessionContext}
        />
      </div>
    </div>
  );
}

/* ── Root: gate on auth ─────────────────────────────────────── */
function AppGate() {
  const { isAuthenticated } = useAuth();
  return isAuthenticated ? <MainApp /> : <AuthPage />;
}

export default function App() {
  return (
    <AuthProvider>
      <AppGate />
    </AuthProvider>
  );
}
