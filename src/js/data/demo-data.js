/**
 * Static Demonstration & Engineering Change Data
 */

export const SYNTHETIC_ECNS = [
  {
    id: 'ECN-0248',
    partOld: 'COMP-A-104',
    partNew: 'COMP-B-208',
    revision: 'Rev C → Rev D',
    changeType: 'Component Obsolescence / Form-Fit-Function Upgrade',
    reason: 'IC chip pinout modernization & high-thermal grade qualification',
    createdDate: '2026-11-15',
    plannedDate: '15-DEC-2026',
    initialStock: 680,
    dailyDemand: 40,
    dockDay: 11,
    status: 'Awaiting Planner Sign-Off',
    statusCode: 'IN_REVIEW',
    readiness: 'READY',
    inputs: {
      inventory: { label: 'Inventory Balances', status: 'READY', detail: '680 units on-hand' },
      bom: { label: 'BOM Structure', status: 'READY', detail: 'Parent Subassembly Assy-902' },
      demand: { label: 'Demand Forecast', status: 'READY', detail: '40 units/day rate' },
      materialReady: { label: 'Replacement Material', status: 'READY', detail: 'Dock ready Day 11' },
      leadTime: { label: 'Supplier Lead Time', status: 'READY', detail: '25 days confirmed PO' },
      productionSchedule: { label: 'Plant Line Schedule', status: 'READY', detail: 'Line 3 Shift Active' }
    }
  },
  {
    id: 'ECN-0199',
    partOld: 'VALVE-HYD-04',
    partNew: 'VALVE-HYD-05',
    revision: 'Rev A → Rev B',
    changeType: 'Sealing Tolerance Engineering Improvement',
    reason: 'Leakage mitigation for high-pressure hydraulic manifold',
    createdDate: '2026-11-08',
    plannedDate: '18-DEC-2026',
    initialStock: 420,
    dailyDemand: 25,
    dockDay: 14,
    status: 'Data Quality Pending',
    statusCode: 'DATA_PENDING',
    readiness: 'NEEDS_VALIDATION',
    inputs: {
      inventory: { label: 'Inventory Balances', status: 'READY', detail: '420 units on-hand' },
      bom: { label: 'BOM Structure', status: 'READY', detail: 'Parent Subassembly Valve-Block' },
      demand: { label: 'Demand Forecast', status: 'READY', detail: '25 units/day rate' },
      materialReady: { label: 'Replacement Material', status: 'NEEDS_VALIDATION', detail: 'Dock expected Day 14' },
      leadTime: { label: 'Supplier Lead Time', status: 'READY', detail: '18 days confirmed' },
      productionSchedule: { label: 'Plant Line Schedule', status: 'NEEDS_VALIDATION', detail: 'Line 1 maintenance window' }
    }
  },
  {
    id: 'ECN-0312',
    partOld: 'BRACKET-STL-88',
    partNew: 'BRACKET-ALU-90',
    revision: 'Rev B → Rev C',
    changeType: 'Weight Optimization & Material Substitution',
    reason: 'Subsystem mass reduction target (-180g chassis saving)',
    createdDate: '2026-11-18',
    plannedDate: '22-DEC-2026',
    initialStock: 950,
    dailyDemand: 50,
    dockDay: 16,
    status: 'Supplier Lead Time Missing',
    statusCode: 'MISSING_DATA',
    readiness: 'MISSING',
    inputs: {
      inventory: { label: 'Inventory Balances', status: 'READY', detail: '950 units on-hand' },
      bom: { label: 'BOM Structure', status: 'READY', detail: 'Chassis Frame Structural' },
      demand: { label: 'Demand Forecast', status: 'NEEDS_VALIDATION', detail: '50 units/day estimated' },
      materialReady: { label: 'Replacement Material', status: 'MISSING', detail: 'Unconfirmed supplier' },
      leadTime: { label: 'Supplier Lead Time', status: 'MISSING', detail: 'Lead time unverified' },
      productionSchedule: { label: 'Plant Line Schedule', status: 'READY', detail: 'Line 2 Active' }
    }
  }
];

export const INITIAL_AUDIT_ENTRIES = [
  {
    id: 'REC-001',
    type: 'DATA_QUALITY_INGESTION',
    ts: '2026-11-22T08:14:02Z',
    data: { ecn: 'ECN-0248', componentOld: 'COMP-A-104', initialStock: 680, dqResult: 'PASS' },
    prevHash: '0000000000000000000000000000000000000000000000000000000000000000'
  },
  {
    id: 'REC-002',
    type: 'CUTOVER_CURVE_OPTIMIZATION',
    ts: '2026-11-22T08:14:05Z',
    data: { optWindow: '11-19 DEC', minCostDate: '15 DEC', costIndex: 82.4, lrmDate: '19 DEC' },
    prevHash: ''
  },
  {
    id: 'REC-003',
    type: 'MONTE_CARLO_VERIFICATION',
    ts: '2026-11-22T08:14:08Z',
    data: { runs: 500, shortageRisk: '0.8%', confidence: '99.2%' },
    prevHash: ''
  },
  {
    id: 'REC-004',
    type: 'PLANNER_APPROVAL_COMMIT',
    ts: '2026-11-22T08:14:15Z',
    data: { plannerId: 'PLN-8842', action: 'APPROVED', cutoverCommitted: '15 DEC' },
    prevHash: ''
  }
];

export const DECISION_HISTORY_RECORDS = [
  {
    id: 'DEC-2026-004',
    ecn: 'ECN-0248',
    parts: 'COMP-A-104 → COMP-B-208',
    runVersion: 'v1.4 (Deterministic Netting)',
    recommendedDate: '15-DEC-2026',
    feasibleWindow: '11-DEC to 19-DEC',
    lrm: '19-DEC-2026',
    costIndex: 82.4,
    excessStock: '120 units',
    shortageRisk: '0.0%',
    action: 'APPROVED',
    planner: 'PLN-8842 (Senior Plant Planner)',
    timestamp: '2026-11-22 14:32:10 UTC',
    status: 'COMMITTED',
    hash: '7f9a882ce9918bc3044ea1b0'
  },
  {
    id: 'DEC-2026-003',
    ecn: 'ECN-0248',
    parts: 'COMP-A-104 → COMP-B-208',
    runVersion: 'v1.3 (Demand Surge +35% Contingency)',
    recommendedDate: '13-DEC-2026',
    feasibleWindow: '11-DEC to 16-DEC',
    lrm: '16-DEC-2026',
    costIndex: 94.6,
    excessStock: '45 units',
    shortageRisk: '2.4%',
    action: 'RECALCULATED',
    planner: 'PLN-8842 (Senior Plant Planner)',
    timestamp: '2026-11-22 11:15:44 UTC',
    status: 'SUPERSEDED',
    hash: '3c8e110b9948aa019488f290'
  },
  {
    id: 'DEC-2026-002',
    ecn: 'ECN-0199',
    parts: 'VALVE-HYD-04 → VALVE-HYD-05',
    runVersion: 'v1.0 (Initial Run)',
    recommendedDate: '18-DEC-2026',
    feasibleWindow: '14-DEC to 22-DEC',
    lrm: '22-DEC-2026',
    costIndex: 110.2,
    excessStock: '70 units',
    shortageRisk: '1.2%',
    action: 'DEFERRED',
    planner: 'PLN-5120 (Supply Chain Lead)',
    timestamp: '2026-11-21 16:40:02 UTC',
    status: 'DEFERRED',
    hash: '9a4d771e88cd993411b02844'
  }
];

export const EXPLANATION_PRESETS = {
  accurate: "For ECN-0248, transitioning on 15 DEC provides an optimal balance with 120 units of old stock remaining and 0 units of shortage exposure, achieving a relative cost index of 82.4 within the feasible boundary.",
  hallucinated: "For ECN-0248, transitioning on 04 DEC provides an optimal balance with only 12 units of old stock remaining and 45 units of shortage exposure, achieving an exceptional cost index of 41.2."
};
