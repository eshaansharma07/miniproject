import { motion } from 'framer-motion';

export default function MetricCard({ label, value, trend, icon: Icon }) {
  return (
    <motion.article
      className="glass-card p-5"
      whileHover={{ y: -6, scale: 1.01 }}
      transition={{ type: 'spring', stiffness: 260, damping: 22 }}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="metric-icon">{Icon ? <Icon size={22} /> : null}</div>
        <span className="rounded-full bg-emerald-400/10 px-3 py-1 text-xs font-semibold text-emerald-200">
          {trend}
        </span>
      </div>
      <p className="mt-6 text-sm text-slate-400">{label}</p>
      <h3 className="mt-2 text-3xl font-bold tracking-tight text-white">{value}</h3>
    </motion.article>
  );
}
