const API_BASE = import.meta.env.VITE_API_URL || (import.meta.env.DEV ? 'http://localhost:8000' : '/api');
const ALERTS_KEY = 'sentinel_local_alerts';

export const SCENARIOS = [
  {
    id: 'normal-web',
    label: 'Normal web traffic',
    description: 'Baseline browsing flow with low likelihood of malicious intent.',
    profile: 'low'
  },
  {
    id: 'smb-lateral',
    label: 'SMB lateral movement',
    description: 'East-west movement over port 445 with elevated packet pressure.',
    profile: 'critical'
  },
  {
    id: 'rdp-bruteforce',
    label: 'RDP brute force',
    description: 'Repeated login failures against a remote access service.',
    profile: 'high'
  },
  {
    id: 'dns-exfil',
    label: 'Data exfiltration',
    description: 'Outbound-heavy transfer pattern with suspicious byte ratio.',
    profile: 'high'
  }
];

export async function getHealth() {
  try {
    const res = await fetch(`${API_BASE}/health`);
    if (!res.ok) throw new Error('Failed health check');
    return res.json();
  } catch (_error) {
    return {
      status: 'ok',
      model_version: 'heuristic-v1',
      fallback_mode: true,
      threshold: 0.6,
      metrics: {}
    };
  }
}

export async function scoreEvent(payload) {
  const body = { ...payload, timestamp: new Date().toISOString() };
  try {
    const res = await fetch(`${API_BASE}/score`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });
    if (!res.ok) throw new Error('Scoring failed');
    return res.json();
  } catch (_error) {
    const result = localScoreEvent(body);
    if (result.risk_level === 'high' || result.risk_level === 'critical') {
      persistAlert(body, result);
    }
    return result;
  }
}

export async function getAlerts(limit = 12) {
  try {
    const res = await fetch(`${API_BASE}/alerts?limit=${limit}`);
    if (!res.ok) throw new Error('Failed to load alerts');
    return res.json();
  } catch (_error) {
    return { alerts: readAlerts().slice(0, limit) };
  }
}

export function generateSyntheticEvent(mode = 'mixed') {
  const suspicious = mode === 'attack' ? true : mode === 'normal' ? false : Math.random() > 0.68;

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

export function generateScenarioEvent(scenarioId) {
  switch (scenarioId) {
    case 'smb-lateral':
      return {
        src_ip: '10.42.1.18',
        dst_ip: '10.42.7.44',
        src_port: 53112,
        dst_port: 445,
        protocol: 'tcp',
        bytes_sent: 14600,
        bytes_received: 1200,
        duration_ms: 140,
        packets: 188,
        failed_logins: 1,
        unusual_flag: 1
      };
    case 'rdp-bruteforce':
      return {
        src_ip: '172.20.14.9',
        dst_ip: '10.0.0.22',
        src_port: 49811,
        dst_port: 3389,
        protocol: 'tcp',
        bytes_sent: 7600,
        bytes_received: 880,
        duration_ms: 210,
        packets: 132,
        failed_logins: 5,
        unusual_flag: 1
      };
    case 'dns-exfil':
      return {
        src_ip: '10.21.7.4',
        dst_ip: '8.8.8.8',
        src_port: 54000,
        dst_port: 53,
        protocol: 'udp',
        bytes_sent: 18400,
        bytes_received: 900,
        duration_ms: 260,
        packets: 162,
        failed_logins: 0,
        unusual_flag: 1
      };
    default:
      return {
        src_ip: '192.168.10.34',
        dst_ip: '142.250.183.78',
        src_port: 51420,
        dst_port: 443,
        protocol: 'tcp',
        bytes_sent: 1440,
        bytes_received: 2980,
        duration_ms: 920,
        packets: 26,
        failed_logins: 0,
        unusual_flag: 0
      };
  }
}

function localScoreEvent(event) {
  const threshold = 0.6;
  const score = heuristicScore(event);
  const reasons = buildReasons(event, score, threshold);

  return {
    is_intrusion: score >= threshold,
    score,
    threshold,
    risk_level: computeRiskLevel(score),
    threat_category: categorizeThreat(event, reasons),
    disposition: disposition(score),
    reasons,
    model_version: 'heuristic-v1'
  };
}

function heuristicScore(event) {
  const bytesSent = Number(event.bytes_sent || 0);
  const bytesReceived = Number(event.bytes_received || 0);
  const packets = Number(event.packets || 0);
  const durationMs = Number(event.duration_ms || 0);
  const failedLogins = Number(event.failed_logins || 0);
  const unusualFlag = Number(event.unusual_flag || 0);
  const dstPort = Number(event.dst_port || 0);

  let score = 0;
  if (unusualFlag >= 1) score += 0.2;
  if (failedLogins >= 1) score += Math.min(0.25, failedLogins * 0.06);
  if (packets > 120 && durationMs < 350) score += 0.18;
  if (bytesSent > (bytesReceived + 1) * 3) score += 0.15;
  if ([22, 3389, 445].includes(dstPort)) score += 0.14;
  if (bytesSent > 8000) score += 0.1;

  return Math.max(0, Math.min(1, Number(score.toFixed(4))));
}

function computeRiskLevel(score) {
  if (score >= 0.9) return 'critical';
  if (score >= 0.75) return 'high';
  if (score >= 0.5) return 'medium';
  return 'low';
}

function buildReasons(event, score, threshold) {
  const reasons = [];
  const bytesSent = Number(event.bytes_sent || 0);
  const bytesReceived = Number(event.bytes_received || 0);
  const packets = Number(event.packets || 0);
  const durationMs = Number(event.duration_ms || 0);
  const failedLogins = Number(event.failed_logins || 0);
  const unusualFlag = Number(event.unusual_flag || 0);
  const dstPort = Number(event.dst_port || 0);

  if (unusualFlag) reasons.push('Unexpected protocol flag or suspicious header behavior detected.');
  if (failedLogins >= 3) reasons.push('Repeated authentication failures resemble brute-force activity.');
  else if (failedLogins > 0) reasons.push('Authentication failures increase attack likelihood.');
  if ([22, 445, 3389].includes(dstPort)) reasons.push('Traffic targets a sensitive service commonly abused during intrusion attempts.');
  if (packets >= 150 && durationMs <= 250) reasons.push('High packet rate over a short session suggests aggressive probing or lateral movement.');
  if (bytesSent > (bytesReceived + 1) * 4) reasons.push('Outbound-heavy transfer pattern may indicate payload delivery or exfiltration.');
  if (score >= 0.9) reasons.push('Composite model score exceeds the critical-response threshold.');
  else if (score >= threshold) reasons.push('Model confidence is above the automated intrusion threshold.');

  return reasons.length ? reasons : ['Traffic pattern remains within expected behavioral bounds.'];
}

function categorizeThreat(event, reasons) {
  const dstPort = Number(event.dst_port || 0);
  const failedLogins = Number(event.failed_logins || 0);
  const bytesSent = Number(event.bytes_sent || 0);
  const bytesReceived = Number(event.bytes_received || 0);

  if (failedLogins >= 3 && [22, 3389].includes(dstPort)) return 'Credential attack';
  if (dstPort === 445) return 'Lateral movement';
  if (bytesSent > (bytesReceived + 1) * 4) return 'Possible exfiltration';
  if (reasons.some((reason) => reason.toLowerCase().includes('flag'))) return 'Protocol anomaly';
  return reasons.length === 1 && reasons[0].toLowerCase().includes('expected') ? 'Benign traffic' : 'Suspicious activity';
}

function disposition(score) {
  if (score >= 0.9) return 'Escalate immediately';
  if (score >= 0.6) return 'Investigate and contain';
  if (score >= 0.45) return 'Monitor closely';
  return 'Allow';
}

function persistAlert(event, result) {
  const alerts = readAlerts();
  alerts.unshift({
    id: Date.now(),
    created_at: new Date().toISOString(),
    src_ip: event.src_ip,
    dst_ip: event.dst_ip,
    risk_level: result.risk_level,
    score: result.score,
    summary: `Suspicious flow ${event.src_ip} -> ${event.dst_ip}`
  });
  localStorage.setItem(ALERTS_KEY, JSON.stringify(alerts.slice(0, 25)));
}

function readAlerts() {
  try {
    return JSON.parse(localStorage.getItem(ALERTS_KEY) || '[]');
  } catch (_error) {
    return [];
  }
}
