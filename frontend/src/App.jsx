import { useState, useEffect, useRef, useCallback } from 'react';
import { useAuth } from './contexts/AuthContext';
import AuthPage from './components/AuthPage';
import SessionSidebar from './components/SessionSidebar';
import InputPanel from './components/InputPanel';
import { UserMessage, AIMessage, TypingIndicator } from './components/MessageCard';
import AnalyticsDashboard from './components/AnalyticsDashboard';
import PrivacyPolicy from './components/PrivacyPolicy';
import Accessibility from './components/Accessibility';
import CookieConsent from './components/CookieConsent';
import SharedSessionPage from './components/SharedSessionPage';
import AlertsPanel from './components/AlertsPanel';
import ShareSessionBtn from './components/ShareSessionBtn';
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

/* ── Hash-based routing for legal pages ─────────────────────── */
function useHashRoute() {
  const [route, setRoute] = useState(() => window.location.hash.replace('#', '') || '/');
  useEffect(() => {
    const handler = () => setRoute(window.location.hash.replace('#', '') || '/');
    window.addEventListener('hashchange', handler);
    return () => window.removeEventListener('hashchange', handler);
  }, []);
  return route;
}

/* ── Toast Component ────────────────────────────────────────── */
function Toast({ message, type, onClose }) {
  useEffect(() => {
    const t = setTimeout(onClose, 3500);
    return () => clearTimeout(t);
  }, [onClose]);

  return (
    <div className={`toast toast-${type}`}>
      {type === 'success' && '✓ '}
      {type === 'error' && '✕ '}
      {message}
    </div>
  );
}

/* ── App Footer ─────────────────────────────────────────────── */
function AppFooter() {
  return (
    <footer className="app-footer" role="contentinfo">
      <div className="app-footer-inner">
        <span className="app-footer-copy">© {new Date().getFullYear()} Curalink</span>
        <nav className="app-footer-links" aria-label="Legal links">
          <a href="#/privacy" className="app-footer-link">Privacy Policy</a>
          <span className="app-footer-sep">·</span>
          <a href="#/accessibility" className="app-footer-link">Accessibility</a>
        </nav>
      </div>
    </footer>
  );
}

export default function App() {
  const { isAuthenticated, loading, user } = useAuth();
  const isMobile = useIsMobile();
  const route = useHashRoute();
  const [sidebarOpen, setSidebarOpen] = useState(() => window.innerWidth >= 768);
  const [currentSessionId, setCurrentSessionId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [sessionContext, setSessionContext] = useState({ patientName: '', disease: '', location: '', age: '', gender: '' });
  const [showDashboard, setShowDashboard] = useState(false);
  const [showAlerts, setShowAlerts] = useState(false);
  const [toasts, setToasts] = useState([]);
  const [route, setRoute] = useState(window.location.hash.slice(1) || '/');
  const messagesEndRef = useRef(null);

  useEffect(() => {
    setSidebarOpen(!isMobile);
  }, [isMobile]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => { scrollToBottom(); }, [messages, isLoading]);

  // Toast helper
  const addToast = useCallback((message, type = 'success') => {
    const id = Date.now();
    setToasts((prev) => [...prev, { id, message, type }]);
  }, []);

  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  // Keyboard shortcuts
  useEffect(() => {
    const handler = (e) => {
      if (e.ctrlKey || e.metaKey) {
        if (e.key === 'n' || e.key === 'N') {
          e.preventDefault();
          handleNewChat();
        }
        if (e.key === 'k' || e.key === 'K') {
          e.preventDefault();
          setSidebarOpen((p) => !p);
        }
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  const closeSidebarOnMobile = useCallback(() => {
    if (isMobile) setSidebarOpen(false);
  }, [isMobile]);

  const handleNewChat = () => {
    setCurrentSessionId(null);
    setMessages([]);
    setError(null);
    setSessionContext({ patientName: '', disease: '', location: '', age: '', gender: '' });
    setShowDashboard(false);
    closeSidebarOnMobile();
  };

  const handleSelectSession = async (sessionId) => {
    try {
      setShowDashboard(false);
      const res = await sessionsAPI.getOne(sessionId);
      const session = res.data;
      setCurrentSessionId(sessionId);
      setSessionContext({
        patientName: session.patientName || '',
        disease: session.disease || '',
        location: session.location || '',
        age: session.age || '',
        gender: session.gender || '',
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
    } catch (err) {
      setError('Failed to load session.');
    }
  };

  const handleSubmit = async ({ message, patientName, disease, location, age, gender, medications, documentContext, language }) => {
    if (!message.trim() || isLoading) return;
    setError(null);
    setShowDashboard(false);

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
        age: age || sessionContext.age,
        gender: gender || sessionContext.gender,
        medications: medications || [],
        documentContext: documentContext || '',
        language: language || 'English',
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
      addToast(`Found ${result.stats?.totalRetrieved || 0} sources`, 'success');
    } catch (err) {
      const errMsg = err.response?.data?.error || err.message || 'Something went wrong.';
      setError(errMsg);
      addToast(errMsg, 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleWelcomeChip = (query) => handleSubmit({ message: query });
  const hasMessages = messages.length > 0;

  const handleBackToApp = () => {
    window.location.hash = '';
  };

  // ── Auth loading state ──────────────────────────────────
  if (loading) {
    return (
      <div className="auth-page">
        <div className="auth-bg">
          <div className="auth-bg-orb auth-bg-orb-1" />
          <div className="auth-bg-orb auth-bg-orb-2" />
        </div>
        <div className="auth-card" style={{ textAlign: 'center', padding: '60px 40px' }}>
          <div className="typing-dots" style={{ justifyContent: 'center', marginBottom: 16 }}>
            <div className="typing-dot" />
            <div className="typing-dot" />
            <div className="typing-dot" />
          </div>
          <p style={{ color: 'var(--t3)', fontSize: 14 }}>Loading Curalink...</p>
        </div>
      </div>
    );
  }

  // ── Legal pages (accessible without auth) ──────────────
  if (route === '/privacy') {
    return <PrivacyPolicy onBack={handleBackToApp} />;
  }
  if (route === '/accessibility') {
    return <Accessibility onBack={handleBackToApp} />;
  }
  if (route.startsWith('/shared/')) {
    const token = route.replace('/shared/', '');
    return <SharedSessionPage token={token} />;
  }

  // ── Auth gate ───────────────────────────────────────────
  if (!isAuthenticated) {
    return (
      <>
        <AuthPage />
        <CookieConsent />
      </>
    );
  }

  return (
    <div className="app-layout">
      {/* Toasts */}
      <div className="toast-container">
        {toasts.map((t) => (
          <Toast key={t.id} message={t.message} type={t.type} onClose={() => removeToast(t.id)} />
        ))}
      </div>

      {/* Cookie Consent Banner */}
      <CookieConsent />

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
        onShowDashboard={() => { setShowDashboard(true); closeSidebarOnMobile(); }}
        showDashboard={showDashboard}
        onShowAlerts={() => { setShowAlerts(true); closeSidebarOnMobile(); }}
      />

      <div className="main-area">
        {/* Header */}
        <header className="header">
          <button
            className="header-toggle"
            onClick={() => setSidebarOpen((p) => !p)}
            title="Toggle sidebar (Ctrl+K)"
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

          {hasMessages && !showDashboard && (sessionContext.disease || sessionContext.patientName || sessionContext.location) && (
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
            {currentSessionId && <ShareSessionBtn sessionId={currentSessionId} />}
            <div className="status-dot" />
            <span>Live</span>
          </div>
        </header>

        {/* Alerts Panel */}
        {showAlerts && (
          <div className="sidebar-backdrop" style={{ zIndex: 300 }}>
            <AlertsPanel onClose={() => setShowAlerts(false)} />
          </div>
        )}

        {/* Dashboard View */}
        {showDashboard ? (
          <div className="chat-container">
            <AnalyticsDashboard onClose={() => setShowDashboard(false)} />
          </div>
        ) : (
          <>
            {/* Chat Area */}
            <div className="chat-container" id="chat-container">
              {!hasMessages ? (
                <div className="chat-welcome">
                  {/* Animated icon */}
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
                    Enter your medical query and patient context below. Curalink retrieves
                    research from PubMed, OpenAlex, and ClinicalTrials.gov, then reasons
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

                  <div className="welcome-shortcuts">
                    <span><kbd>Ctrl</kbd>+<kbd>N</kbd> New Chat</span>
                    <span><kbd>Ctrl</kbd>+<kbd>K</kbd> Toggle Sidebar</span>
                  </div>
                </div>
              ) : (
                <>
                  {messages.map((msg, i) =>
                    msg.role === 'user' ? (
                      <UserMessage key={i} content={msg.content} timestamp={msg.timestamp} userName={user?.name} />
                    ) : (
                      <AIMessage
                        key={i}
                        message={msg}
                        sessionId={currentSessionId}
                        messageIndex={i}
                        disease={sessionContext.disease}
                      />
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
          </>
        )}

        {/* Footer with legal links */}
        <AppFooter />
      </div>
    </div>
  );
}
