export default function RiskGauge({ value }) {
  const angle = Math.min(100, Math.max(0, value)) * 1.8;
  const posture = value >= 80 ? 'Critical posture' : value >= 60 ? 'High vigilance' : value >= 35 ? 'Elevated watch' : 'Stable posture';

  return (
    <section className="panel gauge-panel">
      <div className="panel-head">
        <h2>Current Threat Index</h2>
        <span>{posture}</span>
      </div>
      <div className="gauge-wrap">
        <div className="gauge-arc" />
        <div className="gauge-needle" style={{ transform: `rotate(${angle}deg)` }} />
        <div className="gauge-center" />
      </div>
      <p className="gauge-score">{value.toFixed(1)} / 100</p>
      <div className="threat-scale">
        <span>Low</span>
        <span>Moderate</span>
        <span>Critical</span>
      </div>
    </section>
  );
}
