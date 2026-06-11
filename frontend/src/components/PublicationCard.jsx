import { useState } from 'react';
import CitationDropdown from './CitationDropdown';
import { chatAPI } from '../api';

export default function PublicationCard({ pub, index }) {
  const sourceClass = pub.source === 'PubMed' ? 'pubmed' : 'openalex';
  const [summary, setSummary] = useState(null);
  const [summarizing, setSummarizing] = useState(false);
  const [summaryError, setSummaryError] = useState(null);
  const [showAbstract, setShowAbstract] = useState(false);

  const handleSummarize = async () => {
    if (summary) {
      // Toggle show/hide if already fetched
      setShowAbstract(false);
      return;
    }
    if (!pub.abstract) return;
    setSummarizing(true);
    setSummaryError(null);
    try {
      const res = await chatAPI.summarize({ title: pub.title, abstract: pub.abstract });
      setSummary(res.data.summary);
    } catch (err) {
      console.error('Summarize failed:', err);
      setSummaryError('Could not generate summary.');
    } finally {
      setSummarizing(false);
    }
  };

  return (
    <div className="pub-card">
      <div className="pub-card-header">
        <span className={`pub-source-badge ${sourceClass}`}>{pub.source}</span>
        {pub.year > 0 && <span className="pub-year">{pub.year}</span>}
        {pub.similarity && (
          <span className="pub-similarity" title="Semantic similarity score">
            {Math.round(pub.similarity * 100)}% match
          </span>
        )}
      </div>
      <div className="pub-title">{pub.title}</div>
      {pub.authors && pub.authors.length > 0 && (
        <div className="pub-authors">
          {pub.authors.slice(0, 3).join(', ')}{pub.authors.length > 3 ? ` +${pub.authors.length - 3}` : ''}
        </div>
      )}

      {/* DOI Badge */}
      {pub.doi && (
        <div className="pub-doi">
          <a
            href={`https://doi.org/${pub.doi.replace(/^https?:\/\/doi\.org\//, '')}`}
            target="_blank"
            rel="noopener noreferrer"
            title="View via DOI"
          >
            DOI: {pub.doi.replace(/^https?:\/\/doi\.org\//, '')}
          </a>
        </div>
      )}

      {/* AI Summary or Abstract */}
      {summary && !showAbstract ? (
        <div className="pub-summary">
          <div className="pub-summary-badge">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ width: 11, height: 11 }}>
              <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
            </svg>
            AI Summary
          </div>
          <p>{summary}</p>
          <button className="pub-toggle-view" onClick={() => setShowAbstract(true)}>
            View full abstract →
          </button>
        </div>
      ) : (
        <>
          {pub.abstract && (
            <div className="pub-abstract">{pub.abstract}</div>
          )}
          {summary && (
            <button className="pub-toggle-view" onClick={() => setShowAbstract(false)}>
              ← View AI Summary
            </button>
          )}
        </>
      )}
      {summaryError && <div className="pub-summary-error">{summaryError}</div>}

      <div className="pub-card-footer">
        {pub.url && (
          <a href={pub.url} target="_blank" rel="noopener noreferrer" className="pub-link">
            View Publication →
          </a>
        )}
        {pub.abstract && (
          <button
            className="pub-summarize-btn"
            onClick={handleSummarize}
            disabled={summarizing}
            title="Get AI-powered summary of this publication"
          >
            {summarizing ? (
              <>
                <span className="pub-summarize-spinner" />
                Summarizing…
              </>
            ) : summary ? (
              <>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ width: 12, height: 12 }}>
                  <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
                </svg>
                Summarized ✓
              </>
            ) : (
              <>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ width: 12, height: 12 }}>
                  <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
                </svg>
                Summarize
              </>
            )}
          </button>
        )}
        <CitationDropdown pub={pub} />
      </div>
    </div>
  );
}
