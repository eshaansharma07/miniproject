import SeverityBadge from './SeverityBadge';

export default function LiveThreatFeed({ rows }) {
  return (
    <section id="live-threat-feed" className="section-shell">
      <div className="glass-card overflow-hidden">
        <div className="border-b border-white/10 p-6">
          <p className="eyebrow">Live Threat Feed</p>
          <h2 className="mt-4 text-3xl font-bold text-white">Latest Network Alerts</h2>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-300">
            A simplified analyst view of recent events, source and destination IPs, threat type, severity, and current response status.
          </p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[760px] text-left text-sm">
            <thead className="bg-white/[0.04] text-xs uppercase tracking-[0.18em] text-slate-400">
              <tr>
                <th className="px-6 py-4">Timestamp</th>
                <th className="px-6 py-4">Source IP</th>
                <th className="px-6 py-4">Destination IP</th>
                <th className="px-6 py-4">Threat Type</th>
                <th className="px-6 py-4">Severity</th>
                <th className="px-6 py-4">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/10 text-slate-200">
              {rows.map((row) => (
                <tr key={`${row.timestamp}-${row.source}`} className="transition hover:bg-white/[0.04]">
                  <td className="px-6 py-4 text-slate-300">{row.timestamp}</td>
                  <td className="px-6 py-4 font-mono text-orange-100">{row.source}</td>
                  <td className="px-6 py-4 font-mono text-slate-300">{row.destination}</td>
                  <td className="px-6 py-4 font-semibold text-white">{row.type}</td>
                  <td className="px-6 py-4"><SeverityBadge level={row.severity} /></td>
                  <td className="px-6 py-4 text-slate-300">{row.status}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}
