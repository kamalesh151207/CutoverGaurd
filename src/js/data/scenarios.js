/**
 * Scenario Lab Configuration Defaults
 */

export const SCENARIO_DEFAULTS = {
  baseDemandRate: 40,
  initialStock: 600,
  defaultBufferDays: 3,
  scenarios: {
    baseline: {
      id: 'A',
      name: 'BASELINE',
      description: 'Expected nominal production schedule (40u/day) and confirmed vendor dispatch date (Dec 10).'
    },
    demandSurge: {
      id: 'B',
      name: 'DEMAND SURGE (+35%)',
      description: 'Customer pull requires increased plant throughput (54u/day), rapidly accelerating inventory burn.',
      nominalSurgePct: 35
    },
    supplierDelay: {
      id: 'C',
      name: 'SUPPLIER DELAY (+6 DAYS)',
      description: 'Port bottleneck delays replacement delivery to Dec 16. Threatens line starvation if cutover attempted early.',
      nominalDelayDays: 6
    }
  }
};
