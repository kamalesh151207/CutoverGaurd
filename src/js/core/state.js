/**
 * Central Application State
 */
import { eventBus } from './event-bus.js';

export const INITIAL_STATE = {
  theme: 'light',
  ecn: 'ECN-0248',
  componentOld: 'COMP-A-104',
  componentNew: 'COMP-B-208',
  baseDemand: 40,
  initialOldStock: 680,
  newMaterialReadyDay: 11,
  optimalCutoverDay: 15,
  lrmDay: 19,
  selectedCutoverDay: 15,
  
  // Scenario Lab inputs
  scenarios: {
    demandVariation: 0,   // %
    supplierDelay: 0,     // days
    stockOnHand: 600,     // units
    safetyBuffer: 3       // days
  },

  // Stochastic simulation inputs
  monteCarlo: {
    runs: 500,
    demandSigma: 0.15,
    leadTimeJitter: 3
  },

  // Sourcing resilience inputs
  sourcing: {
    leadTime: 25,
    variability: 3,
    poStatus: 'confirmed',
    dualSource: 'yes'
  },

  // Walkthrough
  walkthroughStep: 0
};

let state = JSON.parse(JSON.stringify(INITIAL_STATE));

export function getState() {
  return state;
}

export function setState(updates) {
  state = { ...state, ...updates };
  eventBus.emit('state:changed', state);
  return state;
}

export function updateScenarioState(updates) {
  state.scenarios = { ...state.scenarios, ...updates };
  eventBus.emit('scenarios:changed', state.scenarios);
}

export function updateMonteCarloState(updates) {
  state.monteCarlo = { ...state.monteCarlo, ...updates };
  eventBus.emit('monteCarlo:changed', state.monteCarlo);
}

export function updateSourcingState(updates) {
  state.sourcing = { ...state.sourcing, ...updates };
  eventBus.emit('sourcing:changed', state.sourcing);
}
