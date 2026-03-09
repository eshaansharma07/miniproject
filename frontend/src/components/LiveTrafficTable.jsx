function badge(level) {
  return <span className={`badge ${level}`}>{level}</span>;
}

export default function LiveTrafficTable({ events }) {
  return (
    <section className="panel table-panel">
      <div className="panel-head">
        <h2>Live Scored Traffic</h2>
        <span>{events.length} recent events</span>
      </div>
      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Source</th>
              <th>Destination</th>
              <th>Protocol</th>
              <th>Score</th>
              <th>Risk</th>
            </tr>
          </thead>
          <tbody>
            {events.map((event, idx) => (
              <tr key={`${event.src_ip}-${idx}`}>
                <td>{event.src_ip}:{event.src_port}</td>
                <td>{event.dst_ip}:{event.dst_port}</td>
                <td>{event.protocol.toUpperCase()}</td>
                <td>{(event.score * 100).toFixed(1)}%</td>
                <td>{badge(event.risk_level)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
