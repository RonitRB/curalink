export default function TrialCard({ trial }) {
  const statusClass =
    trial.status === 'RECRUITING' ? 'recruiting'
    : trial.status === 'COMPLETED' ? 'completed'
    : 'other';

  return (
    <div className="trial-card">
      <div className="trial-header">
        <div className="trial-title">{trial.title}</div>
        <span className={`trial-status-badge ${statusClass}`}>{trial.status}</span>
      </div>

      {trial.briefSummary && (
        <div className="trial-summary">{trial.briefSummary}</div>
      )}

      <div className="trial-meta">
        {trial.location && trial.location !== 'Not specified' && (
          <div className="trial-meta-item">
            <span className="trial-meta-icon">📍</span>
            <span>{trial.location}</span>
          </div>
        )}
        {(trial.minAge || trial.maxAge) && (
          <div className="trial-meta-item">
            <span className="trial-meta-icon">👤</span>
            <span>
              {trial.minAge && trial.maxAge
                ? `${trial.minAge} – ${trial.maxAge}`
                : trial.minAge || trial.maxAge}
            </span>
          </div>
        )}
        {trial.contactInfo && trial.contactInfo !== 'Not available' && (
          <div className="trial-meta-item">
            <span className="trial-meta-icon">📬</span>
            <span style={{ fontSize: 11 }}>{trial.contactInfo}</span>
          </div>
        )}
        {trial.url && (
          <a href={trial.url} target="_blank" rel="noopener noreferrer" className="pub-link" style={{ marginTop: 0 }}>
            View Trial →
          </a>
        )}
      </div>
    </div>
  );
}
