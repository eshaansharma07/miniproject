export default function MetricCard({ label, value, accent = 'neutral', subtext }) {
  return (
    <article className={`metric-card ${accent}`}>
      <p>{label}</p>
      <h3>{value}</h3>
      {subtext ? <span>{subtext}</span> : null}
    </article>
  );
}
