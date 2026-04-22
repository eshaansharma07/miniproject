import { BadgeInfo } from 'lucide-react';
import SeverityBadge from './SeverityBadge';

export default function LiveThreatFeed({ rows }) {
  return (
    <section id="live-threat-feed" className="section-shell">
      <div className="glass-panel overflow-hidden">
        <div className="border-b border-white/60 p-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="section-kicker">Live Threat Feed</p>
              <h2 className="mt-4 text-3xl font-extrabold text-slate-950">Latest network alerts</h2>
            </div>
            <span
              className="info-badge"
              title="Logic: Each row combines timestamp, source, destination, predicted threat type, severity level, and the current response disposition."
              aria-label="Threat feed logic"
            >
              <BadgeInfo size={15} />
              <span className="hidden sm:inline">Logic</span>
            </span>
          </div>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-500">
            A simplified analyst view of recent events, source and destination IPs, threat type, severity, and current response status.
          </p>
        </div>
        <div className="table-wrap">
          <table className="w-full min-w-[760px] text-left text-sm">
            <thead className="bg-white/55 text-xs uppercase tracking-[0.18em] text-slate-400">
              <tr>
                <th className="px-6 py-4">Timestamp</th>
                <th className="px-6 py-4">Source IP</th>
                <th className="px-6 py-4">Destination IP</th>
                <th className="px-6 py-4">Threat Type</th>
                <th className="px-6 py-4">Severity</th>
                <th className="px-6 py-4">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/60 text-slate-700">
              {rows.map((row) => (
                <tr key={`${row.timestamp}-${row.source}`} className="transition hover:bg-white/55">
                  <td className="px-6 py-4 text-slate-500">{row.timestamp}</td>
                  <td className="px-6 py-4 font-mono text-blue-600">{row.source}</td>
                  <td className="px-6 py-4 font-mono text-slate-500">{row.destination}</td>
                  <td className="px-6 py-4 font-semibold text-slate-900">{row.type}</td>
                  <td className="px-6 py-4"><SeverityBadge level={row.severity} /></td>
                  <td className="px-6 py-4 text-slate-500">{row.status}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}
