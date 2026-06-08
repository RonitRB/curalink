import { useState, useEffect } from 'react';
import { sessionsAPI } from '../api';
import { useAuth } from '../contexts/AuthContext';

/* ── Color palette for charts ──────────────────────────────── */
const COLORS = [
  '#2dd4bf', '#818cf8', '#f472b6', '#38bdf8', '#fbbf24',
  '#34d399', '#fb923c', '#a78bfa',
];

export default function AnalyticsDashboard({ onClose }) {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await sessionsAPI.getStats();
        setStats(res.data);
      } catch (err) {
        console.error('Failed to load stats:', err);
      }
      setLoading(false);
    };
    fetchStats();
  }, []);

  if (loading) {
    return (
      <div className="dashboard">
        <div className="dashboard-header">
          <h2 className="dashboard-title">Analytics Dashboard</h2>
          <button className="dashboard-close" onClick={onClose}>✕</button>
        </div>
        <div className="dashboard-loading">
          <div className="typing-dots">
            <div className="typing-dot" />
            <div className="typing-dot" />
            <div className="typing-dot" />
          </div>
          <span>Loading analytics...</span>
        </div>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="dashboard">
        <div className="dashboard-header">
          <h2 className="dashboard-title">Analytics Dashboard</h2>
          <button className="dashboard-close" onClick={onClose}>✕</button>
        </div>
        <div className="dashboard-empty">No data available yet. Start researching!</div>
      </div>
    );
  }

  const maxActivity = Math.max(...stats.activity.map((a) => a.count), 1);
  const maxDisease = stats.topDiseases.length > 0 ? stats.topDiseases[0].count : 1;

  return (
    <div className="dashboard">
      <div className="dashboard-header">
        <div>
          <h2 className="dashboard-title">Analytics Dashboard</h2>
          <p className="dashboard-subtitle">
            Welcome back, {user?.name || 'Researcher'}
          </p>
        </div>
        <button className="dashboard-close" onClick={onClose}>✕</button>
      </div>

      {/* Stats cards */}
      <div className="dashboard-stats">
        <div className="stat-card">
          <div className="stat-icon" style={{ background: 'var(--p-bg)', color: 'var(--p)' }}>🧬</div>
          <div className="stat-info">
            <div className="stat-value">{stats.totalSessions}</div>
            <div className="stat-label">Research Sessions</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon" style={{ background: 'var(--sec-bg)', color: 'var(--sec)' }}>💬</div>
          <div className="stat-info">
            <div className="stat-value">{stats.totalMessages}</div>
            <div className="stat-label">Messages</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon" style={{ background: 'var(--pubmed-bg)', color: 'var(--pubmed)' }}>📊</div>
          <div className="stat-info">
            <div className="stat-value">{stats.topDiseases.length}</div>
            <div className="stat-label">Conditions Researched</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon" style={{ background: 'var(--ok-bg)', color: 'var(--ok)' }}>📅</div>
          <div className="stat-info">
            <div className="stat-value">
              {new Date(stats.memberSince).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
            </div>
            <div className="stat-label">Member Since</div>
          </div>
        </div>
      </div>

      {/* Activity heatmap */}
      <div className="dashboard-section">
        <h3 className="dashboard-section-title">Research Activity (Last 30 Days)</h3>
        <div className="activity-chart">
          {stats.activity.map((day, i) => (
            <div key={i} className="activity-bar-wrap" title={`${day.date}: ${day.count} session(s)`}>
              <div
                className="activity-bar"
                style={{
                  height: `${Math.max((day.count / maxActivity) * 100, 4)}%`,
                  background: day.count > 0
                    ? `linear-gradient(180deg, var(--p) 0%, var(--sec-dim) 100%)`
                    : 'var(--b1)',
                  opacity: day.count > 0 ? 0.7 + (day.count / maxActivity) * 0.3 : 0.3,
                }}
              />
              {i % 7 === 0 && (
                <span className="activity-label">
                  {new Date(day.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                </span>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Top diseases */}
      {stats.topDiseases.length > 0 && (
        <div className="dashboard-section">
          <h3 className="dashboard-section-title">Top Researched Conditions</h3>
          <div className="disease-chart">
            {stats.topDiseases.map((d, i) => (
              <div key={i} className="disease-row">
                <span className="disease-name">{d.name}</span>
                <div className="disease-bar-track">
                  <div
                    className="disease-bar-fill"
                    style={{
                      width: `${(d.count / maxDisease) * 100}%`,
                      background: COLORS[i % COLORS.length],
                    }}
                  />
                </div>
                <span className="disease-count">{d.count}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
