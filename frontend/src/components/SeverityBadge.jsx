const severityClass = {
  critical: 'status-critical',
  high: 'status-high',
  medium: 'status-medium',
  safe: 'status-safe'
};

export default function SeverityBadge({ level }) {
  return <span className={`status-badge ${severityClass[level] || 'status-medium'}`}>{level}</span>;
}
