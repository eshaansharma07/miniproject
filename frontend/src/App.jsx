import { useEffect, useMemo, useState } from 'react';
import AlertFeed from './components/AlertFeed';
import EventForm from './components/EventForm';
import LiveTrafficTable from './components/LiveTrafficTable';
import MetricCard from './components/MetricCard';
import RiskGauge from './components/RiskGauge';
import { generateSyntheticEvent, getAlerts, getHealth, scoreEvent } from './api';

export default function App() {
  const [health, setHealth] = useState({ status: 'loading', model_version: '-' });
  const [events, setEvents] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [manualLoading, setManualLoading] = useState(false);
  const [streamOn, setStreamOn] = useState(true);

  useEffect(() => {
    getHealth().then(setHealth).catch(() => setHealth({ status: 'offline', model_version: 'none' }));
    refreshAlerts();
  }, []);

  useEffect(() => {
    if (!streamOn) return undefined;

    const timer = setInterval(async () => {
      try {
        const event = generateSyntheticEvent();
        const result = await scoreEvent(event);
        const combined = { ...event, ...result };
        setEvents((prev) => [combined, ...prev].slice(0, 12));
        if (result.risk_level === 'high' || result.risk_level === 'critical') {
          refreshAlerts();
        }
      } catch (_error) {
      }
    }, 2500);

    return () => clearInterval(timer);
  }, [streamOn]);

  const threatIndex = useMemo(() => {
    if (!events.length) return 0;
    const avg = events.reduce((acc, item) => acc + item.score, 0) / events.length;
    return avg * 100;
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
      setEvents((prev) => [{ ...payload, ...result }, ...prev].slice(0, 12));
      if (result.risk_level === 'high' || result.risk_level === 'critical') {
        await refreshAlerts();
      }
    } finally {
      setManualLoading(false);
    }
  }

  return (
    <main className="app-shell">
      <header className="hero">
        <div>
          <h1>Sentinel NetShield</h1>
          <p>Intrusion detection on streaming traffic with ML scoring, SOC alerts, and explainable risk output.</p>
        </div>
        <div className="hero-actions">
          <button onClick={() => setStreamOn((s) => !s)}>{streamOn ? 'Pause Stream' : 'Resume Stream'}</button>
        </div>
      </header>

      <section className="metrics-grid">
        <MetricCard label="Backend Status" value={health.status} accent={health.status === 'ok' ? 'safe' : 'danger'} />
        <MetricCard label="Model Version" value={health.model_version} accent="neutral" />
        <MetricCard label="Events Scored" value={events.length} accent="info" />
        <MetricCard label="Active Alerts" value={alerts.length} accent={alerts.length ? 'danger' : 'safe'} />
      </section>

      <section className="content-grid">
        <RiskGauge value={threatIndex} />
        <AlertFeed alerts={alerts} />
        <EventForm onSubmit={onManualSubmit} loading={manualLoading} />
      </section>

      <LiveTrafficTable events={events} />
    </main>
  );
}
