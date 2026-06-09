import { useState, useEffect } from 'react';
import { alertsAPI } from '../api';

export default function AlertsPanel({ onClose }) {
  const [alerts, setAlerts] = useState([]);
  const [disease, setDisease] = useState('');
  const [query, setQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);

  const fetchAlerts = async () => {
    try {
      setIsLoading(true);
      const res = await alertsAPI.getAll();
      setAlerts(res.data || []);
    } catch (err) {
      console.error('Failed to load alerts:', err);
      setError('Failed to load alerts.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAlerts();
  }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!disease.trim()) return;
    setIsSubmitting(true);
    setError(null);

    try {
      const res = await alertsAPI.create({ disease, query });
      setAlerts((prev) => [res.data, ...prev]);
      setDisease('');
      setQuery('');
    } catch (err) {
      console.error('Failed to create alert:', err);
      setError(err.response?.data?.error || 'Failed to create alert.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleToggle = async (id, currentStatus) => {
    try {
      await alertsAPI.toggle(id, !currentStatus);
      setAlerts((prev) =>
        prev.map((a) => (a.id === id ? { ...a, is_active: !currentStatus } : a))
      );
    } catch (err) {
      console.error('Toggle failed:', err);
    }
  };

  const handleDelete = async (id) => {
    try {
      await alertsAPI.delete(id);
      setAlerts((prev) => prev.filter((a) => a.id !== id));
    } catch (err) {
      console.error('Delete failed:', err);
    }
  };

  return (
    <div className="alerts-panel">
      <div className="alerts-header">
        <div className="alerts-title">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ width: 18, height: 18, color: 'var(--p)' }}>
            <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
            <path d="M13.73 21a2 2 0 0 1-3.46 0" />
          </svg>
          Research Alerts
        </div>
        <button className="alerts-close" onClick={onClose} title="Close">✕</button>
      </div>

      <div className="alerts-content">
        <div className="alerts-desc">
          Get weekly email digests with the latest clinical trials and research publications for conditions you care about.
        </div>

        <form className="alert-form" onSubmit={handleCreate}>
          <div className="form-row">
            <div className="form-field" style={{ flex: 1 }}>
              <input
                className="form-input"
                placeholder="Condition (e.g., Triple-Negative Breast Cancer)"
                value={disease}
                onChange={(e) => setDisease(e.target.value)}
                required
              />
            </div>
            <button className="submit-btn" type="submit" disabled={isSubmitting || !disease.trim()}>
              {isSubmitting ? 'Adding...' : 'Add Alert'}
            </button>
          </div>
          {error && <div className="alert-error">{error}</div>}
        </form>

        <div className="alerts-list">
          {isLoading ? (
            <div className="alerts-loading">Loading your alerts...</div>
          ) : alerts.length === 0 ? (
            <div className="alerts-empty">
              You haven't set up any research alerts yet.
            </div>
          ) : (
            alerts.map((alert) => (
              <div key={alert.id} className={`alert-card ${!alert.is_active ? 'inactive' : ''}`}>
                <div className="alert-info">
                  <div className="alert-disease">{alert.disease}</div>
                  <div className="alert-meta">Weekly digest • {alert.query}</div>
                </div>
                <div className="alert-actions">
                  <label className="alert-toggle">
                    <input
                      type="checkbox"
                      checked={alert.is_active}
                      onChange={() => handleToggle(alert.id, alert.is_active)}
                    />
                    <span className="alert-slider"></span>
                  </label>
                  <button className="alert-delete" onClick={() => handleDelete(alert.id)} title="Delete alert">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ width: 14, height: 14 }}>
                      <path d="M3 6h18" />
                      <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                    </svg>
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
