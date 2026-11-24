/**
 * High-Level Calculation & Decision Intelligence Orchestration Service
 * Integrates Deterministic Netting, Cost Modeling, Pareto Optimization,
 * Digital Cutover Twin Simulation, and Cutover Intelligence AI Engine.
 */
import { CutoverModel } from '../models/cutover-model.js';
import { CostModel } from '../models/cost-model.js';
import { ParetoModel } from '../models/pareto-model.js';
import { DigitalTwinModel } from '../models/digital-twin-model.js';
import { GuardrailsModel } from '../models/guardrails-model.js';
import { aiEngine } from '../models/ai-engine.js';
import { EventBus } from '../core/event-bus.js';

export class CalculationService {
  constructor(config = {}) {
    this.cutoverModel = new CutoverModel(config);
    this.costModel = new CostModel(config);
    this.activeEcn = {
      id: config.ecn || 'ECN-0248',
      partOld: config.partOld || 'COMP-A-104',
      partNew: config.partNew || 'COMP-B-208',
      initialStock: config.initialStock || 680,
      dailyDemand: config.dailyDemand || 40,
      dockDay: config.dockDay || 11
    };

    // Listen to active ECN changes
    EventBus.on('ecn:changed', (ecn) => {
      this.reconfigureWithEcn(ecn);
    });

    EventBus.on('ecn:created', (ecn) => {
      this.reconfigureWithEcn(ecn);
    });
  }

  /**
   * Reconfigures optimization engines with new ECN parameters.
   */
  reconfigureWithEcn(ecn) {
    if (!ecn) return;
    this.reconfigure({
      initialOldStock: ecn.initialStock !== undefined ? Number(ecn.initialStock) : 680,
      baseDemand: ecn.dailyDemand !== undefined ? Number(ecn.dailyDemand) : 40,
      newMaterialReadyDay: ecn.dockDay !== undefined ? Number(ecn.dockDay) : 11,
      ecn: ecn.id || 'ECN-0248',
      partOld: ecn.partOld || 'COMP-A-104',
      partNew: ecn.partNew || 'COMP-B-208'
    });
    EventBus.emit('calculations:reconfigured', this.cutoverModel.getOptimizationSummary());
  }

  reconfigure(config = {}) {
    this.activeEcn = {
      ...this.activeEcn,
      ...config
    };
    this.cutoverModel.reconfigure(config);
    this.costModel.reconfigure({
      ...config,
      targetOptimalDay: this.cutoverModel.targetOptimalDay,
      lrmDay: this.cutoverModel.lrmDay
    });
  }

  /**
   * Evaluates complete material netting and cost breakdown for a candidate day.
   */
  evaluateCandidateDay(day) {
    const netting = this.cutoverModel.evaluateDay(day);
    const cost = this.costModel.computeCost(day, netting.excessOldUnits, netting.shortageUnits);

    return {
      ...netting,
      ...cost
    };
  }

  /**
   * Generates continuous curve coordinates across days 1 to 31.
   */
  computeFullHorizon() {
    const points = [];
    for (let d = 1; d <= 31; d++) {
      points.push(this.evaluateCandidateDay(d));
    }
    return points;
  }

  /**
   * Evaluates Pareto-optimal frontier between Cost and Shortage Risk.
   */
  computeParetoFrontier() {
    return ParetoModel.computeParetoFrontier(this);
  }

  /**
   * Simulates Digital Cutover Twin inventory balance trajectories.
   */
  simulateDigitalTwin(cutoverDay = 15) {
    return DigitalTwinModel.simulateTimeline({
      initialStock: this.cutoverModel.initialOldStock,
      dailyDemand: this.cutoverModel.baseDemand,
      dockDay: this.cutoverModel.newMaterialReadyDay,
      cutoverDay
    });
  }

  /**
   * Evaluates Recommendation Guardrails.
   */
  evaluateGuardrails(cutoverDay = 15, options = {}) {
    const netting = this.evaluateCandidateDay(cutoverDay);
    return GuardrailsModel.evaluateGuardrails({
      cutoverDay,
      dockDay: this.cutoverModel.newMaterialReadyDay,
      shortageUnits: netting.shortageUnits,
      lrmDay: this.cutoverModel.lrmDay,
      sourcingScore: options.sourcingScore || 82,
      dataQualityScore: options.dataQualityScore || 95,
      variability: options.variability || 2
    });
  }

  /**
   * Predicts multi-dimensional cutover risks using Cutover Intelligence Engine.
   */
  predictAiRisks(inputs = {}) {
    return aiEngine.predictRisks({
      initialStock: this.cutoverModel.initialOldStock,
      dailyDemand: this.cutoverModel.baseDemand,
      dockDay: this.cutoverModel.newMaterialReadyDay,
      ...inputs
    });
  }

  /**
   * Compares 4 decision strategies.
   */
  compareAiStrategies() {
    return aiEngine.compareStrategies(this, this.activeEcn);
  }

  /**
   * Generates grounded industrial narrative explanation.
   */
  generateAiExplanation(day = 15) {
    const netting = this.evaluateCandidateDay(day);
    return aiEngine.generateDecisionExplanation(netting, this.activeEcn);
  }

  /**
   * Evaluates the 3 comparative What-If scenarios dynamically using active ECN stock & demand.
   */
  evaluateScenarios({ demandVariation = 0, supplierDelay = 0, stockOnHand = null, safetyBuffer = 3 }) {
    const baseDemandRate = this.cutoverModel.baseDemand || 40;
    const stock = stockOnHand !== null && stockOnHand !== undefined ? Number(stockOnHand) : this.cutoverModel.initialOldStock;
    const baseDockDay = this.cutoverModel.newMaterialReadyDay || 11;

    // Scenario A: Baseline
    const scenAArrivalDay = baseDockDay;
    const scenAFeasibleDay = scenAArrivalDay + safetyBuffer;
    const scenAShortage = Math.max(0, Math.round((scenAArrivalDay - 1) * baseDemandRate - stock));
    const scenAStockLeft = Math.max(0, Math.round(stock - (scenAFeasibleDay - 1) * baseDemandRate));
    const scenACost = (80.0 + (scenAStockLeft * 0.02) + (scenAShortage * 0.5)).toFixed(1);

    // Scenario B: Demand Surge
    const surgeRate = baseDemandRate * (1 + (demandVariation + 35) / 100);
    const scenBBurnDays = Math.floor(stock / Math.max(1, surgeRate));
    const scenBFeasibleDay = Math.min(25, Math.max(baseDockDay, scenBBurnDays));
    const scenBShortage = Math.max(0, Math.round((baseDockDay - 1) * surgeRate - stock));
    const scenBStockLeft = Math.max(0, Math.round(stock - (scenBFeasibleDay - 1) * surgeRate));
    const scenBCost = (85.0 + (scenBStockLeft * 0.03) + (scenBShortage * 0.6)).toFixed(1);

    // Scenario C: Supplier Delay
    const delayedArrivalDay = baseDockDay + supplierDelay + 6;
    const scenCFeasibleDay = Math.min(31, delayedArrivalDay + safetyBuffer);
    const scenCShortage = Math.max(0, Math.round((delayedArrivalDay - 1) * baseDemandRate - stock));
    const scenCStockLeft = Math.max(0, Math.round(stock - (scenCFeasibleDay - 1) * baseDemandRate));
    const scenCCost = (95.0 + (supplierDelay * 2.5) + (scenCStockLeft * 0.02) + (scenCShortage * 0.8)).toFixed(1);

    return {
      baseline: {
        date: `${scenAFeasibleDay} DEC`,
        cost: scenACost,
        leftover: `${scenAStockLeft} Units`,
        shortage: scenAShortage,
        shortageLabel: scenAShortage > 0 ? `${scenAShortage} Units` : '0 Units',
        riskCategory: scenAShortage > 0 ? 'SHORTAGE DEFICIT' : 'LOW RISK',
        riskBadgeClass: scenAShortage > 0 ? 'badge-risk' : 'badge-feasible'
      },
      demandSurge: {
        date: `${scenBFeasibleDay} DEC`,
        cost: scenBCost,
        leftover: `${scenBStockLeft} Units`,
        shortage: scenBShortage,
        shortageLabel: scenBShortage > 0 ? `${scenBShortage} Units` : '0 Units',
        riskCategory: scenBShortage > 0 ? 'SURGE SHORTAGE' : 'TIGHT RUNOUT',
        riskBadgeClass: scenBShortage > 0 ? 'badge-risk' : 'badge-warning'
      },
      supplierDelay: {
        date: `${scenCFeasibleDay} DEC`,
        cost: scenCCost,
        leftover: `${scenCStockLeft} Units`,
        shortage: scenCShortage,
        shortageLabel: scenCShortage > 0 ? `${scenCShortage} Units (Deficit)` : '0 Units (Covered)',
        riskCategory: scenCShortage > 0 ? 'SHORTAGE RISK' : 'EXTENDED RUN',
        riskBadgeClass: scenCShortage > 0 ? 'badge-risk' : 'badge-warning'
      }
    };
  }
}
