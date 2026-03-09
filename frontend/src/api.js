const API_BASE = import.meta.env.VITE_API_URL || (import.meta.env.DEV ? 'http://localhost:8000' : '/api');

export async function getHealth() {
  const res = await fetch(`${API_BASE}/health`);
  if (!res.ok) throw new Error('Failed health check');
  return res.json();
}

export async function scoreEvent(payload) {
  const body = { ...payload, timestamp: new Date().toISOString() };
  const res = await fetch(`${API_BASE}/score`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  });
  if (!res.ok) throw new Error('Scoring failed');
  return res.json();
}

export async function getAlerts(limit = 12) {
  const res = await fetch(`${API_BASE}/alerts?limit=${limit}`);
  if (!res.ok) throw new Error('Failed to load alerts');
  return res.json();
}

export function generateSyntheticEvent() {
  const suspicious = Math.random() > 0.7;

  return {
    src_ip: suspicious ? '10.0.0.7' : `192.168.1.${Math.floor(Math.random() * 180) + 2}`,
    dst_ip: suspicious ? '172.16.0.12' : '8.8.8.8',
    src_port: suspicious ? 52311 : 443,
    dst_port: suspicious ? 445 : 80,
    protocol: suspicious ? 'tcp' : 'udp',
    bytes_sent: suspicious ? 7000 + Math.floor(Math.random() * 5000) : 900 + Math.floor(Math.random() * 1200),
    bytes_received: suspicious ? 200 + Math.floor(Math.random() * 500) : 1100 + Math.floor(Math.random() * 1300),
    duration_ms: suspicious ? 120 + Math.floor(Math.random() * 150) : 700 + Math.floor(Math.random() * 400),
    packets: suspicious ? 110 + Math.floor(Math.random() * 80) : 10 + Math.floor(Math.random() * 30),
    failed_logins: suspicious ? Math.floor(Math.random() * 5) + 1 : 0,
    unusual_flag: suspicious ? 1 : 0
  };
}
