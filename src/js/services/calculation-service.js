/**
 * High-Level Calculation Orchestration Service
 */
import { CutoverModel } from '../models/cutover-model.js';
import { CostModel } from '../models/cost-model.js';

export class CalculationService {
  constructor(config = {}) {
    this.cutoverModel = new CutoverModel(config);
    this.costModel = new CostModel(config);
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
   * Evaluates the 3 comparative What-If scenarios.
   */
  evaluateScenarios({ demandVariation = 0, supplierDelay = 0, stockOnHand = 600, safetyBuffer = 3 }) {
    const baseDemandRate = 40;

    // Scenario A: Baseline
    const scenAArrivalDay = 11;
    const scenAFeasibleDay = scenAArrivalDay + safetyBuffer;
    const scenAShortage = Math.max(0, Math.round((scenAArrivalDay - 1) * baseDemandRate - stockOnHand));
    const scenAStockLeft = Math.max(0, Math.round(stockOnHand - (scenAFeasibleDay - 1) * baseDemandRate));
    const scenACost = (80.0 + (scenAStockLeft * 0.02) + (scenAShortage * 0.5)).toFixed(1);

    // Scenario B: Demand Surge
    const surgeRate = baseDemandRate * (1 + (demandVariation + 35) / 100);
    const scenBBurnDays = Math.floor(stockOnHand / surgeRate);
    const scenBFeasibleDay = Math.min(25, Math.max(11, scenBBurnDays));
    const scenBShortage = Math.max(0, Math.round((11 - 1) * surgeRate - stockOnHand));
    const scenBStockLeft = Math.max(0, Math.round(stockOnHand - (scenBFeasibleDay - 1) * surgeRate));
    const scenBCost = (85.0 + (scenBStockLeft * 0.03) + (scenBShortage * 0.6)).toFixed(1);

    // Scenario C: Supplier Delay
    const delayedArrivalDay = 11 + supplierDelay + 6;
    const scenCFeasibleDay = Math.min(31, delayedArrivalDay + safetyBuffer);
    const scenCShortage = Math.max(0, Math.round((delayedArrivalDay - 1) * baseDemandRate - stockOnHand));
    const scenCStockLeft = Math.max(0, Math.round(stockOnHand - (scenCFeasibleDay - 1) * baseDemandRate));
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
