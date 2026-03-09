export default function MetricCard({ label, value, accent = 'neutral' }) {
  return (
    <article className={`metric-card ${accent}`}>
      <p>{label}</p>
      <h3>{value}</h3>
    </article>
  );
}
