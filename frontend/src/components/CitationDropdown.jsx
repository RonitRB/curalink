import { useState } from 'react';

/**
 * CitationDropdown — Renders formatted citations in APA, Vancouver, and MLA formats.
 * Appears on PublicationCard to allow one-click citation copying.
 */

const FORMATS = ['APA', 'Vancouver', 'MLA'];

function formatCitation(pub, format) {
  const authors = (pub.authors || []).slice(0, 3);
  const year = pub.year || 'n.d.';
  const title = pub.title || 'Untitled';

  switch (format) {
    case 'APA':
      return `${authors.map((a) => a.split(' ')[0]).join(', ')} ${authors.length > 3 ? 'et al.' : ''} (${year}). ${title}. ${pub.source || 'Unknown Journal'}.`;
    case 'Vancouver':
      return `${authors.map((a) => { const parts = a.split(' '); return parts[0] + ' ' + (parts[1] || '').charAt(0); }).join(', ')}${authors.length > 3 ? ', et al' : ''}. ${title}. ${pub.source || 'Unknown'}. ${year}.`;
    case 'MLA':
      return `${authors[0] || 'Unknown'}${authors.length > 1 ? ', et al' : ''}. "${title}." ${pub.source || 'Unknown Journal'}, ${year}.`;
    default:
      return title;
  }
}

export default function CitationDropdown({ pub }) {
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(null);

  const handleCopy = async (format) => {
    const text = formatCitation(pub, format);
    try {
      await navigator.clipboard.writeText(text);
      setCopied(format);
      setTimeout(() => setCopied(null), 1500);
    } catch (err) {
      console.error('Copy failed:', err);
    }
  };

  return (
    <div className="citation-dropdown-wrap">
      <button
        className="pub-cite-btn"
        onClick={() => setOpen(!open)}
        title="Copy citation"
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ width: 12, height: 12 }}>
          <path d="M6 9l6-6 6 6" />
          <path d="M6 15l6 6 6-6" />
        </svg>
        Cite
      </button>

      {open && (
        <div className="citation-dropdown">
          {FORMATS.map((fmt) => (
            <button
              key={fmt}
              className="citation-option"
              onClick={() => handleCopy(fmt)}
            >
              <span className="citation-format-label">{fmt}</span>
              <span className="citation-preview">
                {formatCitation(pub, fmt).slice(0, 60)}…
              </span>
              {copied === fmt && <span className="citation-copied">✓</span>}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
