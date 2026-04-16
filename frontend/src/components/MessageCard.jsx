import PublicationCard from './PublicationCard';
import TrialCard from './TrialCard';

function formatTime(dateStr) {
  const d = new Date(dateStr);
  return d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
}

export function TypingIndicator() {
  return (
    <div className="message-row ai">
      <div className="message-avatar ai">🧬</div>
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

export function UserMessage({ content, timestamp }) {
  return (
    <div className="message-row user">
      <div className="message-content">
        <div className="user-bubble">{content}</div>
        {timestamp && <div className="message-time">{formatTime(timestamp)}</div>}
      </div>
      <div className="message-avatar user-av">U</div>
    </div>
  );
}

export function AIMessage({ message }) {
  const { content, metadata, timestamp } = message;
  const llm = metadata?.llmResponse;
  const pubs = metadata?.publications || [];
  const trials = metadata?.clinicalTrials || [];
  const stats = metadata?.stats;
  const expandedQuery = metadata?.expandedQuery;

  if (!llm) {
    return (
      <div className="message-row ai">
        <div className="message-avatar ai">🧬</div>
        <div className="message-content">
          <div className="ai-response">
            <div className="ai-response-body">
              <p style={{ fontSize: 14.5, color: 'var(--text-2)', lineHeight: 1.7 }}>{content}</p>
            </div>
          </div>
          {timestamp && <div className="message-time">{formatTime(timestamp)}</div>}
        </div>
      </div>
    );
  }

  return (
    <div className="message-row ai">
      <div className="message-avatar ai">🧬</div>
      <div className="message-content">
        <div className="ai-response">
          {/* Card header */}
          <div className="ai-response-header">
            <span className="ai-response-badge">✦ Curalink Research</span>
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
            {/* Condition Overview */}
            {llm.conditionOverview && (
              <div className="section-block">
                <div className="section-title">
                  Condition Overview
                </div>
                <div className="condition-overview">{llm.conditionOverview}</div>
              </div>
            )}

            {/* Research Insights */}
            {llm.researchInsights?.length > 0 && (
              <div className="section-block">
                <div className="section-title">Research Insights</div>
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
              </div>
            )}

            {/* Publications */}
            {pubs.length > 0 && (
              <div className="section-block">
                <div className="section-title">
                  Source Publications ({pubs.length})
                </div>
                <div className="publications-grid">
                  {pubs.map((pub, i) => (
                    <PublicationCard key={pub.id || i} pub={pub} index={i} />
                  ))}
                </div>
              </div>
            )}

            {/* Clinical Trials */}
            {(llm.clinicalTrialsSummary || trials.length > 0) && (
              <div className="section-block">
                <div className="section-title">
                  Clinical Trials {trials.length > 0 && `(${trials.length})`}
                </div>
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
              </div>
            )}

            {/* Personalized Note */}
            {llm.personalizedNote && (
              <div className="section-block">
                <div className="section-title">Personalized Note</div>
                <div className="personalized-note">{llm.personalizedNote}</div>
              </div>
            )}

            {/* Key Takeaways */}
            {llm.keyTakeaways?.length > 0 && (
              <div className="section-block">
                <div className="section-title">Key Takeaways</div>
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
