export default function AlertFeed({ alerts }) {
  return (
    <section className="panel alert-panel">
      <div className="panel-head">
        <h2>Alert Feed</h2>
        <span>High and critical only</span>
      </div>
      <div className="alert-list">
        {alerts.length === 0 && <p className="empty">No alerts yet.</p>}
        {alerts.map((alert) => (
          <article className="alert-item" key={alert.id}>
            <p className="alert-time">{new Date(alert.created_at).toLocaleTimeString()}</p>
            <p>{alert.summary}</p>
            <p className={`badge ${alert.risk_level}`}>{alert.risk_level}</p>
          </article>
        ))}
      </div>
    </section>
  );
}
