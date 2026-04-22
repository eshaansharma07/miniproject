import { BadgeInfo } from 'lucide-react';

export default function ChartCard({ title, subtitle, children, info }) {
  return (
    <article className="glass-panel p-5">
      <div className="mb-5 flex items-start justify-between gap-4">
        <div>
          <h3 className="text-lg font-extrabold text-slate-950">{title}</h3>
          {subtitle ? <p className="mt-1 text-sm text-slate-500">{subtitle}</p> : null}
        </div>
        {info ? (
          <span className="info-badge" title={info} aria-label={info}>
            <BadgeInfo size={14} />
            <span className="hidden sm:inline">Logic</span>
          </span>
        ) : null}
      </div>
      <div className="h-72">{children}</div>
    </article>
  );
}
