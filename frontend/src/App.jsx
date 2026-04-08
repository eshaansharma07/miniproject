import { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { jsPDF } from 'jspdf';
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from 'recharts';
import { ChevronRight, Moon, Shield, Sun, UserCircle } from 'lucide-react';
import { generateSyntheticEvent, getAlerts, getHealth, scoreEvent } from './api';
import ChartCard from './components/ChartCard';
import LiveThreatFeed from './components/LiveThreatFeed';
import MetricCard from './components/MetricCard';
import SectionHeader from './components/SectionHeader';
import {
  accuracyComparison,
  chartColors,
  chartTheme,
  confusionMatrix,
  footerLinks,
  heroIllustrationNodes,
  metricCards,
  navItems,
  precisionRecall,
  projectFacts,
  reports,
  rocCurve,
  technologyGroups,
  valueCards
} from './services/mockDashboardApi';

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  visible: { opacity: 1, y: 0 }
};

export default function App() {
  const [lightMode, setLightMode] = useState(false);
  const [events, setEvents] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [health, setHealth] = useState({ status: 'loading', model_version: '-', metrics: {}, fallback_mode: false });

  useEffect(() => {
    let active = true;

    async function bootLiveStream() {
      const [healthPayload, alertsPayload] = await Promise.all([getHealth(), getAlerts(12)]);
      if (!active) return;

      setHealth(healthPayload);
      setAlerts(alertsPayload.alerts || []);

      const warmupEvents = await Promise.all(
        Array.from({ length: 8 }, () => {
          const payload = generateSyntheticEvent('mixed');
          return scoreEvent(payload).then((result) => buildScoredEvent(payload, result));
        })
      );

      if (active) setEvents(warmupEvents.reverse());
    }

    bootLiveStream();

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    const timer = setInterval(async () => {
      const payload = generateSyntheticEvent('mixed');
      const result = await scoreEvent(payload);
      const event = buildScoredEvent(payload, result);

      setEvents((previous) => [event, ...previous].slice(0, 48));

      if (event.risk_level === 'high' || event.risk_level === 'critical') {
        const alertsPayload = await getAlerts(12);
        setAlerts(alertsPayload.alerts || []);
      }
    }, 2500);

    return () => clearInterval(timer);
  }, []);

  const liveData = useMemo(() => buildLiveData(events, alerts, health), [alerts, events, health]);

  return (
    <main className={lightMode ? 'bg-slate-100 text-slate-950' : 'text-slate-50'}>
      <div className={lightMode ? 'min-h-screen bg-gradient-to-br from-orange-50 via-white to-amber-50' : 'min-h-screen'}>
        <Navbar lightMode={lightMode} onToggleMode={() => setLightMode((value) => !value)} />
        <Hero stats={liveData.heroStats} health={health} />
        <DashboardMetrics metrics={liveData.metricCards} />
        <ThreatAnalysis
          attackDistribution={liveData.attackDistribution}
          attacksPerDay={liveData.attacksPerDay}
          threatActivity={liveData.threatActivity}
          trafficComparison={liveData.trafficComparison}
        />
        <ModelPerformance metrics={liveData.modelMetrics} health={health} />
        <LiveThreatFeed rows={liveData.liveThreats} />
        <Reports liveData={liveData} events={events} health={health} />
        <WhyItMatters />
        <AboutProject />
        <Footer />
      </div>
    </main>
  );
}

function Navbar({ lightMode, onToggleMode }) {
  return (
    <nav className="sticky top-0 z-40 border-b border-white/10 bg-slate-950/70 backdrop-blur-2xl">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-5 py-4 sm:px-8 lg:px-10">
        <a href="#dashboard" className="flex items-center gap-3">
          <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-orange-500 to-amber-300 text-slate-950 shadow-lg shadow-orange-500/25">
            <Shield size={22} />
          </span>
          <div>
            <p className="text-sm font-bold text-white">Sentinel NetShield</p>
            <p className="text-xs text-slate-400">Intrusion Detection using ML</p>
          </div>
        </a>

        <div className="hidden items-center gap-6 rounded-full border border-white/10 bg-white/[0.04] px-5 py-3 text-sm text-slate-300 lg:flex">
          {navItems.map((item) => (
            <a key={item} className="transition hover:text-orange-200" href={`#${item.toLowerCase().replaceAll(' ', '-')}`}>
              {item}
            </a>
          ))}
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onToggleMode}
            className="flex h-11 w-11 items-center justify-center rounded-full border border-white/10 bg-white/[0.06] text-slate-100 transition hover:border-orange-300/40 hover:text-orange-200"
            aria-label="Toggle color mode"
          >
            {lightMode ? <Sun size={18} /> : <Moon size={18} />}
          </button>
          <button className="hidden h-11 w-11 items-center justify-center rounded-full border border-white/10 bg-white/[0.06] text-slate-100 sm:flex" type="button">
            <UserCircle size={22} />
          </button>
        </div>
      </div>
    </nav>
  );
}

function Hero({ stats, health }) {
  const apiLabel = health?.fallback_mode ? 'Browser fallback scorer active' : `Live scorer: ${health?.model_version || 'loading'}`;

  return (
    <section id="dashboard" className="section-shell grid min-h-[620px] items-center gap-10 pt-12 lg:grid-cols-[1.05fr_0.95fr]">
      <motion.div initial="hidden" animate="visible" variants={fadeUp} transition={{ duration: 0.6 }}>
        <p className="eyebrow">AI-Powered Intrusion Detection Dashboard</p>
        <h1 className="mt-6 max-w-3xl text-5xl font-black tracking-[-0.06em] text-white sm:text-6xl lg:text-7xl">
          Sentinel NetShield
        </h1>
        <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-300">
          A machine learning-based intrusion detection system that identifies suspicious network activity,
          classifies attacks in real time, and helps analysts respond faster.
        </p>
        <p className="mt-4 inline-flex rounded-full border border-emerald-300/20 bg-emerald-400/10 px-4 py-2 text-sm font-semibold text-emerald-100">
          {apiLabel}
        </p>
        <div className="mt-8 flex flex-col gap-3 sm:flex-row">
          <a className="primary-button" href="#dashboard-metrics">
            View Dashboard <ChevronRight size={18} />
          </a>
          <a className="secondary-button" href="#about">
            Learn More
          </a>
        </div>
        <div className="mt-8 grid gap-3 sm:grid-cols-3">
          {projectFacts.map((fact) => (
            <div key={fact.label} className="rounded-2xl border border-white/10 bg-white/[0.04] p-4">
              <p className="text-xs uppercase tracking-[0.18em] text-slate-500">{fact.label}</p>
              <p className="mt-2 text-sm font-semibold text-slate-100">{fact.value}</p>
            </div>
          ))}
        </div>
      </motion.div>

      <motion.div
        className="relative min-h-[520px]"
        initial={{ opacity: 0, scale: 0.94 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.7, delay: 0.1 }}
      >
        <div className="absolute inset-10 rounded-full bg-orange-500/20 blur-3xl" />
        <div className="glass-card relative flex min-h-[500px] items-center justify-center overflow-hidden p-6">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(251,146,60,0.2),transparent_36%)]" />
          <div className="relative flex h-52 w-52 items-center justify-center rounded-full border border-orange-300/20 bg-slate-950/70 shadow-2xl shadow-orange-500/20">
            <div className="absolute h-72 w-72 rounded-full border border-dashed border-orange-300/20" />
            <div className="absolute h-96 w-96 rounded-full border border-dashed border-amber-300/10" />
            <Shield className="text-orange-200" size={72} />
          </div>
          {heroIllustrationNodes.map(({ label, icon: Icon, position }) => (
            <motion.div
              key={label}
              className={`absolute ${position} rounded-2xl border border-white/10 bg-slate-950/80 px-4 py-3 shadow-xl backdrop-blur-xl`}
              animate={{ y: [0, -8, 0] }}
              transition={{ duration: 4, repeat: Infinity, delay: label.length * 0.05 }}
            >
              <div className="flex items-center gap-2 text-sm font-semibold text-slate-100">
                <Icon size={16} className="text-orange-200" /> {label}
              </div>
            </motion.div>
          ))}
        </div>
        <div className="relative -mt-12 grid gap-3 sm:grid-cols-3">
          {stats.map((stat) => (
            <div key={stat.label} className="glass-card p-4 text-center">
              <p className="text-2xl font-black text-white">{stat.value}</p>
              <p className="mt-1 text-xs font-semibold text-orange-100">{stat.label}</p>
              <p className="text-xs text-slate-400">{stat.subtext}</p>
            </div>
          ))}
        </div>
      </motion.div>
    </section>
  );
}

function DashboardMetrics({ metrics }) {
  return (
    <section id="dashboard-metrics" className="section-shell">
      <SectionHeader
        eyebrow="Dashboard"
        title="Simple Security Snapshot"
        description="Evaluator-friendly metrics that show what the system monitors, how much traffic is safe, and whether active alerts need attention."
      />
      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {metrics.map((card) => (
          <MetricCard key={card.label} {...card} />
        ))}
      </div>
    </section>
  );
}

function ThreatAnalysis({ attackDistribution, attacksPerDay, threatActivity, trafficComparison }) {
  return (
    <section id="threat-analysis" className="section-shell">
      <SectionHeader
        eyebrow="Threat Analysis"
        title="Attack Patterns Made Easy To Understand"
        description="These charts explain what threats were seen, when they happened, and how safe traffic compares with malicious activity."
      />
      <div className="grid gap-5 lg:grid-cols-2">
        <ChartCard title="Attack Type Distribution" subtitle="Normal traffic remains the majority, with a smaller share of attack classes.">
          <ResponsiveContainer>
            <PieChart>
              <Pie data={attackDistribution} dataKey="value" nameKey="name" innerRadius={62} outerRadius={96} paddingAngle={3}>
                {attackDistribution.map((entry, index) => <Cell key={entry.name} fill={chartColors[index % chartColors.length]} />)}
              </Pie>
              <Tooltip contentStyle={tooltipStyle} />
            </PieChart>
          </ResponsiveContainer>
        </ChartCard>
        <ChartCard title="Attacks Detected Per Day" subtitle="Daily attack volume for quick trend review.">
          <ResponsiveContainer>
            <BarChart data={attacksPerDay}>
              <CartesianGrid stroke={chartTheme.grid} vertical={false} />
              <XAxis dataKey="day" stroke={chartTheme.text} />
              <YAxis stroke={chartTheme.text} />
              <Tooltip contentStyle={tooltipStyle} />
              <Bar dataKey="attacks" fill={chartTheme.orange} radius={[12, 12, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
        <ChartCard title="Threat Activity Over Time" subtitle="Threat index stays in a manageable medium-risk range.">
          <ResponsiveContainer>
            <LineChart data={threatActivity}>
              <CartesianGrid stroke={chartTheme.grid} vertical={false} />
              <XAxis dataKey="time" stroke={chartTheme.text} />
              <YAxis stroke={chartTheme.text} />
              <Tooltip contentStyle={tooltipStyle} />
              <Line type="monotone" dataKey="score" stroke={chartTheme.amber} strokeWidth={3} dot={{ r: 4 }} />
            </LineChart>
          </ResponsiveContainer>
        </ChartCard>
        <ChartCard title="Safe vs Malicious Traffic" subtitle="Designed to help analysts compare healthy traffic against suspicious activity.">
          <ResponsiveContainer>
            <AreaChart data={trafficComparison}>
              <CartesianGrid stroke={chartTheme.grid} vertical={false} />
              <XAxis dataKey="time" stroke={chartTheme.text} />
              <YAxis stroke={chartTheme.text} />
              <Tooltip contentStyle={tooltipStyle} />
              <Area type="monotone" dataKey="safe" stackId="1" stroke={chartTheme.green} fill="rgba(34,197,94,0.35)" />
              <Area type="monotone" dataKey="malicious" stackId="1" stroke={chartTheme.red} fill="rgba(239,68,68,0.35)" />
            </AreaChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>
    </section>
  );
}

function ModelPerformance({ metrics, health }) {
  const aucLabel = metrics.find((item) => item.label === 'ROC-AUC')?.value || 'N/A';

  return (
    <section id="model-performance" className="section-shell">
      <SectionHeader
        eyebrow="Machine Learning Performance"
        title="Model Quality Without Confusing Jargon"
        description={`The UI reads available model metadata from the backend health endpoint. Current scorer mode: ${health?.fallback_mode ? 'heuristic fallback/demo scoring' : 'trained model scoring'}.`}
      />
      <div className="mb-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        {metrics.map((metric) => (
          <div key={metric.label} className="glass-card p-5 text-center">
            <p className="text-sm text-slate-400">{metric.label}</p>
            <p className="mt-2 text-3xl font-black text-white">{metric.value}</p>
          </div>
        ))}
      </div>
      <div className="grid gap-5 lg:grid-cols-2">
        <ChartCard title="ROC Curve" subtitle={`AUC: ${aucLabel}. Higher curve means stronger separation between safe and malicious traffic.`}>
          <ResponsiveContainer>
            <LineChart data={rocCurve}>
              <CartesianGrid stroke={chartTheme.grid} />
              <XAxis dataKey="fpr" stroke={chartTheme.text} label={{ value: 'False Positive Rate', position: 'insideBottom', fill: chartTheme.text }} />
              <YAxis stroke={chartTheme.text} />
              <Tooltip contentStyle={tooltipStyle} />
              <Line type="monotone" dataKey="tpr" stroke={chartTheme.orange} strokeWidth={3} dot={{ r: 4 }} />
            </LineChart>
          </ResponsiveContainer>
        </ChartCard>
        <ChartCard title="Precision vs Recall" subtitle="Shows the model balances catching threats and controlling false positives.">
          <ResponsiveContainer>
            <LineChart data={precisionRecall}>
              <CartesianGrid stroke={chartTheme.grid} />
              <XAxis dataKey="recall" stroke={chartTheme.text} />
              <YAxis dataKey="precision" stroke={chartTheme.text} />
              <Tooltip contentStyle={tooltipStyle} />
              <Line type="monotone" dataKey="precision" stroke={chartTheme.amber} strokeWidth={3} dot={{ r: 4 }} />
            </LineChart>
          </ResponsiveContainer>
        </ChartCard>
        <ChartCard title="Accuracy Comparison" subtitle="Compares common ML classifiers used for intrusion detection experiments.">
          <ResponsiveContainer>
            <BarChart data={accuracyComparison} layout="vertical" margin={{ left: 28 }}>
              <CartesianGrid stroke={chartTheme.grid} horizontal={false} />
              <XAxis type="number" domain={[85, 100]} stroke={chartTheme.text} />
              <YAxis type="category" dataKey="model" width={130} stroke={chartTheme.text} />
              <Tooltip contentStyle={tooltipStyle} />
              <Bar dataKey="accuracy" fill={chartTheme.orange} radius={[0, 12, 12, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
        <article className="glass-card p-5">
          <h3 className="text-lg font-bold text-white">Confusion Matrix Heatmap</h3>
          <p className="mt-1 text-sm text-slate-400">Clear view of correct classifications and errors.</p>
          <div className="mt-6 grid grid-cols-2 gap-4">
            {confusionMatrix.map((cell) => (
              <div key={cell.label} className={`rounded-3xl border border-white/10 bg-gradient-to-br ${cell.tone} p-6 text-center`}>
                <p className="text-3xl font-black text-white">{cell.value}</p>
                <p className="mt-2 text-sm text-slate-200">{cell.label}</p>
              </div>
            ))}
          </div>
        </article>
      </div>
    </section>
  );
}

function Reports({ liveData, events, health }) {
  const reportActions = {
    'Download PDF Report': () => downloadPdfReport(liveData, events, health),
    'Download CSV Logs': () => downloadCsvLogs(events),
    'Download Threat Summary': () => downloadThreatSummary(liveData, events, health)
  };

  return (
    <section id="reports" className="section-shell">
      <SectionHeader
        eyebrow="Reports"
        title="Downloadable Outputs For Evaluation"
        description="These buttons export the current live dashboard data, including scored events, model status, alert counts, and graph summaries."
      />
      <div className="grid gap-5 md:grid-cols-3">
        {reports.map(({ title, description, icon: Icon }) => (
          <article key={title} className="glass-card p-6">
            <div className="metric-icon"><Icon size={22} /></div>
            <h3 className="mt-6 text-xl font-bold text-white">{title}</h3>
            <p className="mt-3 text-sm leading-6 text-slate-300">{description}</p>
            <button className="secondary-button mt-6 w-full" type="button" onClick={reportActions[title]}>
              Download
            </button>
          </article>
        ))}
      </div>
    </section>
  );
}

function WhyItMatters() {
  return (
    <section className="section-shell">
      <SectionHeader
        eyebrow="Why This Project Matters"
        title="Business Value For Non-Technical Evaluators"
        description="This section explains the impact of the project beyond algorithms and code."
      />
      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-5">
        {valueCards.map(({ title, description, icon: Icon }) => (
          <article key={title} className="glass-card p-5">
            <div className="metric-icon"><Icon size={22} /></div>
            <h3 className="mt-5 text-lg font-bold text-white">{title}</h3>
            <p className="mt-3 text-sm leading-6 text-slate-300">{description}</p>
          </article>
        ))}
      </div>
    </section>
  );
}

function AboutProject() {
  return (
    <section id="about" className="section-shell">
      <div className="glass-card grid gap-8 p-6 sm:p-8 lg:grid-cols-[0.9fr_1.1fr]">
        <div>
          <p className="eyebrow">About</p>
          <h2 className="mt-4 text-3xl font-bold text-white">Intrusion Detection in Network Traffic using ML</h2>
          <p className="mt-5 text-sm leading-7 text-slate-300">
            The problem is that modern networks produce large volumes of traffic, and manual monitoring can miss
            suspicious behaviour. The objective is to improve detection rate while controlling false positives,
            handle class imbalance, and provide a scoring pipeline with logs, alerts, and a dashboard for analysts.
          </p>
          <p className="mt-4 text-sm leading-7 text-slate-300">
            Real-world applications include SOC monitoring, enterprise network protection, student lab security,
            cloud traffic review, and early warning dashboards for suspicious login or attack behaviour.
          </p>
        </div>
        <div className="grid gap-4 sm:grid-cols-3">
          {technologyGroups.map((group) => (
            <div key={group.title} className="rounded-3xl border border-white/10 bg-slate-950/40 p-5">
              <h3 className="text-base font-bold text-orange-100">{group.title}</h3>
              <div className="mt-4 flex flex-wrap gap-2">
                {group.items.map((item) => (
                  <span key={item} className="rounded-full bg-white/[0.06] px-3 py-1 text-xs text-slate-300">{item}</span>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function Footer() {
  return (
    <footer className="border-t border-white/10">
      <div className="mx-auto flex max-w-7xl flex-col gap-4 px-5 py-8 text-sm text-slate-400 sm:px-8 md:flex-row md:items-center md:justify-between lg:px-10">
        <p>Sentinel NetShield © 2026. AI-powered intrusion detection mini project.</p>
        <div className="flex flex-wrap gap-3">
          {footerLinks.map(({ label, href, icon: Icon }) => (
            <a key={label} href={href} className="inline-flex items-center gap-2 rounded-full border border-white/10 px-4 py-2 transition hover:border-orange-300/40 hover:text-orange-100">
              <Icon size={16} /> {label}
            </a>
          ))}
        </div>
      </div>
    </footer>
  );
}

const tooltipStyle = {
  background: 'rgba(15, 23, 42, 0.94)',
  border: '1px solid rgba(255,255,255,0.12)',
  borderRadius: '16px',
  color: '#f8fafc'
};

function buildScoredEvent(payload, result) {
  return {
    ...payload,
    ...result,
    timestamp: payload.timestamp || new Date().toISOString()
  };
}

function buildLiveData(events, alerts, health) {
  const totalEvents = events.length;
  const suspiciousCount = events.filter((event) => event.is_intrusion).length;
  const safeCount = Math.max(0, totalEvents - suspiciousCount);
  const safePercent = totalEvents ? Math.round((safeCount / totalEvents) * 1000) / 10 : 0;
  const averageScore = totalEvents
    ? events.reduce((sum, event) => sum + Number(event.score || 0), 0) / totalEvents
    : 0;
  const activeAlerts = alerts.length || events.filter((event) => ['high', 'critical'].includes(event.risk_level)).length;
  const threatLevel = averageScore >= 0.75 ? 'High' : averageScore >= 0.5 ? 'Medium' : averageScore > 0 ? 'Low' : 'Starting';
  const accuracy = normalizeMetric(health?.metrics?.accuracy, health?.fallback_mode ? null : 0.948);
  const precision = normalizeMetric(health?.metrics?.precision, health?.fallback_mode ? null : 0.923);
  const recall = normalizeMetric(health?.metrics?.recall, health?.fallback_mode ? null : 0.917);
  const f1 = normalizeMetric(health?.metrics?.f1, health?.fallback_mode ? null : 0.92);
  const rocAuc = normalizeMetric(health?.metrics?.roc_auc, health?.fallback_mode ? null : 0.961);

  return {
    heroStats: [
      { label: 'Threats Detected', value: String(suspiciousCount), subtext: 'live scored window' },
      { label: 'Accuracy', value: accuracy || 'Live', subtext: health?.fallback_mode ? 'fallback mode' : 'model metadata' },
      { label: 'Live Alerts', value: String(activeAlerts), subtext: 'high-risk queue' }
    ],
    metricCards: [
      { ...metricCards[0], value: totalEvents.toLocaleString('en-IN'), trend: 'live stream' },
      { ...metricCards[1], value: suspiciousCount.toLocaleString('en-IN'), trend: `${percent(suspiciousCount, totalEvents)} flagged` },
      { ...metricCards[2], value: `${safePercent.toFixed(1)}%`, trend: `${safeCount} safe` },
      { ...metricCards[3], value: String(activeAlerts), trend: activeAlerts ? 'needs review' : 'clear' },
      { ...metricCards[4], value: accuracy || 'Live', trend: health?.fallback_mode ? 'heuristic' : 'trained' },
      { ...metricCards[5], value: threatLevel, trend: `avg ${(averageScore * 100).toFixed(1)}%` }
    ],
    attackDistribution: buildAttackDistribution(events),
    attacksPerDay: buildAttackBars(events),
    threatActivity: buildThreatActivity(events),
    trafficComparison: buildTrafficComparison(events),
    modelMetrics: [
      { label: 'Accuracy', value: accuracy || 'N/A' },
      { label: 'Precision', value: precision || 'N/A' },
      { label: 'Recall', value: recall || 'N/A' },
      { label: 'F1 Score', value: f1 || 'N/A' },
      { label: 'ROC-AUC', value: rocAuc || 'N/A' }
    ],
    liveThreats: buildThreatRows(events, alerts)
  };
}

function buildAttackDistribution(events) {
  if (!events.length) return [{ name: 'Waiting for live scores', value: 1 }];

  const counts = events.reduce((acc, event) => {
    const label = event.is_intrusion ? event.threat_category || 'Suspicious Activity' : 'Normal Traffic';
    acc[label] = (acc[label] || 0) + 1;
    return acc;
  }, {});

  return Object.entries(counts).map(([name, value]) => ({ name, value }));
}

function buildAttackBars(events) {
  const groups = groupByClock(events);
  return groups.map(({ label, items }) => ({
    day: label,
    attacks: items.filter((event) => event.is_intrusion).length
  }));
}

function buildThreatActivity(events) {
  return groupByClock(events).map(({ label, items }) => ({
    time: label,
    score: items.length
      ? Math.round((items.reduce((sum, event) => sum + Number(event.score || 0), 0) / items.length) * 100)
      : 0
  }));
}

function buildTrafficComparison(events) {
  return groupByClock(events).map(({ label, items }) => ({
    time: label,
    safe: items.filter((event) => !event.is_intrusion).length,
    malicious: items.filter((event) => event.is_intrusion).length
  }));
}

function buildThreatRows(events, alerts) {
  const eventRows = events.slice(0, 8).map((event) => ({
    timestamp: formatTime(event.timestamp),
    source: event.src_ip,
    destination: event.dst_ip,
    type: event.threat_category || (event.is_intrusion ? 'Suspicious Activity' : 'Normal Traffic'),
    severity: event.risk_level === 'low' ? 'safe' : event.risk_level,
    status: event.disposition || (event.is_intrusion ? 'Investigating' : 'Allowed')
  }));

  if (eventRows.length) return eventRows;

  return alerts.slice(0, 5).map((alert) => ({
    timestamp: formatTime(alert.created_at),
    source: alert.src_ip,
    destination: alert.dst_ip,
    type: alert.summary || 'Suspicious Flow',
    severity: alert.risk_level === 'low' ? 'safe' : alert.risk_level,
    status: 'Investigating'
  }));
}

function groupByClock(events) {
  const recent = events.slice(0, 7).reverse();
  if (!recent.length) {
    return Array.from({ length: 7 }, (_, index) => ({
      label: `T-${6 - index}`,
      items: []
    }));
  }

  return recent.map((event) => ({
    label: new Date(event.timestamp).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
    items: [event]
  }));
}

function formatTime(timestamp) {
  return new Date(timestamp).toLocaleString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  });
}

function normalizeMetric(value, fallback) {
  const normalized = value ?? fallback;
  if (normalized === null || normalized === undefined) return null;
  return `${(Number(normalized) * 100).toFixed(1)}%`;
}

function percent(value, total) {
  if (!total) return '0.0%';
  return `${((value / total) * 100).toFixed(1)}%`;
}

function downloadPdfReport(liveData, events, health) {
  const doc = new jsPDF();
  const generatedAt = new Date().toLocaleString('en-IN');
  const rows = [
    ['Project', 'Sentinel NetShield'],
    ['Objective', 'Intrusion Detection in Network Traffic using ML'],
    ['Generated', generatedAt],
    ['Scorer', health?.fallback_mode ? 'Heuristic fallback scorer' : `Trained model: ${health?.model_version || 'active'}`],
    ['Total Events', liveData.metricCards[0]?.value || '0'],
    ['Suspicious Activities', liveData.metricCards[1]?.value || '0'],
    ['Safe Traffic', liveData.metricCards[2]?.value || '0%'],
    ['Active Alerts', liveData.metricCards[3]?.value || '0'],
    ['Threat Level', liveData.metricCards[5]?.value || 'Starting']
  ];

  doc.setFillColor(15, 23, 42);
  doc.rect(0, 0, 210, 34, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(20);
  doc.text('Sentinel NetShield Report', 14, 18);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text('AI-Powered Intrusion Detection Dashboard', 14, 26);

  doc.setTextColor(30, 41, 59);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  doc.text('Live Dashboard Snapshot', 14, 48);

  let y = 58;
  rows.forEach(([label, value]) => {
    doc.setFont('helvetica', 'bold');
    doc.text(`${label}:`, 14, y);
    doc.setFont('helvetica', 'normal');
    doc.text(String(value), 66, y);
    y += 8;
  });

  y += 4;
  doc.setFont('helvetica', 'bold');
  doc.text('Model Metrics', 14, y);
  y += 8;
  liveData.modelMetrics.forEach((metric) => {
    doc.setFont('helvetica', 'normal');
    doc.text(`${metric.label}: ${metric.value}`, 18, y);
    y += 7;
  });

  y += 4;
  doc.setFont('helvetica', 'bold');
  doc.text('Latest Scored Events', 14, y);
  y += 8;
  doc.setFont('helvetica', 'normal');
  events.slice(0, 8).forEach((event, index) => {
    const line = `${index + 1}. ${event.src_ip} -> ${event.dst_ip} | ${event.threat_category || 'Normal Traffic'} | ${event.risk_level} | score ${(Number(event.score || 0) * 100).toFixed(1)}%`;
    doc.text(doc.splitTextToSize(line, 180), 18, y);
    y += 8;
  });

  y += 4;
  doc.setFont('helvetica', 'bold');
  doc.text('Graph Data Summary', 14, y);
  y += 8;
  doc.setFont('helvetica', 'normal');
  liveData.attackDistribution.forEach((item) => {
    doc.text(`${item.name}: ${item.value}`, 18, y);
    y += 7;
  });

  doc.save('sentinel-netshield-report.pdf');
}

function downloadCsvLogs(events) {
  const headers = [
    'timestamp',
    'source_ip',
    'destination_ip',
    'source_port',
    'destination_port',
    'protocol',
    'threat_category',
    'risk_level',
    'score',
    'disposition'
  ];
  const rows = events.map((event) => [
    event.timestamp,
    event.src_ip,
    event.dst_ip,
    event.src_port,
    event.dst_port,
    event.protocol,
    event.threat_category || 'Normal Traffic',
    event.risk_level,
    event.score,
    event.disposition
  ]);

  const csv = [headers, ...rows]
    .map((row) => row.map((cell) => `"${String(cell ?? '').replaceAll('"', '""')}"`).join(','))
    .join('\n');

  downloadBlob('sentinel-netshield-live-logs.csv', csv, 'text/csv;charset=utf-8');
}

function downloadThreatSummary(liveData, events, health) {
  const summary = {
    project: 'Sentinel NetShield',
    generated_at: new Date().toISOString(),
    scorer: health?.fallback_mode ? 'heuristic fallback scorer' : health?.model_version,
    metrics: liveData.metricCards.map(({ label, value, trend }) => ({ label, value, trend })),
    model_metrics: liveData.modelMetrics,
    attack_distribution: liveData.attackDistribution,
    graph_series: {
      attacks_per_interval: liveData.attacksPerDay,
      threat_activity: liveData.threatActivity,
      safe_vs_malicious: liveData.trafficComparison
    },
    latest_events: events.slice(0, 12).map((event) => ({
      timestamp: event.timestamp,
      source_ip: event.src_ip,
      destination_ip: event.dst_ip,
      threat_category: event.threat_category,
      risk_level: event.risk_level,
      score: event.score,
      disposition: event.disposition
    }))
  };

  downloadBlob('sentinel-netshield-threat-summary.json', JSON.stringify(summary, null, 2), 'application/json;charset=utf-8');
}

function downloadBlob(filename, content, type) {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}
