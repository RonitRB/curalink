import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';

/**
 * PublicationTimelineChart — Shows year-over-year distribution of retrieved publications.
 */
export function PublicationTimelineChart({ publications }) {
  if (!publications || publications.length === 0) return null;

  // Aggregate by year
  const yearMap = {};
  publications.forEach((p) => {
    const y = p.year || 0;
    if (y > 2000) {
      yearMap[y] = (yearMap[y] || 0) + 1;
    }
  });

  const data = Object.entries(yearMap)
    .map(([year, count]) => ({ year: parseInt(year), count }))
    .sort((a, b) => a.year - b.year)
    .slice(-10); // Last 10 years

  if (data.length < 2) return null;

  return (
    <div className="chart-container">
      <div className="chart-title">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ width: 14, height: 14 }}>
          <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
        </svg>
        Publication Timeline
      </div>
      <ResponsiveContainer width="100%" height={180}>
        <BarChart data={data} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
          <XAxis
            dataKey="year"
            tick={{ fill: '#8e8e93', fontSize: 11 }}
            axisLine={{ stroke: '#22222e' }}
            tickLine={false}
          />
          <YAxis
            tick={{ fill: '#8e8e93', fontSize: 11 }}
            axisLine={false}
            tickLine={false}
            allowDecimals={false}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: '#1a1a24',
              border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: 8,
              fontSize: 12,
              color: '#f5f5f7',
            }}
            formatter={(value) => [`${value} papers`, 'Count']}
            labelFormatter={(label) => `Year ${label}`}
          />
          <Bar dataKey="count" radius={[4, 4, 0, 0]}>
            {data.map((_, i) => (
              <Cell key={i} fill={`hsl(${170 + i * 8}, 60%, 55%)`} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

/**
 * TrialStatusPieChart — Shows the distribution of trial statuses (Recruiting, Completed, etc.).
 */
const STATUS_COLORS = {
  'Recruiting': '#34d399',
  'Active, not recruiting': '#818cf8',
  'Completed': '#38bdf8',
  'Not yet recruiting': '#fbbf24',
  'Terminated': '#ff6b6b',
  'Withdrawn': '#8e8e93',
  'Suspended': '#f472b6',
  'Unknown status': '#48484a',
};

export function TrialStatusPieChart({ trials }) {
  if (!trials || trials.length < 2) return null;

  // Aggregate by status
  const statusMap = {};
  trials.forEach((t) => {
    const s = t.status || 'Unknown';
    statusMap[s] = (statusMap[s] || 0) + 1;
  });

  const data = Object.entries(statusMap)
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value);

  return (
    <div className="chart-container">
      <div className="chart-title">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ width: 14, height: 14 }}>
          <path d="M21.21 15.89A10 10 0 1 1 8 2.83" />
          <path d="M22 12A10 10 0 0 0 12 2v10z" />
        </svg>
        Trial Status Distribution
      </div>
      <ResponsiveContainer width="100%" height={180}>
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            innerRadius={40}
            outerRadius={65}
            paddingAngle={3}
            dataKey="value"
          >
            {data.map((entry, i) => (
              <Cell
                key={i}
                fill={STATUS_COLORS[entry.name] || `hsl(${i * 60}, 50%, 55%)`}
              />
            ))}
          </Pie>
          <Tooltip
            contentStyle={{
              backgroundColor: '#1a1a24',
              border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: 8,
              fontSize: 12,
              color: '#f5f5f7',
            }}
          />
          <Legend
            wrapperStyle={{ fontSize: 11, color: '#d1d1d6' }}
            iconType="circle"
            iconSize={8}
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}
