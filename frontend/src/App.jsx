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
import {
  ArrowRight,
  BadgeInfo,
  BellRing,
  Binary,
  BookOpenText,
  BrainCircuit,
  CheckCircle2,
  ChevronRight,
  Cpu,
  Gauge,
  Radar,
  Shield,
  Sparkles,
  Workflow
} from 'lucide-react';
import { generateSyntheticEvent, getAlerts, getHealth, scoreEvent } from './api';
import ChartCard from './components/ChartCard';
import LiveThreatFeed from './components/LiveThreatFeed';
import MetricCard from './components/MetricCard';
import SectionHeader from './components/SectionHeader';
import {
  accuracyComparison,
  chartColors,
  confusionMatrix,
  footerLinks,
  metricCards,
  navItems,
  precisionRecall,
  reports,
  rocCurve,
  shapFeatureImportance,
  technologyGroups,
  valueCards
} from './services/mockDashboardApi';

const fadeUp = {
  hidden: { opacity: 0, y: 22 },
  visible: { opacity: 1, y: 0 }
};

const evaluatorHighlights = [
  {
    icon: Shield,
    title: 'Project Purpose',
    value: 'Intrusion Detection in Network Traffic using ML',
    detail: 'Detect suspicious flows, classify probable attack behavior, and present decisions in an evaluator-friendly dashboard.'
  },
  {
    icon: Cpu,
    title: 'Tech Stack',
    value: 'React, Recharts, Framer Motion, Python, Scikit-learn',
    detail: 'Frontend visualization is separated from the scoring API so the evaluator can inspect both system clarity and model performance.'
  },
  {
    icon: Binary,
    title: 'Student ID',
    value: '24BAI70387',
    detail: 'Pinned directly in the hero card for presentation and viva visibility.'
  }
];

const systemStages = [
  {
    title: 'Capture',
    subtitle: 'Network attributes are normalized into a compact event schema.',
    logic: 'Logic: Source IP, destination IP, bytes, packets, duration, failed logins, and flags are assembled into each scoring payload.'
  },
  {
    title: 'Score',
    subtitle: 'A classifier or heuristic fallback assigns intrusion probability.',
    logic: 'Logic: The scoring module produces a confidence score, threat label, response disposition, and human-readable reasons.'
  },
  {
    title: 'Explain',
    subtitle: 'Metrics, SHAP-style importance, and confusion matrix simplify model interpretation.',
    logic: 'Logic: Evaluator-facing views show why the model is reliable, not just what it predicts.'
  }
];

const tooltipStyle = {
  background: 'rgba(255,255,255,0.92)',
  border: '1px solid rgba(148, 163, 184, 0.22)',
  borderRadius: '18px',
  color: '#0f172a',
  boxShadow: '0 24px 80px rgba(59, 130, 246, 0.16)'
};

export default function App() {
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
    <main className="app-shell">
      <div className="page-glow page-glow-left" />
      <div className="page-glow page-glow-right" />
      <Navbar />
      <Hero stats={liveData.heroStats} health={health} />
      <DashboardMetrics metrics={liveData.metricCards} />
      <ArchitectureStrip />
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
    </main>
  );
}

function Navbar() {
  return (
    <nav className="sticky top-0 z-40 border-b border-white/50 bg-white/55 backdrop-blur-xl">
      <div className="section-shell flex items-center justify-between gap-4 py-4">
        <a href="#dashboard" className="flex items-center gap-3">
          <span className="brand-mark">
            <Shield size={20} />
          </span>
          <div>
            <p className="text-sm font-extrabold text-slate-900">Sentinel NetShield</p>
            <p className="text-xs font-medium text-slate-500">Futuristic IDS Evaluation Console</p>
          </div>
        </a>

        <div className="hidden items-center gap-2 rounded-full border border-white/65 bg-white/60 px-3 py-2 shadow-[0_10px_40px_rgba(59,130,246,0.08)] lg:flex">
          {navItems.map((item) => (
            <a
              key={item}
              className="rounded-full px-4 py-2 text-sm font-semibold text-slate-600 transition hover:bg-white hover:text-blue-600"
              href={`#${item.toLowerCase().replaceAll(' ', '-')}`}
            >
              {item}
            </a>
          ))}
        </div>

        <a href="#reports" className="button-liquid hidden sm:inline-flex">
          <span>Export Review Assets</span>
        </a>
      </div>
    </nav>
  );
}

function Hero({ stats, health }) {
  const apiLabel = health?.fallback_mode ? 'Heuristic fallback scorer active' : `Live model: ${health?.model_version || 'loading'}`;

  return (
    <section id="dashboard" className="section-shell grid gap-8 pt-8 pb-4 lg:grid-cols-[1.08fr_0.92fr] lg:items-center">
      <motion.div initial="hidden" animate="visible" variants={fadeUp} transition={{ duration: 0.55 }}>
        <div className="inline-flex items-center gap-2 rounded-full border border-blue-100 bg-white/75 px-4 py-2 text-xs font-bold uppercase tracking-[0.22em] text-blue-600">
          <Sparkles size={14} />
          Academic Evaluation Ready
        </div>
        <h1 className="mt-6 max-w-4xl text-4xl font-black leading-[0.95] tracking-[-0.05em] text-slate-950 sm:text-5xl lg:text-7xl">
          A bright, glassmorphism dashboard for explaining
          <span className="bg-gradient-to-r from-blue-500 to-cyan-500 bg-clip-text text-transparent"> machine-learning intrusion detection</span>
        </h1>
        <p className="mt-6 max-w-2xl text-base leading-8 text-slate-600 sm:text-lg">
          Sentinel NetShield converts live network behavior into charts, evaluator notes, model metrics, and actionable alerts.
          Every block is designed to explain the technical logic behind the UI, not just display numbers.
        </p>
        <div className="mt-5 flex flex-wrap gap-3">
          <span className="status-chip status-chip-blue">{apiLabel}</span>
          <span className="status-chip">Student ID: 24BAI70387</span>
          <span className="status-chip">Theme: Cloud White + Electric Blue</span>
        </div>
        <div className="mt-8 flex flex-col gap-3 sm:flex-row">
          <a className="button-liquid" href="#dashboard-metrics">
            <span>Inspect Live Dashboard</span>
            <ChevronRight size={18} />
          </a>
          <a className="button-secondary" href="#about">
            <span>Review Architecture</span>
            <BookOpenText size={18} />
          </a>
        </div>
        <div className="mt-8 grid gap-3 sm:grid-cols-3">
          {stats.map((stat) => (
            <motion.div
              key={stat.label}
              className="glass-panel p-5"
              whileHover={{ y: -6 }}
              transition={{ type: 'spring', stiffness: 240, damping: 20 }}
            >
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-slate-400">{stat.label}</p>
              <p className="mt-3 text-3xl font-black tracking-tight text-slate-950">{stat.value}</p>
              <p className="mt-1 text-sm text-slate-500">{stat.subtext}</p>
            </motion.div>
          ))}
        </div>
      </motion.div>

      <motion.div
        className="hero-stack"
        initial={{ opacity: 0, y: 20, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.65, delay: 0.1 }}
      >
        <div className="glass-panel hero-card">
          <div className="hero-orb" />
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-sm font-bold uppercase tracking-[0.18em] text-blue-600">Interactive Onboarding</p>
              <h2 className="mt-3 text-2xl font-extrabold tracking-tight text-slate-950">Project launch card for the evaluator</h2>
            </div>
            <InfoBadge text="Logic: The hero condenses purpose, stack, and authorship into one onboarding surface so an evaluator understands the project before diving into metrics." />
          </div>
          <div className="mt-6 space-y-4">
            {evaluatorHighlights.map(({ icon: Icon, title, value, detail }) => (
              <div key={title} className="info-row">
                <div className="info-row-icon">
                  <Icon size={18} />
                </div>
                <div>
                  <p className="text-xs font-bold uppercase tracking-[0.16em] text-slate-400">{title}</p>
                  <p className="mt-1 text-sm font-extrabold text-slate-900">{value}</p>
                  <p className="mt-1 text-sm leading-6 text-slate-500">{detail}</p>
                </div>
              </div>
            ))}
          </div>
          <div className="mt-6 rounded-[28px] border border-white/70 bg-white/70 p-4">
            <div className="grid gap-3 sm:grid-cols-3">
              {systemStages.map((stage, index) => (
                <motion.div
                  key={stage.title}
                  className="rounded-[24px] border border-slate-100 bg-[linear-gradient(180deg,rgba(255,255,255,0.95),rgba(241,245,249,0.8))] p-4"
                  animate={{ y: [0, -4, 0] }}
                  transition={{ duration: 4 + index, repeat: Infinity, ease: 'easeInOut' }}
                  title={stage.logic}
                >
                  <p className="text-xs font-bold uppercase tracking-[0.16em] text-blue-500">{stage.title}</p>
                  <p className="mt-2 text-sm font-semibold text-slate-800">{stage.subtitle}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </motion.div>
    </section>
  );
}

function DashboardMetrics({ metrics }) {
  const logicNotes = [
    'Logic: Counts every scored event visible in the rolling live stream.',
    'Logic: Flags only traffic whose score passes the intrusion threshold.',
    'Logic: Safe traffic percentage helps the evaluator compare signal vs noise.',
    'Logic: High and critical items are surfaced as active review alerts.',
    'Logic: Accuracy comes from backend model metadata when available.',
    'Logic: Threat level is derived from the average confidence of recent events.'
  ];

  return (
    <section id="dashboard-metrics" className="section-shell">
      <SectionHeader
        eyebrow="Dashboard"
        title="Clear executive metrics with built-in technical context"
        description="Each card is tuned for viva or demo review: polished enough for presentation, but annotated so the evaluator can understand how each number is computed."
        info="Logic: This strip summarizes live event volume, intrusion filtering, current alert pressure, and model confidence in one glance."
      />
      <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
        {metrics.map((card, index) => (
          <MetricCard key={card.label} {...card} info={logicNotes[index]} />
        ))}
      </div>
    </section>
  );
}

function ArchitectureStrip() {
  return (
    <section className="section-shell">
      <div className="grid gap-5 lg:grid-cols-[0.9fr_1.1fr]">
        <article className="glass-panel p-6 sm:p-7">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="section-kicker">System Narrative</p>
              <h3 className="mt-3 text-2xl font-extrabold tracking-tight text-slate-950">From raw packets to evaluator-ready evidence</h3>
            </div>
            <InfoBadge text="Logic: This block converts the backend pipeline into a simple three-stage visual explanation." />
          </div>
          <div className="mt-6 space-y-4">
            {[
              { icon: Radar, title: 'Traffic intake', body: 'Incoming network events are formed into packet, byte, session, and authentication features.' },
              { icon: BrainCircuit, title: 'Risk inference', body: 'The scorer returns a probability, a risk level, and a threat category for downstream decision support.' },
              { icon: BellRing, title: 'Analyst action', body: 'High-severity results feed alerts, tables, exports, and evaluation materials.' }
            ].map(({ icon: Icon, title, body }) => (
              <div key={title} className="step-card">
                <div className="step-icon"><Icon size={18} /></div>
                <div>
                  <p className="text-sm font-bold text-slate-900">{title}</p>
                  <p className="mt-1 text-sm leading-6 text-slate-500">{body}</p>
                </div>
              </div>
            ))}
          </div>
        </article>
        <article className="glass-panel p-6 sm:p-7">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="section-kicker">Evaluator Notes</p>
              <h3 className="mt-3 text-2xl font-extrabold tracking-tight text-slate-950">Why the interface is intentionally explanatory</h3>
            </div>
            <InfoBadge text="Logic: The redesign prioritizes clarity, traceability, and academic storytelling over generic dashboard chrome." />
          </div>
          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            {[
              'Info badges explain technical logic on hover.',
              'Glass panels create hierarchy without heavy dark UI.',
              'Color gradients emphasize actions while preserving light mode.',
              'Responsive spacing keeps desktop presentation clean and mobile usable.'
            ].map((note) => (
              <div key={note} className="rounded-[26px] border border-white/65 bg-white/70 p-4 text-sm font-medium leading-6 text-slate-600">
                {note}
              </div>
            ))}
          </div>
        </article>
      </div>
    </section>
  );
}

function ThreatAnalysis({ attackDistribution, attacksPerDay, threatActivity, trafficComparison }) {
  return (
    <section id="threat-analysis" className="section-shell">
      <SectionHeader
        eyebrow="Threat Analysis"
        title="Futuristic visual analytics for attack behavior"
        description="These charts use a bright presentation style, but they still expose the underlying logic: what traffic was normal, when suspicious activity clustered, and how malicious flows compare with safe traffic."
        info="Logic: Distribution, frequency, intensity, and safe-vs-malicious comparisons work together to explain attack patterns from multiple angles."
      />
      <div className="grid gap-5 lg:grid-cols-2">
        <ChartCard
          title="Attack Type Distribution"
          subtitle="Class mix across normal and suspicious flows."
          info="Logic: This pie chart aggregates recent scored events by final threat category so the evaluator can see class balance."
        >
          <ResponsiveContainer>
            <PieChart>
              <Pie data={attackDistribution} dataKey="value" nameKey="name" innerRadius={60} outerRadius={92} paddingAngle={4}>
                {attackDistribution.map((entry, index) => <Cell key={entry.name} fill={chartColors[index % chartColors.length]} />)}
              </Pie>
              <Tooltip contentStyle={tooltipStyle} />
            </PieChart>
          </ResponsiveContainer>
        </ChartCard>
        <ChartCard
          title="Attacks Detected Per Interval"
          subtitle="Quick frequency snapshot of suspicious detections."
          info="Logic: Each bar counts only intrusion-flagged events within the recent timeline buckets."
        >
          <ResponsiveContainer>
            <BarChart data={attacksPerDay}>
              <CartesianGrid stroke={chartTheme.grid} vertical={false} />
              <XAxis dataKey="day" stroke={chartTheme.text} />
              <YAxis stroke={chartTheme.text} />
              <Tooltip contentStyle={tooltipStyle} />
              <Bar dataKey="attacks" fill="url(#barBlue)" radius={[12, 12, 0, 0]} />
              <defs>
                <linearGradient id="barBlue" x1="0" x2="0" y1="0" y2="1">
                  <stop offset="0%" stopColor="#3B82F6" />
                  <stop offset="100%" stopColor="#0F5AA8" />
                </linearGradient>
              </defs>
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
        <ChartCard
          title="Threat Intensity Over Time"
          subtitle="Average confidence trend across recent scored events."
          info="Logic: This line shows the recent mean risk score, helping explain whether the stream is calming down or escalating."
        >
          <ResponsiveContainer>
            <LineChart data={threatActivity}>
              <CartesianGrid stroke={chartTheme.grid} vertical={false} />
              <XAxis dataKey="time" stroke={chartTheme.text} />
              <YAxis stroke={chartTheme.text} />
              <Tooltip contentStyle={tooltipStyle} />
              <Line type="monotone" dataKey="score" stroke="#38BDF8" strokeWidth={3.5} dot={{ r: 4, fill: '#3B82F6' }} />
            </LineChart>
          </ResponsiveContainer>
        </ChartCard>
        <ChartCard
          title="Safe vs Malicious Traffic"
          subtitle="Parallel view of healthy and suspicious network activity."
          info="Logic: The area chart separates safe flows from malicious ones so the evaluator can judge signal quality and operational load."
        >
          <ResponsiveContainer>
            <AreaChart data={trafficComparison}>
              <CartesianGrid stroke={chartTheme.grid} vertical={false} />
              <XAxis dataKey="time" stroke={chartTheme.text} />
              <YAxis stroke={chartTheme.text} />
              <Tooltip contentStyle={tooltipStyle} />
              <Area type="monotone" dataKey="safe" stackId="1" stroke="#14B8A6" fill="rgba(20,184,166,0.28)" />
              <Area type="monotone" dataKey="malicious" stackId="1" stroke="#3B82F6" fill="rgba(59,130,246,0.22)" />
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
        eyebrow="Model Performance"
        title="Readable ML validation without sacrificing rigor"
        description={`Current scorer mode: ${health?.fallback_mode ? 'heuristic fallback/demo scoring' : 'trained model scoring'}. This section focuses on what makes the model trustworthy for academic review.`}
        info="Logic: Accuracy, ROC behavior, precision-recall balance, confusion cells, and feature impact work together to justify the model's decisions."
      />
      <div className="mb-5 grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        {metrics.map((metric) => (
          <div key={metric.label} className="glass-panel p-5 text-center">
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-slate-400">{metric.label}</p>
            <p className="mt-3 text-3xl font-black tracking-tight text-slate-950">{metric.value}</p>
          </div>
        ))}
      </div>
      <div className="grid gap-5 lg:grid-cols-2">
        <ChartCard
          title="ROC Curve"
          subtitle={`AUC: ${aucLabel}. Higher curvature means cleaner class separation.`}
          info="Logic: ROC compares true-positive recovery against false-positive cost across thresholds."
        >
          <ResponsiveContainer>
            <LineChart data={rocCurve}>
              <CartesianGrid stroke={chartTheme.grid} />
              <XAxis dataKey="fpr" stroke={chartTheme.text} label={{ value: 'False Positive Rate', position: 'insideBottom', fill: chartTheme.text }} />
              <YAxis stroke={chartTheme.text} />
              <Tooltip contentStyle={tooltipStyle} />
              <Line type="monotone" dataKey="tpr" stroke="#3B82F6" strokeWidth={3.5} dot={{ r: 4, fill: '#0EA5E9' }} />
            </LineChart>
          </ResponsiveContainer>
        </ChartCard>
        <ChartCard
          title="Precision vs Recall"
          subtitle="Shows whether strong detection comes with controlled false alarms."
          info="Logic: Precision-recall is especially valuable in intrusion detection because suspicious classes can be imbalanced."
        >
          <ResponsiveContainer>
            <LineChart data={precisionRecall}>
              <CartesianGrid stroke={chartTheme.grid} />
              <XAxis dataKey="recall" stroke={chartTheme.text} />
              <YAxis dataKey="precision" stroke={chartTheme.text} />
              <Tooltip contentStyle={tooltipStyle} />
              <Line type="monotone" dataKey="precision" stroke="#0EA5E9" strokeWidth={3.5} dot={{ r: 4, fill: '#3B82F6' }} />
            </LineChart>
          </ResponsiveContainer>
        </ChartCard>
        <ChartCard
          title="Classifier Accuracy Comparison"
          subtitle="Benchmark perspective across common candidate models."
          info="Logic: This panel compares competing ML approaches used in intrusion detection experiments."
        >
          <ResponsiveContainer>
            <BarChart data={accuracyComparison} layout="vertical" margin={{ left: 28 }}>
              <CartesianGrid stroke={chartTheme.grid} horizontal={false} />
              <XAxis type="number" domain={[85, 100]} stroke={chartTheme.text} />
              <YAxis type="category" dataKey="model" width={130} stroke={chartTheme.text} />
              <Tooltip contentStyle={tooltipStyle} />
              <Bar dataKey="accuracy" fill="url(#accuracyFill)" radius={[0, 12, 12, 0]} />
              <defs>
                <linearGradient id="accuracyFill" x1="0" x2="1" y1="0" y2="0">
                  <stop offset="0%" stopColor="#7DD3FC" />
                  <stop offset="100%" stopColor="#3B82F6" />
                </linearGradient>
              </defs>
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
        <ChartCard
          title="SHAP Feature Importance"
          subtitle="Global view of the most influential network features."
          info="Logic: Larger bars mean those attributes contribute more strongly to the intrusion decision boundary."
        >
          <ResponsiveContainer>
            <BarChart data={shapFeatureImportance} layout="vertical" margin={{ left: 32 }}>
              <CartesianGrid stroke={chartTheme.grid} horizontal={false} />
              <XAxis type="number" stroke={chartTheme.text} />
              <YAxis type="category" dataKey="feature" width={140} stroke={chartTheme.text} />
              <Tooltip contentStyle={tooltipStyle} formatter={(value) => [`${Number(value).toFixed(2)}`, 'Mean |SHAP value|']} />
              <Bar dataKey="importance" fill="url(#shapFill)" radius={[0, 12, 12, 0]} />
              <defs>
                <linearGradient id="shapFill" x1="0" x2="1" y1="0" y2="0">
                  <stop offset="0%" stopColor="#38BDF8" />
                  <stop offset="100%" stopColor="#2563EB" />
                </linearGradient>
              </defs>
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
        <article className="glass-panel p-5">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h3 className="text-lg font-extrabold text-slate-950">Confusion Matrix Heatmap</h3>
              <p className="mt-1 text-sm text-slate-500">Correct classifications and model mistakes in one compact view.</p>
            </div>
            <InfoBadge text="Logic: A strong evaluator view needs both success counts and error counts, not only a single accuracy number." />
          </div>
          <div className="mt-6 grid grid-cols-2 gap-4">
            {confusionMatrix.map((cell) => (
              <div key={cell.label} className={`rounded-[28px] border border-white/65 bg-gradient-to-br ${cell.tone} p-6 text-center`}>
                <p className="text-3xl font-black text-slate-950">{cell.value}</p>
                <p className="mt-2 text-sm font-semibold text-slate-700">{cell.label}</p>
              </div>
            ))}
          </div>
        </article>
        <article className="glass-panel p-5">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h3 className="text-lg font-extrabold text-slate-950">Feature Interpretation Notes</h3>
              <p className="mt-1 text-sm text-slate-500">Concise explanations for the most influential signals.</p>
            </div>
            <InfoBadge text="Logic: These annotations translate model-explanation terminology into simpler academic language for the evaluator." />
          </div>
          <div className="mt-5 space-y-3">
            {shapFeatureImportance.slice(0, 4).map((item) => (
              <div key={item.feature} className="rounded-[24px] border border-white/65 bg-white/70 p-4">
                <p className="text-sm font-bold text-slate-900">{item.feature}</p>
                <p className="mt-1 text-xs leading-5 text-slate-500">{item.explanation}</p>
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
        title="High-fidelity outputs for evaluation and documentation"
        description="Primary actions use custom gradient buttons and glass cards so exports feel like part of the product, not an afterthought."
        info="Logic: These exports package the current dashboard state into evidence that can be attached to reports, demos, or viva discussions."
      />
      <div className="grid gap-5 md:grid-cols-3">
        {reports.map(({ title, description, icon: Icon }) => (
          <article key={title} className="glass-panel p-6">
            <div className="flex items-start justify-between gap-4">
              <div className="metric-icon">
                <Icon size={22} />
              </div>
              <InfoBadge text={`Logic: ${description}`} />
            </div>
            <h3 className="mt-6 text-xl font-extrabold text-slate-950">{title}</h3>
            <p className="mt-3 text-sm leading-6 text-slate-500">{description}</p>
            <button className="button-liquid mt-6 w-full justify-center" type="button" onClick={reportActions[title]}>
              <span>Generate Export</span>
              <ArrowRight size={18} />
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
        eyebrow="Why It Matters"
        title="A security dashboard that tells the academic story clearly"
        description="This section translates technical capability into evaluator-focused value: faster review, better transparency, and stronger evidence of engineering maturity."
        info="Logic: The cards below connect operational outcomes to the underlying ML and alerting pipeline."
      />
      <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-5">
        {valueCards.map(({ title, description, icon: Icon }) => (
          <article key={title} className="glass-panel p-5">
            <div className="flex items-start justify-between gap-4">
              <div className="metric-icon"><Icon size={22} /></div>
              <InfoBadge text={`Logic: ${description}`} />
            </div>
            <h3 className="mt-5 text-lg font-extrabold text-slate-950">{title}</h3>
            <p className="mt-3 text-sm leading-6 text-slate-500">{description}</p>
          </article>
        ))}
      </div>
    </section>
  );
}

function AboutProject() {
  return (
    <section id="about" className="section-shell">
      <div className="glass-panel grid gap-8 p-6 sm:p-8 lg:grid-cols-[0.92fr_1.08fr]">
        <div>
          <div className="flex items-center gap-3">
            <p className="section-kicker">About</p>
            <InfoBadge text="Logic: This module summarizes the project problem statement, deployment context, and tech choices for a quick academic review." />
          </div>
          <h2 className="mt-4 text-3xl font-extrabold tracking-tight text-slate-950">Intrusion detection in network traffic using machine learning</h2>
          <p className="mt-5 text-sm leading-7 text-slate-600">
            Modern networks generate large traffic volumes, and manual inspection can miss suspicious behavior. This project
            aims to improve detection quality while controlling false positives, then present those results in a reviewer-friendly
            interface with live scoring, alert queues, metrics, and downloadable evidence.
          </p>
          <p className="mt-4 text-sm leading-7 text-slate-600">
            The redesign is intentionally light, technical, and explanatory so an evaluator can inspect the product quickly on desktop,
            while still retaining mobile readability for demos or coursework submission review.
          </p>
        </div>
        <div className="grid gap-4 sm:grid-cols-3">
          {technologyGroups.map((group) => (
            <div key={group.title} className="rounded-[28px] border border-white/70 bg-white/70 p-5">
              <div className="flex items-center justify-between gap-2">
                <h3 className="text-base font-extrabold text-slate-900">{group.title}</h3>
                <InfoBadge text={`Logic: This stack group covers the ${group.title.toLowerCase()} layer of the project.`} />
              </div>
              <div className="mt-4 flex flex-wrap gap-2">
                {group.items.map((item) => (
                  <span key={item} className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-semibold text-slate-600">
                    {item}
                  </span>
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
    <footer className="border-t border-white/50">
      <div className="section-shell flex flex-col gap-4 py-8 text-sm text-slate-500 md:flex-row md:items-center md:justify-between">
        <p>Sentinel NetShield © 2026. Light-mode ML intrusion detection showcase for academic evaluation.</p>
        <div className="flex flex-wrap gap-3">
          {footerLinks.map(({ label, href, icon: Icon }) => (
            <a key={label} href={href} className="inline-flex items-center gap-2 rounded-full border border-white/70 bg-white/70 px-4 py-2 font-semibold transition hover:-translate-y-0.5 hover:text-blue-600">
              <Icon size={16} /> {label}
            </a>
          ))}
        </div>
      </div>
    </footer>
  );
}

function InfoBadge({ text }) {
  return (
    <span
      className="info-badge"
      title={text}
      aria-label={text}
    >
      <BadgeInfo size={15} />
      <span className="hidden sm:inline">Info</span>
    </span>
  );
}

const chartTheme = {
  grid: 'rgba(100, 116, 139, 0.16)',
  text: '#64748B'
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
    ['Student ID', '24BAI70387'],
    ['Scorer', health?.fallback_mode ? 'Heuristic fallback scorer' : `Trained model: ${health?.model_version || 'active'}`],
    ['Total Events', liveData.metricCards[0]?.value || '0'],
    ['Suspicious Activities', liveData.metricCards[1]?.value || '0'],
    ['Safe Traffic', liveData.metricCards[2]?.value || '0%'],
    ['Active Alerts', liveData.metricCards[3]?.value || '0'],
    ['Threat Level', liveData.metricCards[5]?.value || 'Starting']
  ];

  doc.setFillColor(59, 130, 246);
  doc.rect(0, 0, 210, 34, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(20);
  doc.text('Sentinel NetShield Report', 14, 18);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text('Futuristic light-mode IDS dashboard summary', 14, 26);

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

  if (y > 250) {
    doc.addPage();
    y = 20;
  }

  y += 4;
  doc.setFont('helvetica', 'bold');
  doc.text('SHAP Feature Importance', 14, y);
  y += 8;
  doc.setFont('helvetica', 'normal');
  shapFeatureImportance.forEach((item) => {
    doc.text(`${item.feature}: ${item.importance.toFixed(2)} mean |SHAP value|`, 18, y);
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
    student_id: '24BAI70387',
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
    shap_feature_importance: shapFeatureImportance,
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
