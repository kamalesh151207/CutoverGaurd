/**
 * Multi-Objective Optimization & Pareto-Frontier Model
 * Analyzes trade-offs between Transition Cost Index and Shortage Deficit Risk.
 */

export class ParetoModel {
  /**
   * Computes objective metrics for all 31 candidate cutover days and identifies the Pareto-optimal frontier.
   */
  static computeParetoFrontier(calculationService) {
    const horizon = calculationService.computeFullHorizon();
    
    // Each candidate solution: obj1 = totalIndex (cost), obj2 = shortageCostIndex + jitter vulnerability (risk)
    const points = horizon.map(pt => {
      let riskIndex = pt.shortageCostIndex;
      if (pt.isFeasible) {
        const buffer = Math.max(0, calculationService.cutoverModel.burnDays - pt.day);
        if (buffer < 4) {
          riskIndex = (4 - buffer) * 8.5;
        } else {
          riskIndex = 0.5;
        }
      }
      return {
        day: pt.day,
        date: `${pt.day < 10 ? '0' + pt.day : pt.day} DEC`,
        cost: parseFloat(pt.totalIndex.toFixed(1)),
        shortageUnits: pt.shortageUnits,
        shortageRisk: parseFloat(riskIndex.toFixed(1)),
        excessUnits: pt.excessOldUnits,
        isFeasible: pt.isFeasible,
        isOptimal: pt.day === calculationService.cutoverModel.targetOptimalDay
      };
    });

    // Find non-dominated points (Pareto frontier)
    // Point A dominates Point B if Cost(A) <= Cost(B) and Risk(A) <= Risk(B) with at least one strictly lower
    const paretoSet = [];
    points.forEach(candidate => {
      let isDominated = false;
      for (const other of points) {
        if (other.day === candidate.day) continue;
        if (other.cost <= candidate.cost && other.shortageRisk <= candidate.shortageRisk) {
          if (other.cost < candidate.cost || other.shortageRisk < candidate.shortageRisk) {
            isDominated = true;
            break;
          }
        }
      }
      candidate.isPareto = !isDominated;
      if (!isDominated) {
        paretoSet.push(candidate);
      }
    });

    // Sort pareto set by cost ascending
    paretoSet.sort((a, b) => a.cost - b.cost);

    return {
      allPoints: points,
      paretoPoints: paretoSet,
      recommended: points.find(p => p.isOptimal) || points[14]
    };
  }
}
