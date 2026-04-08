import {
  Activity,
  AlertTriangle,
  BarChart3,
  BrainCircuit,
  CheckCircle2,
  Code2,
  Clock3,
  Database,
  Download,
  ExternalLink,
  FileText,
  LineChart,
  Lock,
  Mail,
  Radar,
  ScanSearch,
  Shield,
  ShieldAlert,
  Siren,
  Sparkles,
  Target,
  Zap
} from 'lucide-react';

export const navItems = ['Dashboard', 'Threat Analysis', 'Model Performance', 'Reports', 'About'];

export const heroStats = [
  { label: 'Threats Detected', value: '128', subtext: 'this week' },
  { label: 'Accuracy', value: '94.8%', subtext: 'validation score' },
  { label: 'Live Alerts', value: '12', subtext: 'active queue' }
];

export const metricCards = [
  { label: 'Total Network Events', value: '12,480', trend: '+8.2%', icon: Database },
  { label: 'Suspicious Activities', value: '426', trend: '-3.1%', icon: ShieldAlert },
  { label: 'Safe Traffic', value: '96.6%', trend: '+2.4%', icon: CheckCircle2 },
  { label: 'Active Alerts', value: '12', trend: '+1.8%', icon: Siren },
  { label: 'Model Accuracy', value: '94.8%', trend: '+0.7%', icon: BrainCircuit },
  { label: 'Threat Level', value: 'Medium', trend: 'stable', icon: Radar }
];

export const attackDistribution = [
  { name: 'Normal Traffic', value: 62 },
  { name: 'DDoS', value: 13 },
  { name: 'Brute Force', value: 9 },
  { name: 'Port Scan', value: 7 },
  { name: 'Malware', value: 5 },
  { name: 'Phishing', value: 4 }
];

export const attacksPerDay = [
  { day: 'Mon', attacks: 18 },
  { day: 'Tue', attacks: 23 },
  { day: 'Wed', attacks: 19 },
  { day: 'Thu', attacks: 31 },
  { day: 'Fri', attacks: 27 },
  { day: 'Sat', attacks: 15 },
  { day: 'Sun', attacks: 12 }
];

export const threatActivity = [
  { time: '09:00', score: 21 },
  { time: '10:00', score: 28 },
  { time: '11:00', score: 35 },
  { time: '12:00', score: 32 },
  { time: '13:00', score: 47 },
  { time: '14:00', score: 42 },
  { time: '15:00', score: 38 }
];

export const trafficComparison = [
  { time: '09:00', safe: 820, malicious: 42 },
  { time: '10:00', safe: 910, malicious: 55 },
  { time: '11:00', safe: 860, malicious: 61 },
  { time: '12:00', safe: 940, malicious: 48 },
  { time: '13:00', safe: 900, malicious: 76 },
  { time: '14:00', safe: 970, malicious: 69 },
  { time: '15:00', safe: 1010, malicious: 58 }
];

export const rocCurve = [
  { fpr: 0, tpr: 0 },
  { fpr: 0.03, tpr: 0.54 },
  { fpr: 0.08, tpr: 0.76 },
  { fpr: 0.15, tpr: 0.88 },
  { fpr: 0.26, tpr: 0.94 },
  { fpr: 0.48, tpr: 0.98 },
  { fpr: 1, tpr: 1 }
];

export const precisionRecall = [
  { recall: 0.22, precision: 0.98 },
  { recall: 0.42, precision: 0.96 },
  { recall: 0.62, precision: 0.94 },
  { recall: 0.78, precision: 0.93 },
  { recall: 0.92, precision: 0.91 },
  { recall: 1, precision: 0.87 }
];

export const accuracyComparison = [
  { model: 'Logistic Regression', accuracy: 94.8 },
  { model: 'Decision Tree', accuracy: 91.4 },
  { model: 'Random Forest', accuracy: 96.2 },
  { model: 'XGBoost', accuracy: 97.1 },
  { model: 'Neural Network', accuracy: 95.6 }
];

export const confusionMatrix = [
  { label: 'True Negative', value: 1128, tone: 'from-emerald-400/35 to-emerald-500/10' },
  { label: 'False Positive', value: 42, tone: 'from-yellow-400/30 to-yellow-500/10' },
  { label: 'False Negative', value: 51, tone: 'from-orange-400/30 to-orange-500/10' },
  { label: 'True Positive', value: 1179, tone: 'from-emerald-400/35 to-orange-400/10' }
];

export const shapFeatureImportance = [
  { feature: 'Packets per second', importance: 0.34, explanation: 'Fast packet bursts often indicate scans, DDoS attempts, or lateral movement.' },
  { feature: 'Failed logins', importance: 0.29, explanation: 'Repeated failed authentication attempts strongly support brute-force detection.' },
  { feature: 'Bytes ratio', importance: 0.25, explanation: 'Outbound-heavy traffic can indicate payload delivery or data exfiltration.' },
  { feature: 'Destination port', importance: 0.21, explanation: 'Ports such as 22, 445, and 3389 are commonly abused in intrusions.' },
  { feature: 'Unusual flag', importance: 0.18, explanation: 'Suspicious protocol/header flags increase the anomaly score.' },
  { feature: 'Duration', importance: 0.12, explanation: 'Very short high-volume sessions can signal aggressive probing.' },
  { feature: 'Bytes sent', importance: 0.1, explanation: 'Large outbound transfers add risk when combined with other indicators.' }
];

export const modelMetrics = [
  { label: 'Accuracy', value: '94.8%' },
  { label: 'Precision', value: '92.3%' },
  { label: 'Recall', value: '91.7%' },
  { label: 'F1 Score', value: '92.0%' },
  { label: 'ROC-AUC', value: '96.1%' }
];

export const liveThreats = [
  {
    timestamp: '08 Apr 2026, 10:42 AM',
    source: '192.168.1.24',
    destination: '10.0.2.15',
    type: 'Brute Force',
    severity: 'high',
    status: 'Investigating'
  },
  {
    timestamp: '08 Apr 2026, 10:37 AM',
    source: '172.16.8.11',
    destination: '10.0.0.8',
    type: 'Port Scan',
    severity: 'medium',
    status: 'Queued'
  },
  {
    timestamp: '08 Apr 2026, 10:29 AM',
    source: '203.0.113.42',
    destination: '10.0.4.21',
    type: 'DDoS',
    severity: 'critical',
    status: 'Blocked'
  },
  {
    timestamp: '08 Apr 2026, 10:18 AM',
    source: '10.0.3.19',
    destination: '10.0.3.9',
    type: 'Normal Traffic',
    severity: 'safe',
    status: 'Allowed'
  },
  {
    timestamp: '08 Apr 2026, 10:02 AM',
    source: '198.51.100.17',
    destination: '10.0.7.5',
    type: 'SQL Injection',
    severity: 'high',
    status: 'Blocked'
  }
];

export const reports = [
  { title: 'Download PDF Report', description: 'Evaluator-ready model summary and architecture notes.', icon: FileText },
  { title: 'Download CSV Logs', description: 'Export recent scored events for auditing.', icon: Download },
  { title: 'Download Threat Summary', description: 'Simple business summary of threats and actions.', icon: BarChart3 }
];

export const valueCards = [
  { title: 'Prevents Cyberattacks', description: 'Flags suspicious patterns before they become incidents.', icon: Shield },
  { title: 'Reduces Response Time', description: 'Prioritizes high-risk events so analysts act faster.', icon: Clock3 },
  { title: 'Helps Security Analysts', description: 'Turns raw traffic into simple alerts and status labels.', icon: ScanSearch },
  { title: 'Smarter ML Detection', description: 'Uses classification metrics to improve detection quality.', icon: Sparkles },
  { title: 'Real-Time Monitoring', description: 'Designed for streaming logs, alerts, and dashboards.', icon: Activity }
];

export const technologyGroups = [
  { title: 'Frontend', items: ['React', 'Tailwind CSS', 'Recharts', 'Framer Motion', 'Lucide React'] },
  { title: 'Backend & Data', items: ['Node.js', 'Express', 'MongoDB', 'Python', 'Scikit-learn'] },
  { title: 'ML Concepts', items: ['Classification', 'Imbalanced Learning', 'Precision/Recall', 'ROC-AUC', 'Logging'] }
];

export const footerLinks = [
  { label: 'GitHub', href: 'https://github.com/eshaansharma07/miniproject', icon: Code2 },
  { label: 'LinkedIn', href: '#', icon: ExternalLink },
  { label: 'Contact', href: 'mailto:sentinel.netshield@example.com', icon: Mail }
];

export const projectFacts = [
  { label: 'Vertical', value: 'AI/ML' },
  { label: 'Project Type', value: 'Industry' },
  { label: 'Complexity', value: 'Intermediate' },
  { label: 'Objective', value: 'Improve detection rate while controlling false positives' }
];

export const heroIllustrationNodes = [
  { label: 'Network Logs', icon: Database, position: 'left-5 top-10' },
  { label: 'ML Scoring', icon: BrainCircuit, position: 'right-8 top-24' },
  { label: 'Alert Engine', icon: Target, position: 'left-12 bottom-12' },
  { label: 'SOC Dashboard', icon: LineChart, position: 'right-12 bottom-8' }
];

export const chartColors = ['#f97316', '#fbbf24', '#ef4444', '#22c55e', '#38bdf8', '#a78bfa'];

export const chartTheme = {
  grid: 'rgba(255,255,255,0.08)',
  text: '#cbd5e1',
  orange: '#f97316',
  amber: '#fbbf24',
  green: '#22c55e',
  red: '#ef4444'
};
