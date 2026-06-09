import { useState } from 'react';
import { sessionsAPI } from '../api';

export default function ShareSessionBtn({ sessionId }) {
  const [isSharing, setIsSharing] = useState(false);
  const [shareUrl, setShareUrl] = useState(null);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState(null);

  const handleShare = async () => {
    setIsSharing(true);
    setError(null);
    try {
      const res = await sessionsAPI.share(sessionId);
      setShareUrl(res.data.shareUrl);
    } catch (err) {
      console.error('Failed to generate share link:', err);
      setError('Failed to create share link.');
    } finally {
      setIsSharing(false);
    }
  };

  const handleCopy = async () => {
    if (!shareUrl) return;
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Copy failed:', err);
    }
  };

  return (
    <div className="share-session-wrap">
      {shareUrl ? (
        <div className="share-session-result">
          <input
            type="text"
            className="share-session-input"
            value={shareUrl}
            readOnly
            onClick={(e) => e.target.select()}
          />
          <button className="share-session-copy" onClick={handleCopy}>
            {copied ? 'Copied!' : 'Copy Link'}
          </button>
        </div>
      ) : (
        <button
          className="share-session-btn"
          onClick={handleShare}
          disabled={isSharing || !sessionId}
          title="Create a public read-only link for this session"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ width: 14, height: 14 }}>
            <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8" />
            <polyline points="16 6 12 2 8 6" />
            <line x1="12" y1="2" x2="12" y2="15" />
          </svg>
          {isSharing ? 'Generating...' : 'Share Session'}
        </button>
      )}
      {error && <div className="share-session-error">{error}</div>}
    </div>
  );
}
