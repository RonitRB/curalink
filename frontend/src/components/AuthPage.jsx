import { useState } from 'react';
import { useAuth } from '../context/AuthContext';

/* ── SVG Icons ──────────────────────────────────────────────── */
function IconDNA() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 2C6.5 5 6 9 6 12C6 15 6.5 19 12 22" />
      <path d="M12 2C17.5 5 18 9 18 12C18 15 17.5 19 12 22" />
      <path d="M6.5 7.5C8.5 7 11 6.8 13.5 7.5" />
      <path d="M6.5 16.5C8.5 16 11 15.8 13.5 16.5" />
    </svg>
  );
}

function IconMail() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="4" width="20" height="16" rx="2" />
      <polyline points="2,4 12,13 22,4" />
    </svg>
  );
}

function IconLock() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="11" width="18" height="11" rx="2" />
      <path d="M7 11V7a5 5 0 0 1 10 0v4" />
    </svg>
  );
}

function IconUser() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="8" r="4" />
      <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" />
    </svg>
  );
}

function IconEye({ show }) {
  return show ? (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  ) : (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" />
      <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" />
      <line x1="1" y1="1" x2="23" y2="23" />
    </svg>
  );
}

function FloatingOrb({ style }) {
  return <div className="auth-orb" style={style} />;
}

export default function AuthPage() {
  const { login, register } = useAuth();
  const [tab, setTab] = useState('login'); // 'login' | 'signup'
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState({});

  const resetForm = () => {
    setName(''); setEmail(''); setPassword('');
    setError(''); setFieldErrors({});
  };

  const switchTab = (t) => { setTab(t); resetForm(); };

  const validate = () => {
    const errs = {};
    if (tab === 'signup' && !name.trim()) errs.name = 'Full name is required.';
    if (!email.trim()) errs.email = 'Email is required.';
    else if (!/\S+@\S+\.\S+/.test(email)) errs.email = 'Enter a valid email address.';
    if (!password) errs.password = 'Password is required.';
    else if (password.length < 6) errs.password = 'Password must be at least 6 characters.';
    return errs;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    const errs = validate();
    if (Object.keys(errs).length) { setFieldErrors(errs); return; }
    setFieldErrors({});
    setLoading(true);
    try {
      if (tab === 'login') {
        await login(email.trim(), password);
      } else {
        await register(name.trim(), email.trim(), password);
      }
    } catch (err) {
      const serverMsg = err.response?.data?.error || '';
      if (err.response?.status === 503 || serverMsg.toLowerCase().includes('database')) {
        setError('Server is starting up or database is not connected. Please wait a few seconds and try again.');
      } else if (!err.response) {
        setError('Cannot reach the server. Make sure the backend is running on port 5000.');
      } else {
        setError(serverMsg || 'Something went wrong. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const isLogin = tab === 'login';

  return (
    <div className="auth-bg">
      {/* Ambient orbs */}
      <FloatingOrb style={{ width: 480, height: 480, top: '-120px', left: '-120px', background: 'radial-gradient(circle, rgba(45,212,191,0.12) 0%, transparent 70%)' }} />
      <FloatingOrb style={{ width: 560, height: 560, bottom: '-160px', right: '-160px', background: 'radial-gradient(circle, rgba(129,140,248,0.10) 0%, transparent 70%)' }} />
      <FloatingOrb style={{ width: 320, height: 320, top: '40%', left: '60%', background: 'radial-gradient(circle, rgba(45,212,191,0.06) 0%, transparent 70%)' }} />

      <div className="auth-card" role="main">
        {/* Header */}
        <div className="auth-card-header">
          <div className="auth-logo">
            <div className="auth-logo-icon">
              <IconDNA />
            </div>
            <div>
              <div className="auth-logo-name">Curalink</div>
              <div className="auth-logo-tagline">AI Medical Research</div>
            </div>
          </div>

          <div className="auth-tabs">
            <button
              className={`auth-tab${isLogin ? ' active' : ''}`}
              onClick={() => switchTab('login')}
              id="btn-tab-login"
            >
              Sign In
            </button>
            <button
              className={`auth-tab${!isLogin ? ' active' : ''}`}
              onClick={() => switchTab('signup')}
              id="btn-tab-signup"
            >
              Sign Up
            </button>
            <div className="auth-tab-indicator" style={{ transform: isLogin ? 'translateX(0)' : 'translateX(100%)' }} />
          </div>
        </div>

        {/* Body */}
        <div className="auth-card-body">
          <div className="auth-card-title">
            {isLogin ? 'Welcome back' : 'Create your account'}
            <span className="auth-card-title-dot" />
          </div>
          <div className="auth-card-sub">
            {isLogin
              ? 'Sign in to access your private research sessions.'
              : 'Join Curalink to start AI-powered medical research.'}
          </div>

          {error && (
            <div className="auth-error" role="alert">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ width: 15, height: 15, flexShrink: 0 }}>
                <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} noValidate autoComplete="off">
            {/* Name — signup only */}
            {!isLogin && (
              <div className={`auth-field${fieldErrors.name ? ' has-error' : ''}`}>
                <label className="auth-label" htmlFor="auth-name">Full Name</label>
                <div className="auth-input-wrap">
                  <span className="auth-input-icon"><IconUser /></span>
                  <input
                    id="auth-name"
                    type="text"
                    className="auth-input"
                    placeholder="Dr. Jane Smith"
                    value={name}
                    onChange={(e) => { setName(e.target.value); setFieldErrors(p => ({ ...p, name: '' })); }}
                    disabled={loading}
                    autoComplete="name"
                  />
                </div>
                {fieldErrors.name && <span className="auth-field-error">{fieldErrors.name}</span>}
              </div>
            )}

            {/* Email */}
            <div className={`auth-field${fieldErrors.email ? ' has-error' : ''}`}>
              <label className="auth-label" htmlFor="auth-email">Email Address</label>
              <div className="auth-input-wrap">
                <span className="auth-input-icon"><IconMail /></span>
                <input
                  id="auth-email"
                  type="email"
                  className="auth-input"
                  placeholder="doctor@hospital.com"
                  value={email}
                  onChange={(e) => { setEmail(e.target.value); setFieldErrors(p => ({ ...p, email: '' })); }}
                  disabled={loading}
                  autoComplete="email"
                />
              </div>
              {fieldErrors.email && <span className="auth-field-error">{fieldErrors.email}</span>}
            </div>

            {/* Password */}
            <div className={`auth-field${fieldErrors.password ? ' has-error' : ''}`}>
              <label className="auth-label" htmlFor="auth-password">Password</label>
              <div className="auth-input-wrap">
                <span className="auth-input-icon"><IconLock /></span>
                <input
                  id="auth-password"
                  type={showPass ? 'text' : 'password'}
                  className="auth-input auth-input-password"
                  placeholder={isLogin ? 'Your password' : 'Min. 6 characters'}
                  value={password}
                  onChange={(e) => { setPassword(e.target.value); setFieldErrors(p => ({ ...p, password: '' })); }}
                  disabled={loading}
                  autoComplete={isLogin ? 'current-password' : 'new-password'}
                />
                <button
                  type="button"
                  className="auth-eye-btn"
                  onClick={() => setShowPass(p => !p)}
                  tabIndex={-1}
                  aria-label={showPass ? 'Hide password' : 'Show password'}
                >
                  <IconEye show={showPass} />
                </button>
              </div>
              {fieldErrors.password && <span className="auth-field-error">{fieldErrors.password}</span>}
            </div>

            <button
              type="submit"
              className="auth-submit-btn"
              id={isLogin ? 'btn-login-submit' : 'btn-signup-submit'}
              disabled={loading}
            >
              {loading ? (
                <span className="auth-spinner" />
              ) : (
                <>
                  {isLogin ? 'Sign In to Curalink' : 'Create Account'}
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ width: 16, height: 16 }}>
                    <line x1="5" y1="12" x2="19" y2="12" /><polyline points="12 5 19 12 12 19" />
                  </svg>
                </>
              )}
            </button>
          </form>

          <div className="auth-switch">
            {isLogin ? "Don't have an account?" : 'Already have an account?'}
            {' '}
            <button
              className="auth-switch-link"
              onClick={() => switchTab(isLogin ? 'signup' : 'login')}
              id={isLogin ? 'btn-go-signup' : 'btn-go-login'}
            >
              {isLogin ? 'Sign Up' : 'Sign In'}
            </button>
          </div>
        </div>

        {/* Footer */}
        <div className="auth-card-footer">
          <div className="auth-footer-badges">
            <span className="auth-badge"><span className="auth-badge-dot" />HIPAA-Ready</span>
            <span className="auth-badge"><span className="auth-badge-dot" style={{ background: 'var(--sec)' }} />PubMed</span>
            <span className="auth-badge"><span className="auth-badge-dot" style={{ background: 'var(--amber)' }} />ClinicalTrials</span>
          </div>
        </div>
      </div>
    </div>
  );
}
