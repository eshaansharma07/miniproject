export default function ChartCard({ title, subtitle, children }) {
  return (
    <article className="glass-card p-5">
      <div className="mb-5">
        <h3 className="text-lg font-bold text-white">{title}</h3>
        {subtitle ? <p className="mt-1 text-sm text-slate-400">{subtitle}</p> : null}
      </div>
      <div className="h-72">{children}</div>
    </article>
  );
}
