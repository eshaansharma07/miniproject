import { motion } from 'framer-motion';
import { BadgeInfo } from 'lucide-react';

export default function MetricCard({ label, value, trend, icon: Icon, info }) {
  return (
    <motion.article
      className="glass-panel p-5"
      whileHover={{ y: -2, scale: 1.003 }}
      transition={{ type: 'spring', stiffness: 260, damping: 22 }}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="metric-icon">{Icon ? <Icon size={22} /> : null}</div>
        <div className="flex items-center gap-2">
          {info ? (
            <span className="info-badge" title={info} aria-label={info}>
              <BadgeInfo size={14} />
            </span>
          ) : null}
          <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-bold text-blue-600 ring-1 ring-blue-100">
            {trend}
          </span>
        </div>
      </div>
      <p className="mt-6 text-sm font-medium text-slate-500">{label}</p>
      <h3 className="mt-2 text-3xl font-black tracking-tight text-slate-950">{value}</h3>
    </motion.article>
  );
}
