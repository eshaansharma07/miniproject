import { useEffect, useMemo, useState } from 'react';
import AlertFeed from './components/AlertFeed';
import EventForm from './components/EventForm';
import LiveTrafficTable from './components/LiveTrafficTable';
import MetricCard from './components/MetricCard';
import RiskGauge from './components/RiskGauge';
import { SCENARIOS, generateScenarioEvent, generateSyntheticEvent, getAlerts, getHealth, scoreEvent } from './api';

export default function App() {
  const [health, setHealth] = useState({ status: 'loading', model_version: '-', metrics: {} });
  const [events, setEvents] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [manualLoading, setManualLoading] = useState(false);
  const [streamOn, setStreamOn] = useState(true);
  const [streamMode, setStreamMode] = useState('mixed');
  const [activeScenario, setActiveScenario] = useState('smb-lateral');

  useEffect(() => {
    getHealth()
      .then((data) => setHealth(normalizeHealth(data)))
      .catch(() => setHealth(normalizeHealth({ fallback_mode: true, model_version: 'heuristic-v1', metrics: {} })));
    refreshAlerts();
  }, []);

  const statusTone = health.status === 'ok' ? 'safe' : health.status === 'degraded' ? 'warn' : 'danger';
  const statusLabel = health.status === 'degraded' ? 'demo mode' : health.status;

  useEffect(() => {
    if (!streamOn) return undefined;

    const timer = setInterval(async () => {
      try {
        const event = generateSyntheticEvent(streamMode);
        const result = await scoreEvent(event);
        pushEvent(event, result);
        if (result.risk_level === 'high' || result.risk_level === 'critical') {
          refreshAlerts();
        }
      } catch (_error) {
      }
    }, 2500);

    return () => clearInterval(timer);
  }, [streamMode, streamOn]);

  const threatIndex = useMemo(() => {
    if (!events.length) return 0;
    const avg = events.reduce((acc, item) => acc + item.score, 0) / events.length;
    return avg * 100;
  }, [events]);

  const incidentSummary = useMemo(() => {
    const critical = events.filter((event) => event.risk_level === 'critical').length;
    const high = events.filter((event) => event.risk_level === 'high').length;
    const intrusions = events.filter((event) => event.is_intrusion).length;
    const topThreat = events.find((event) => event.is_intrusion)?.threat_category || 'No active threat';

    return { critical, high, intrusions, topThreat };
  }, [events]);

  const recentReasons = useMemo(() => {
    const latestThreat = events.find((event) => event.reasons?.length);
    return latestThreat?.reasons?.slice(0, 3) || [];
  }, [events]);

  async function refreshAlerts() {
    try {
      const data = await getAlerts();
      setAlerts(data.alerts || []);
    } catch (_error) {
      setAlerts([]);
    }
  }

  async function onManualSubmit(payload) {
    setManualLoading(true);
    try {
      const result = await scoreEvent(payload);
      pushEvent(payload, result);
      if (result.risk_level === 'high' || result.risk_level === 'critical') {
        await refreshAlerts();
      }
    } finally {
      setManualLoading(false);
    }
  }

  async function simulateScenario(scenarioId) {
    setActiveScenario(scenarioId);
    setManualLoading(true);
    try {
      const payload = generateScenarioEvent(scenarioId);
      const result = await scoreEvent(payload);
      pushEvent(payload, result);
      if (result.risk_level === 'high' || result.risk_level === 'critical') {
        await refreshAlerts();
      }
    } finally {
      setManualLoading(false);
    }
  }

  function pushEvent(event, result) {
    const combined = { ...event, ...result };
    setEvents((prev) => [combined, ...prev].slice(0, 12));
  }

  return (
    <main className="app-shell">
      <header className="hero panel">
        <div className="hero-copy">
          <p className="eyebrow">AI-Native SOC Dashboard</p>
          <h1>Sentinel NetShield</h1>
          <p>
            Vercel-deployable intrusion detection with machine learning scoring, live telemetry,
            analyst-ready alerting, and explainable threat reasoning.
          </p>
          <div className="hero-badges">
            <span className={`status-pill ${statusTone}`}>API {statusLabel}</span>
            <span className="status-pill neutral">Model {health.model_version}</span>
            <span className={`status-pill ${health.fallback_mode ? 'warn' : 'safe'}`}>
              {health.fallback_mode ? 'Heuristic backup active' : 'Trained model active'}
            </span>
          </div>
        </div>
        <div className="hero-actions">
          <div className="toggle-group">
            <button className={streamMode === 'normal' ? 'active' : ''} onClick={() => setStreamMode('normal')}>Normal</button>
            <button className={streamMode === 'mixed' ? 'active' : ''} onClick={() => setStreamMode('mixed')}>Mixed</button>
            <button className={streamMode === 'attack' ? 'active' : ''} onClick={() => setStreamMode('attack')}>Attack</button>
          </div>
          <button onClick={() => setStreamOn((s) => !s)}>{streamOn ? 'Pause Stream' : 'Resume Stream'}</button>
          <p className="hero-meta">Stream cadence: 2.5 seconds per event</p>
        </div>
      </header>

      <section className="metrics-grid">
        <MetricCard
          label="Backend Status"
          value={statusLabel}
          accent={statusTone}
          subtext={health.fallback_mode ? 'Frontend fallback scorer is active' : 'Live API connection is active'}
        />
        <MetricCard label="Model Version" value={health.model_version} accent="neutral" />
        <MetricCard label="Events Scored" value={events.length} accent="info" subtext="Recent in-memory live window" />
        <MetricCard label="Active Alerts" value={alerts.length} accent={alerts.length ? 'danger' : 'safe'} subtext="High and critical cases" />
      </section>

      <section className="mission-grid">
        <RiskGauge value={threatIndex} />
        <section className="panel command-panel">
          <div className="panel-head">
            <h2>Command Brief</h2>
            <span>Live operational picture</span>
          </div>
          <div className="brief-grid">
            <article>
              <p>Intrusions</p>
              <h3>{incidentSummary.intrusions}</h3>
            </article>
            <article>
              <p>Critical</p>
              <h3>{incidentSummary.critical}</h3>
            </article>
            <article>
              <p>High</p>
              <h3>{incidentSummary.high}</h3>
            </article>
            <article>
              <p>Top threat</p>
              <h3>{incidentSummary.topThreat}</h3>
            </article>
          </div>
          <div className="reason-stack">
            <p className="stack-title">Latest analyst notes</p>
            {recentReasons.length ? recentReasons.map((reason) => <p key={reason}>{reason}</p>) : <p>No active threat explanations yet.</p>}
          </div>
        </section>
      </section>

      <section className="content-grid">
        <AlertFeed alerts={alerts} />
        <EventForm onSubmit={onManualSubmit} loading={manualLoading} />
      </section>

      <section className="panel scenario-panel">
        <div className="panel-head">
          <h2>Threat Simulation Lab</h2>
          <span>One-click scenarios for demos and viva walkthroughs</span>
        </div>
        <div className="scenario-grid">
          {SCENARIOS.map((scenario) => (
            <button
              key={scenario.id}
              className={`scenario-card ${activeScenario === scenario.id ? 'selected' : ''}`}
              onClick={() => simulateScenario(scenario.id)}
              disabled={manualLoading}
              type="button"
            >
              <span className={`badge ${scenario.profile}`}>{scenario.profile}</span>
              <h3>{scenario.label}</h3>
              <p>{scenario.description}</p>
            </button>
          ))}
        </div>
      </section>

      <LiveTrafficTable events={events} />

      <section className="metrics-grid lower-grid">
        <MetricCard
          label="Model Precision"
          value={health.metrics?.precision !== undefined ? `${(health.metrics.precision * 100).toFixed(1)}%` : 'N/A'}
          accent="safe"
          subtext="Held-out test estimate"
        />
        <MetricCard
          label="Model Recall"
          value={health.metrics?.recall !== undefined ? `${(health.metrics.recall * 100).toFixed(1)}%` : 'N/A'}
          accent="warn"
          subtext="Attack capture rate"
        />
        <MetricCard
          label="F1 Score"
          value={health.metrics?.f1 !== undefined ? health.metrics.f1.toFixed(3) : 'N/A'}
          accent="info"
          subtext="Balanced detection quality"
        />
        <MetricCard
          label="Decision Threshold"
          value={health.threshold !== undefined ? health.threshold.toFixed(2) : '0.60'}
          accent="neutral"
          subtext="Threshold tuned during training"
        />
      </section>
    </main>
  );
}

function normalizeHealth(data) {
  if (!data) {
    return { status: 'degraded', model_version: 'heuristic-v1', metrics: {}, fallback_mode: true, threshold: 0.6 };
  }

  if (data.fallback_mode) {
    return {
      ...data,
      status: 'degraded',
      model_version: data.model_version || 'heuristic-v1',
      metrics: data.metrics || {},
      threshold: data.threshold ?? 0.6
    };
  }

  return {
    ...data,
    status: data.status || 'ok',
    model_version: data.model_version || 'trained',
    metrics: data.metrics || {}
  };
}
