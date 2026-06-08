import { useState, useEffect } from 'react';

const CONSENT_KEY = 'curalink_cookie_consent';

export default function CookieConsent() {
  const [visible, setVisible] = useState(false);
  const [showDetails, setShowDetails] = useState(false);

  useEffect(() => {
    // Check if consent has already been given
    const consent = localStorage.getItem(CONSENT_KEY);
    if (!consent) {
      // Small delay for smoother UX — don't flash immediately on load
      const timer = setTimeout(() => setVisible(true), 1500);
      return () => clearTimeout(timer);
    }
  }, []);

  const handleAccept = () => {
    localStorage.setItem(CONSENT_KEY, JSON.stringify({ accepted: true, timestamp: new Date().toISOString() }));
    setVisible(false);
  };

  const handleDecline = () => {
    localStorage.setItem(CONSENT_KEY, JSON.stringify({ accepted: false, timestamp: new Date().toISOString() }));
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <div className="cookie-banner" role="dialog" aria-label="Cookie consent" aria-live="polite">
      <div className="cookie-banner-inner">
        <div className="cookie-banner-content">
          <div className="cookie-banner-icon">🔒</div>
          <div className="cookie-banner-text">
            <p className="cookie-banner-title">Your Privacy Matters</p>
            <p className="cookie-banner-desc">
              Curalink uses browser localStorage to keep you logged in and remember your preferences.
              We do <strong>not</strong> use tracking cookies or third-party analytics.
            </p>

            {showDetails && (
              <div className="cookie-banner-details">
                <p><strong>What we store:</strong></p>
                <ul>
                  <li><strong>Authentication token</strong> (essential) — keeps you logged in securely</li>
                  <li><strong>Consent preference</strong> (essential) — remembers this choice</li>
                </ul>
                <p>
                  This is in compliance with the <strong>Digital Personal Data Protection Act, 2023</strong> (DPDPA)
                  and the <strong>Information Technology Act, 2000</strong> of India.
                </p>
                <p>
                  Read our full <a href="/#/privacy" className="cookie-link">Privacy Policy</a> for more details.
                </p>
              </div>
            )}

            <button
              className="cookie-details-toggle"
              onClick={() => setShowDetails(!showDetails)}
              aria-expanded={showDetails}
            >
              {showDetails ? 'Show less' : 'Learn more'}
            </button>
          </div>
        </div>

        <div className="cookie-banner-actions">
          <button className="cookie-btn cookie-btn-decline" onClick={handleDecline}>
            Decline Non-Essential
          </button>
          <button className="cookie-btn cookie-btn-accept" onClick={handleAccept}>
            Accept All
          </button>
        </div>
      </div>
    </div>
  );
}

/**
 * Utility: Check if user has accepted cookies.
 * @returns {boolean}
 */
export function hasAcceptedCookies() {
  try {
    const consent = localStorage.getItem(CONSENT_KEY);
    if (!consent) return false;
    const parsed = JSON.parse(consent);
    return parsed.accepted === true;
  } catch {
    return false;
  }
}
