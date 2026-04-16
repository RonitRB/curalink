import { useState } from 'react';

const EXAMPLE_QUERIES = [
  'Latest treatment for lung cancer',
  'Clinical trials for diabetes',
  'Top researchers in Alzheimer\'s disease',
  'Recent studies on heart disease',
];

/* ── Icons ──────────────────────────────────────────────────── */
function IconArrowUp() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" style={{ width: 18, height: 18 }}>
      <line x1="12" y1="19" x2="12" y2="5" />
      <polyline points="5 12 12 5 19 12" />
    </svg>
  );
}

function IconSearch() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ width: 14, height: 14 }}>
      <circle cx="11" cy="11" r="8" />
      <line x1="21" y1="21" x2="16.65" y2="16.65" />
    </svg>
  );
}

/* ── Form Label with dot ────────────────────────────────────── */
function FieldLabel({ children }) {
  return (
    <label className="form-label">
      <span className="form-label-dot" />
      {children}
    </label>
  );
}

export default function InputPanel({ onSubmit, isLoading, sessionContext }) {
  const [mode, setMode] = useState('structured');
  const [quickText, setQuickText] = useState('');
  const [form, setForm] = useState({
    patientName: sessionContext?.patientName || '',
    disease: sessionContext?.disease || '',
    query: '',
    location: sessionContext?.location || '',
  });

  const handleFormChange = (field, value) =>
    setForm((prev) => ({ ...prev, [field]: value }));

  const handleStructuredSubmit = (e) => {
    e.preventDefault();
    if (!form.query.trim() || isLoading) return;
    onSubmit({
      message: form.query,
      patientName: form.patientName,
      disease: form.disease,
      location: form.location,
    });
    setForm((prev) => ({ ...prev, query: '' }));
  };

  const handleQuickSubmit = (e) => {
    e.preventDefault();
    if (!quickText.trim() || isLoading) return;
    onSubmit({
      message: quickText,
      patientName: sessionContext?.patientName,
      disease: sessionContext?.disease,
      location: sessionContext?.location,
    });
    setQuickText('');
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (mode === 'quick') handleQuickSubmit(e);
    }
  };

  const handleChipClick = (query) => {
    if (mode === 'structured') setForm((prev) => ({ ...prev, query }));
    else setQuickText(query);
  };

  return (
    <div className="input-panel">
      {/* Mode tabs */}
      <div className="input-tabs">
        <button
          className={`input-tab${mode === 'structured' ? ' active' : ''}`}
          onClick={() => setMode('structured')}
        >
          Structured Input
        </button>
        <button
          className={`input-tab${mode === 'quick' ? ' active' : ''}`}
          onClick={() => setMode('quick')}
        >
          Quick Chat
        </button>
      </div>

      {mode === 'structured' ? (
        <form className="structured-form" onSubmit={handleStructuredSubmit}>
          <div className="form-row">
            <div className="form-field">
              <FieldLabel>Patient Name</FieldLabel>
              <input
                id="input-patient-name"
                className="form-input"
                placeholder="e.g. John Smith"
                value={form.patientName}
                onChange={(e) => handleFormChange('patientName', e.target.value)}
              />
            </div>
            <div className="form-field">
              <FieldLabel>Disease / Condition</FieldLabel>
              <input
                id="input-disease"
                className="form-input"
                placeholder="e.g. Parkinson's disease"
                value={form.disease}
                onChange={(e) => handleFormChange('disease', e.target.value)}
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-field" style={{ gridColumn: '1 / -1' }}>
              <FieldLabel>Research Query *</FieldLabel>
              <input
                id="input-query"
                className="form-input"
                placeholder="e.g. Deep Brain Stimulation outcomes in late-stage Parkinson's"
                value={form.query}
                onChange={(e) => handleFormChange('query', e.target.value)}
                required
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-field">
              <FieldLabel>Location (for trial matching)</FieldLabel>
              <input
                id="input-location"
                className="form-input"
                placeholder="e.g. Toronto, Canada"
                value={form.location}
                onChange={(e) => handleFormChange('location', e.target.value)}
              />
            </div>
            <div className="form-field" style={{ justifyContent: 'flex-end', paddingTop: 18 }}>
              <button
                id="btn-submit-research"
                type="submit"
                className="submit-btn"
                disabled={isLoading || !form.query.trim()}
              >
                {isLoading ? (
                  <>
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" style={{ width: 15, height: 15, animation: 'ringRotate 1s linear infinite' }}>
                      <circle cx="12" cy="12" r="9" strokeDasharray="56" strokeDashoffset="14" />
                    </svg>
                    Researching…
                  </>
                ) : (
                  <>
                    <IconSearch />
                    Run Research
                  </>
                )}
              </button>
            </div>
          </div>
        </form>
      ) : (
        <form className="quick-form" onSubmit={handleQuickSubmit}>
          <textarea
            id="input-quick-chat"
            className="quick-input"
            placeholder={
              sessionContext?.disease
                ? `Ask a follow-up about ${sessionContext.disease}…`
                : 'Ask anything, e.g. "Latest treatment for lung cancer"'
            }
            value={quickText}
            onChange={(e) => setQuickText(e.target.value)}
            onKeyDown={handleKeyDown}
            rows={1}
            style={{ height: 46, lineHeight: '22px' }}
          />
          <button
            id="btn-send-quick"
            type="submit"
            className="send-btn"
            disabled={isLoading || !quickText.trim()}
            title="Send"
          >
            <IconArrowUp />
          </button>
        </form>
      )}

      <div className="input-hint">
        Try:{' '}
        {EXAMPLE_QUERIES.slice(0, 2).map((q, i) => (
          <span key={i}>
            <span
              style={{ color: 'var(--p)', cursor: 'pointer', fontSize: 11, fontWeight: 500 }}
              onClick={() => handleChipClick(q)}
            >
              "{q}"
            </span>
            {i < 1 && <span style={{ color: 'var(--t4)' }}> · </span>}
          </span>
        ))}
      </div>
    </div>
  );
}
