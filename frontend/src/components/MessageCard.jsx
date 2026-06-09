import { useState } from 'react';
import PublicationCard from './PublicationCard';
import TrialCard from './TrialCard';
import { CopyButton, ExportButton, ShareButton } from './ExportButton';
import { PublicationTimelineChart, TrialStatusPieChart } from './ResearchCharts';
import { bookmarksAPI } from '../api';

/* ── Icons ──────────────────────────────────────────────────── */
function IconDNA() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" style={{ width: 14, height: 14 }}>
      <path d="M12 2C6.5 5 6 9 6 12C6 15 6.5 19 12 22" />
      <path d="M12 2C17.5 5 18 9 18 12C18 15 17.5 19 12 22" />
      <path d="M6.5 7.5C8.5 7 11 6.8 13.5 7.5" />
      <path d="M6.5 16.5C8.5 16 11 15.8 13.5 16.5" />
    </svg>
  );
}

function IconStar() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" style={{ width: 9, height: 9 }}>
      <path d="M12 2l2.4 7.4H22l-6.2 4.5 2.4 7.4L12 17l-6.2 4.3 2.4-7.4L2 9.4h7.6z" />
    </svg>
  );
}

function IconChevron({ open }) {
  return (
    <svg
      viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
      strokeLinecap="round" strokeLinejoin="round"
      style={{
        width: 14, height: 14, transition: 'transform 0.2s ease',
        transform: open ? 'rotate(180deg)' : 'rotate(0deg)',
      }}
    >
      <polyline points="6 9 12 15 18 9" />
    </svg>
  );
}

function formatTime(dateStr) {
  const d = new Date(dateStr);
  return d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
}

function wordCount(text) {
  return text ? text.split(/\s+/).filter(Boolean).length : 0;
}

function readingTime(message) {
  const llm = message.metadata?.llmResponse;
  if (!llm) return null;
  let total = wordCount(llm.conditionOverview || '');
  (llm.researchInsights || []).forEach((i) => {
    total += wordCount(i.insight || '') + wordCount(i.detail || '');
  });
  total += wordCount(llm.clinicalTrialsSummary || '');
  total += wordCount(llm.personalizedNote || '');
  (llm.keyTakeaways || []).forEach((t) => { total += wordCount(t); });
  const mins = Math.max(1, Math.ceil(total / 200));
  return `${mins} min read`;
}

/* ── SectionTitle helper ────────────────────────────────────── */
function SectionTitle({ children }) {
  return (
    <div className="section-title">
      <div className="section-dot" />
      {children}
      <div className="section-title-bar" />
    </div>
  );
}

/* ── Collapsible Section ────────────────────────────────────── */
function CollapsibleSection({ title, defaultOpen = true, children, count }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="section-block">
      <button className="section-collapse-btn" onClick={() => setOpen(!open)}>
        <SectionTitle>{title} {count ? `(${count})` : ''}</SectionTitle>
        <IconChevron open={open} />
      </button>
      {open && children}
    </div>
  );
}

/* ── Typing Indicator ───────────────────────────────────────── */
export function TypingIndicator() {
  return (
    <div className="message-row ai">
      <div className="message-avatar ai">
        <IconDNA />
      </div>
      <div className="message-content">
        <div className="typing-indicator">
          <div className="typing-dots">
            <div className="typing-dot" />
            <div className="typing-dot" />
            <div className="typing-dot" />
          </div>
          <span className="typing-text">Curalink is researching…</span>
        </div>
      </div>
    </div>
  );
}

/* ── User Message ───────────────────────────────────────────── */
export function UserMessage({ content, timestamp, userName }) {
  const initial = userName ? userName.charAt(0).toUpperCase() : 'U';
  return (
    <div className="message-row user">
      <div className="message-content">
        <div className="user-bubble">{content}</div>
        {timestamp && <div className="message-time">{formatTime(timestamp)}</div>}
      </div>
      <div className="message-avatar user-av">{initial}</div>
    </div>
  );
}

/* ── Bookmark Button ────────────────────────────────────────── */
function BookmarkBtn({ sessionId, messageIndex, message, disease }) {
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleBookmark = async () => {
    if (loading) return;
    setLoading(true);
    try {
      if (saved) {
        // For simplicity, we don't track bookmark IDs here
        setSaved(false);
      } else {
        await bookmarksAPI.create({
          sessionId,
          messageIndex,
          title: message.metadata?.llmResponse?.conditionOverview?.slice(0, 80) || 'Research',
          disease: disease || '',
          preview: message.metadata?.expandedQuery || '',
        });
        setSaved(true);
      }
    } catch (err) {
      if (err.response?.status === 409) setSaved(true); // Already bookmarked
      else console.error('Bookmark failed:', err);
    }
    setLoading(false);
  };

  return (
    <button
      className={`action-btn ${saved ? 'action-btn-active' : ''}`}
      onClick={handleBookmark}
      title={saved ? 'Bookmarked' : 'Bookmark this research'}
    >
      <svg viewBox="0 0 24 24" fill={saved ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ width: 13, height: 13 }}>
        <path d="M19 21l-7-5-7 5V5a2 2 0 012-2h10a2 2 0 012 2z" />
      </svg>
      {saved ? 'Saved' : 'Save'}
    </button>
  );
}

/* ── AI Message ─────────────────────────────────────────────── */
export function AIMessage({ message, sessionId, messageIndex, disease }) {
  const { content, metadata, timestamp } = message;
  const llm = metadata?.llmResponse;
  const pubs = metadata?.publications || [];
  const trials = metadata?.clinicalTrials || [];
  const stats = metadata?.stats;
  const expandedQuery = metadata?.expandedQuery;

  if (!llm) {
    return (
      <div className="message-row ai">
        <div className="message-avatar ai"><IconDNA /></div>
        <div className="message-content">
          <div className="ai-response">
            <div className="ai-response-body">
              <p style={{ fontSize: 14.5, color: 'var(--t2)', lineHeight: 1.75 }}>{content}</p>
            </div>
          </div>
          {timestamp && <div className="message-time">{formatTime(timestamp)}</div>}
        </div>
      </div>
    );
  }

  return (
    <div className="message-row ai">
      <div className="message-avatar ai"><IconDNA /></div>
      <div className="message-content">
        <div className="ai-response">
          {/* Card header */}
          <div className="ai-response-header">
            <span className="ai-response-badge">
              <span className="ai-response-badge-dot" />
              <IconStar />
              Curalink Research
            </span>
            {expandedQuery && (
              <span className="ai-response-query">
                {expandedQuery.length > 64
                  ? expandedQuery.slice(0, 64) + '…'
                  : expandedQuery}
              </span>
            )}
            {stats && (
              <span className="ai-response-stats">
                {stats.totalRetrieved} sources → top {pubs.length + trials.length}
              </span>
            )}
          </div>

          <div className="ai-response-body">
            {/* Action bar */}
            <div className="ai-actions">
              <CopyButton message={message} />
              <ExportButton message={message} />
              <ShareButton message={message} />
              {sessionId && (
                <BookmarkBtn
                  sessionId={sessionId}
                  messageIndex={messageIndex}
                  message={message}
                  disease={disease}
                />
              )}
              {readingTime(message) && (
                <span className="reading-time">{readingTime(message)}</span>
              )}
            </div>

            {/* Condition Overview */}
            {llm.conditionOverview && (
              <div className="section-block">
                <SectionTitle>Condition Overview</SectionTitle>
                <div className="condition-overview">{llm.conditionOverview}</div>
              </div>
            )}

            {/* Research Insights */}
            {llm.researchInsights?.length > 0 && (
              <CollapsibleSection title="Research Insights" count={llm.researchInsights.length}>
                <div className="insights-list">
                  {llm.researchInsights.map((insight, i) => (
                    <div key={i} className="insight-item">
                      <div className="insight-top">
                        {insight.citation && (
                          <span className="insight-citation">[{insight.citation}]</span>
                        )}
                        <span className="insight-text">{insight.insight}</span>
                      </div>
                      {insight.detail && (
                        <div className="insight-detail">{insight.detail}</div>
                      )}
                    </div>
                  ))}
                </div>
              </CollapsibleSection>
            )}

            {/* Publications */}
            {pubs.length > 0 && (
              <CollapsibleSection title="Source Publications" count={pubs.length} defaultOpen={false}>
                <div className="publications-grid">
                  {pubs.map((pub, i) => (
                    <PublicationCard key={pub.id || i} pub={pub} index={i} />
                  ))}
                </div>
              </CollapsibleSection>
            )}

            {/* Clinical Trials */}
            {(llm.clinicalTrialsSummary || trials.length > 0) && (
              <CollapsibleSection title="Clinical Trials" count={trials.length} defaultOpen={false}>
                {llm.clinicalTrialsSummary && (
                  <div className="trials-summary">{llm.clinicalTrialsSummary}</div>
                )}
                {trials.length > 0 && (
                  <div className="trials-list">
                    {trials.map((trial, i) => (
                      <TrialCard key={trial.id || i} trial={trial} />
                    ))}
                  </div>
                )}
              </CollapsibleSection>
            )}

            {/* Personalized Note */}
            {llm.personalizedNote && (
              <div className="section-block">
                <SectionTitle>Personalized Note</SectionTitle>
                <div className="personalized-note">{llm.personalizedNote}</div>
              </div>
            )}

            {/* Drug Safety Note */}
            {llm.drugSafetyNote && (
              <div className="section-block">
                <SectionTitle>⚠️ Drug Safety</SectionTitle>
                <div className="drug-safety-note">{llm.drugSafetyNote}</div>
              </div>
            )}

            {/* Data Visualizations */}
            {(pubs.length >= 3 || trials.length >= 2) && (
              <CollapsibleSection title="Data Visualizations" defaultOpen={false}>
                <div className="charts-grid">
                  <PublicationTimelineChart publications={pubs} />
                  <TrialStatusPieChart trials={trials} />
                </div>
              </CollapsibleSection>
            )}

            {/* Key Takeaways */}
            {llm.keyTakeaways?.length > 0 && (
              <div className="section-block">
                <SectionTitle>Key Takeaways</SectionTitle>
                <div className="key-takeaways">
                  {llm.keyTakeaways.map((t, i) => (
                    <div key={i} className="takeaway-item">
                      <div className="takeaway-bullet" />
                      <span>{t}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
        {timestamp && <div className="message-time">{formatTime(timestamp)}</div>}
      </div>
    </div>
  );
}
