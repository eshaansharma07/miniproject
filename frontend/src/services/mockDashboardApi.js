export {
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
} from '../data/dashboardData';

export async function getDashboardSnapshot() {
  return import('../data/dashboardData');
}
