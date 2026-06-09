import { useState, useRef, useEffect } from 'react';
import axios from 'axios';

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

function IconMic({ active }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke={active ? 'var(--err)' : 'currentColor'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ width: 16, height: 16 }}>
      <path d="M12 1a3 3 0 00-3 3v8a3 3 0 006 0V4a3 3 0 00-3-3z" />
      <path d="M19 10v2a7 7 0 01-14 0v-2" />
      <line x1="12" y1="19" x2="12" y2="23" />
      <line x1="8" y1="23" x2="16" y2="23" />
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
    age: sessionContext?.age || '',
    gender: sessionContext?.gender || '',
  });
  const [isListening, setIsListening] = useState(false);
  const [medications, setMedications] = useState([]);
  const [medInput, setMedInput] = useState('');
  const [language, setLanguage] = useState('English');
  const [uploadedDoc, setUploadedDoc] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const recognitionRef = useRef(null);
  const fileInputRef = useRef(null);

  // Sync session context when it changes
  useEffect(() => {
    setForm((prev) => ({
      ...prev,
      patientName: sessionContext?.patientName || prev.patientName,
      disease: sessionContext?.disease || prev.disease,
      location: sessionContext?.location || prev.location,
      age: sessionContext?.age || prev.age,
      gender: sessionContext?.gender || prev.gender,
    }));
  }, [sessionContext]);

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
      age: form.age,
      gender: form.gender,
      medications,
      documentContext: uploadedDoc?.text || '',
      language,
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
      age: sessionContext?.age,
      gender: sessionContext?.gender,
      medications,
      documentContext: uploadedDoc?.text || '',
      language,
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

  // ── Voice Input (Web Speech API) ─────────────────────────
  const startVoice = () => {
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      alert('Voice input is not supported in this browser. Please use Chrome.');
      return;
    }

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    const recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = 'en-US';

    recognition.onresult = (event) => {
      const transcript = event.results[0][0].transcript;
      if (mode === 'structured') {
        setForm((prev) => ({ ...prev, query: prev.query + transcript }));
      } else {
        setQuickText((prev) => prev + transcript);
      }
    };

    recognition.onend = () => setIsListening(false);
    recognition.onerror = () => setIsListening(false);

    recognitionRef.current = recognition;
    recognition.start();
    setIsListening(true);
  };

  const stopVoice = () => {
    recognitionRef.current?.stop();
    setIsListening(false);
  };

  // ── Medication tag management ────────────────────────────
  const addMedication = () => {
    const med = medInput.trim();
    if (med && !medications.includes(med) && medications.length < 10) {
      setMedications((prev) => [...prev, med]);
      setMedInput('');
    }
  };

  const removeMedication = (idx) => {
    setMedications((prev) => prev.filter((_, i) => i !== idx));
  };

  const handleMedKeyDown = (e) => {
    if (e.key === 'Enter') { e.preventDefault(); addMedication(); }
  };

  // ── File upload handler ──────────────────────────────────
  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);

      const token = localStorage.getItem('supabase_token') || '';
      const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
      const res = await axios.post(`${baseUrl}/upload`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
          Authorization: token ? `Bearer ${token}` : '',
        },
        timeout: 30000,
      });

      if (res.data?.extractedText) {
        setUploadedDoc({ name: file.name, text: res.data.extractedText, chars: res.data.charCount });
      }
    } catch (err) {
      console.error('Upload failed:', err);
      alert(err.response?.data?.error || 'File upload failed.');
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const queryLength = mode === 'structured' ? form.query.length : quickText.length;

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
              <div className="input-with-mic">
                <input
                  id="input-query"
                  className="form-input"
                  placeholder="e.g. Deep Brain Stimulation outcomes in late-stage Parkinson's"
                  value={form.query}
                  onChange={(e) => handleFormChange('query', e.target.value)}
                  required
                />
                <button
                  type="button"
                  className={`voice-btn ${isListening ? 'listening' : ''}`}
                  onClick={isListening ? stopVoice : startVoice}
                  title={isListening ? 'Stop listening' : 'Voice input'}
                >
                  <IconMic active={isListening} />
                </button>
              </div>
              {queryLength > 0 && (
                <span className="char-count">{queryLength} characters</span>
              )}
            </div>
          </div>

          <div className="form-row form-row-3">
            <div className="form-field">
              <FieldLabel>Location</FieldLabel>
              <input
                id="input-location"
                className="form-input"
                placeholder="e.g. Toronto, Canada"
                value={form.location}
                onChange={(e) => handleFormChange('location', e.target.value)}
              />
            </div>
            <div className="form-field">
              <FieldLabel>Age</FieldLabel>
              <input
                id="input-age"
                className="form-input"
                placeholder="e.g. 45"
                value={form.age}
                onChange={(e) => handleFormChange('age', e.target.value)}
              />
            </div>
            <div className="form-field">
              <FieldLabel>Gender</FieldLabel>
              <select
                id="input-gender"
                className="form-input"
                value={form.gender}
                onChange={(e) => handleFormChange('gender', e.target.value)}
              >
                <option value="">Not specified</option>
                <option value="Male">Male</option>
                <option value="Female">Female</option>
                <option value="Other">Other</option>
              </select>
            </div>
          </div>

          {/* Medications tag input */}
          <div className="form-row">
            <div className="form-field" style={{ gridColumn: '1 / -1' }}>
              <FieldLabel>Current Medications</FieldLabel>
              <div className="med-tag-input">
                {medications.map((med, i) => (
                  <span key={i} className="med-tag">
                    {med}
                    <button type="button" className="med-tag-x" onClick={() => removeMedication(i)}>×</button>
                  </span>
                ))}
                <input
                  className="med-tag-field"
                  placeholder={medications.length === 0 ? 'e.g. Metformin, Lisinopril (press Enter to add)' : 'Add more…'}
                  value={medInput}
                  onChange={(e) => setMedInput(e.target.value)}
                  onKeyDown={handleMedKeyDown}
                  onBlur={addMedication}
                />
              </div>
            </div>
          </div>

          {/* Language selector + File upload */}
          <div className="form-row">
            <div className="form-field">
              <FieldLabel>Response Language</FieldLabel>
              <select
                id="input-language"
                className="form-input"
                value={language}
                onChange={(e) => setLanguage(e.target.value)}
              >
                <option value="English">English</option>
                <option value="Spanish">Español</option>
                <option value="French">Français</option>
                <option value="Hindi">हिन्दी</option>
                <option value="German">Deutsch</option>
                <option value="Portuguese">Português</option>
                <option value="Chinese">中文</option>
                <option value="Japanese">日本語</option>
                <option value="Arabic">العربية</option>
              </select>
            </div>
            <div className="form-field">
              <FieldLabel>Upload Medical Document</FieldLabel>
              <div className="file-upload-zone" onClick={() => fileInputRef.current?.click()}>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".pdf,.txt,.jpg,.jpeg,.png"
                  onChange={handleFileUpload}
                  style={{ display: 'none' }}
                />
                {isUploading ? (
                  <span className="upload-status">Processing…</span>
                ) : uploadedDoc ? (
                  <span className="upload-status upload-done">
                    ✓ {uploadedDoc.name} ({uploadedDoc.chars} chars)
                    <button type="button" className="upload-clear" onClick={(e) => { e.stopPropagation(); setUploadedDoc(null); }}>✕</button>
                  </span>
                ) : (
                  <span className="upload-placeholder">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ width: 14, height: 14 }}>
                      <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" />
                      <polyline points="17 8 12 3 7 8" />
                      <line x1="12" y1="3" x2="12" y2="15" />
                    </svg>
                    PDF, TXT, or Image
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="form-row" style={{ justifyContent: 'flex-end' }}>
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
        </form>
      ) : (
        <form className="quick-form" onSubmit={handleQuickSubmit}>
          <div className="quick-input-wrap">
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
              type="button"
              className={`voice-btn voice-btn-quick ${isListening ? 'listening' : ''}`}
              onClick={isListening ? stopVoice : startVoice}
              title={isListening ? 'Stop listening' : 'Voice input'}
            >
              <IconMic active={isListening} />
            </button>
          </div>
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
