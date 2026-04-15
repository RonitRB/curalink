import { useState, useEffect, useRef } from 'react';
import SessionSidebar from './components/SessionSidebar';
import InputPanel from './components/InputPanel';
import { UserMessage, AIMessage, TypingIndicator } from './components/MessageCard';
import { chatAPI, sessionsAPI } from './api';
import './index.css';

const WELCOME_QUERIES = [
  'Latest treatment for lung cancer',
  'Clinical trials for diabetes',
  'Top researchers in Alzheimer\'s disease',
  'Recent studies on heart disease',
];

export default function App() {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [currentSessionId, setCurrentSessionId] = useState(null);
  const [messages, setMessages] = useState([]); // { role, content, metadata, timestamp }
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [sessionContext, setSessionContext] = useState({ patientName: '', disease: '', location: '' });

  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => { scrollToBottom(); }, [messages, isLoading]);

  const handleNewChat = () => {
    setCurrentSessionId(null);
    setMessages([]);
    setError(null);
    setSessionContext({ patientName: '', disease: '', location: '' });
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

      // Reconstruct messages from session history
      const reconstructed = session.messages.map((m) => ({
        role: m.role,
        content: m.content,
        metadata: m.metadata || null,
        timestamp: m.timestamp,
      }));
      setMessages(reconstructed);
      setError(null);
    } catch (err) {
      setError('Failed to load session.');
    }
  };

  const handleSubmit = async ({ message, patientName, disease, location }) => {
    if (!message.trim() || isLoading) return;
    setError(null);

    // Add user message optimistically
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

      // Update session state
      setCurrentSessionId(sessionId);
      setSessionContext(newCtx || sessionContext);

      // Add AI response
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

  const handleWelcomeChip = (query) => {
    handleSubmit({ message: query });
  };

  const hasMessages = messages.length > 0;

  return (
    <>
      <div className="bg-mesh" />
      <div className="app-layout">
        <SessionSidebar
          currentSessionId={currentSessionId}
          onSelectSession={handleSelectSession}
          onNewChat={handleNewChat}
          collapsed={sidebarCollapsed}
        />

        <div className="main-area">
          {/* Header */}
          <header className="header">
            <button
              className="header-toggle"
              onClick={() => setSidebarCollapsed((p) => !p)}
              title="Toggle sidebar"
              id="btn-toggle-sidebar"
            >
              ☰
            </button>
            <div className="header-title">
              <div className="header-logo-icon">🧬</div>
              <div>
                <div className="header-name">
                  <span className="text-gradient">Curalink</span>
                </div>
                <div className="header-tagline">AI Medical Research Assistant</div>
              </div>
            </div>
            {hasMessages && (
              <div className="header-context">
                {sessionContext.disease && (
                  <div className="context-badge">
                    <span className="context-badge-icon">🩺</span>
                    <span className="context-badge-value">{sessionContext.disease}</span>
                  </div>
                )}
                {sessionContext.patientName && (
                  <div className="context-badge">
                    <span className="context-badge-icon">👤</span>
                    <span className="context-badge-value">{sessionContext.patientName}</span>
                  </div>
                )}
                {sessionContext.location && (
                  <div className="context-badge">
                    <span className="context-badge-icon">📍</span>
                    <span className="context-badge-value">{sessionContext.location}</span>
                  </div>
                )}
              </div>
            )}
          </header>

          {/* Chat Area */}
          <div className="chat-container" id="chat-container">
            {!hasMessages ? (
              <div className="chat-welcome">
                <div className="chat-welcome-icon">🧬</div>
                <h1>
                  Medical Research,{' '}
                  <span className="text-gradient">Powered by AI</span>
                </h1>
                <p>
                  Enter your medical query and patient context below. Curalink will retrieve
                  research from PubMed, OpenAlex, and ClinicalTrials.gov — then reason over
                  it with Llama 3 to deliver structured, source-backed insights.
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
                    <div className="message-avatar ai">🧬</div>
                    <div className="message-content">
                      <div className="error-bubble">
                        ⚠️ {error}
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
    </>
  );
}
