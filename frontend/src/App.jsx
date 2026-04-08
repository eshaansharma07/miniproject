import { useState } from 'react';
import { motion } from 'framer-motion';
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
import ChartCard from './components/ChartCard';
import LiveThreatFeed from './components/LiveThreatFeed';
import MetricCard from './components/MetricCard';
import SectionHeader from './components/SectionHeader';
import {
  accuracyComparison,
  attackDistribution,
  attacksPerDay,
  chartColors,
  chartTheme,
  confusionMatrix,
  footerLinks,
  heroIllustrationNodes,
  heroStats,
  liveThreats,
  metricCards,
  modelMetrics,
  navItems,
  precisionRecall,
  projectFacts,
  reports,
  rocCurve,
  technologyGroups,
  threatActivity,
  trafficComparison,
  valueCards
} from './services/mockDashboardApi';

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  visible: { opacity: 1, y: 0 }
};

export default function App() {
  const [lightMode, setLightMode] = useState(false);

  return (
    <main className={lightMode ? 'bg-slate-100 text-slate-950' : 'text-slate-50'}>
      <div className={lightMode ? 'min-h-screen bg-gradient-to-br from-orange-50 via-white to-amber-50' : 'min-h-screen'}>
        <Navbar lightMode={lightMode} onToggleMode={() => setLightMode((value) => !value)} />
        <Hero />
        <DashboardMetrics />
        <ThreatAnalysis />
        <ModelPerformance />
        <LiveThreatFeed rows={liveThreats} />
        <Reports />
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

function Hero() {
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
          {heroStats.map((stat) => (
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

function DashboardMetrics() {
  return (
    <section id="dashboard-metrics" className="section-shell">
      <SectionHeader
        eyebrow="Dashboard"
        title="Simple Security Snapshot"
        description="Evaluator-friendly metrics that show what the system monitors, how much traffic is safe, and whether active alerts need attention."
      />
      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {metricCards.map((card) => (
          <MetricCard key={card.label} {...card} />
        ))}
      </div>
    </section>
  );
}

function ThreatAnalysis() {
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

function ModelPerformance() {
  return (
    <section id="model-performance" className="section-shell">
      <SectionHeader
        eyebrow="Machine Learning Performance"
        title="Model Quality Without Confusing Jargon"
        description="The UI explains accuracy, precision, recall, F1 score, ROC-AUC, and class-balance performance in a way evaluators can quickly follow."
      />
      <div className="mb-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        {modelMetrics.map((metric) => (
          <div key={metric.label} className="glass-card p-5 text-center">
            <p className="text-sm text-slate-400">{metric.label}</p>
            <p className="mt-2 text-3xl font-black text-white">{metric.value}</p>
          </div>
        ))}
      </div>
      <div className="grid gap-5 lg:grid-cols-2">
        <ChartCard title="ROC Curve" subtitle="AUC: 96.1%. Higher curve means stronger separation between safe and malicious traffic.">
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

function Reports() {
  return (
    <section id="reports" className="section-shell">
      <SectionHeader
        eyebrow="Reports"
        title="Downloadable Outputs For Evaluation"
        description="The frontend is structured so these cards can later connect to real PDF, CSV, and threat-summary endpoints."
      />
      <div className="grid gap-5 md:grid-cols-3">
        {reports.map(({ title, description, icon: Icon }) => (
          <article key={title} className="glass-card p-6">
            <div className="metric-icon"><Icon size={22} /></div>
            <h3 className="mt-6 text-xl font-bold text-white">{title}</h3>
            <p className="mt-3 text-sm leading-6 text-slate-300">{description}</p>
            <button className="secondary-button mt-6 w-full" type="button">Download</button>
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
