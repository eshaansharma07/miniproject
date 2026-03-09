export default function RiskGauge({ value }) {
  const angle = Math.min(100, Math.max(0, value)) * 1.8;

  return (
    <section className="panel gauge-panel">
      <h2>Current Threat Index</h2>
      <div className="gauge-wrap">
        <div className="gauge-arc" />
        <div className="gauge-needle" style={{ transform: `rotate(${angle}deg)` }} />
        <div className="gauge-center" />
      </div>
      <p className="gauge-score">{value.toFixed(1)} / 100</p>
    </section>
  );
}
