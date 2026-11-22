/**
 * Deterministic Transition Cost Objective Model
 */

export class CostModel {
  constructor(config = {}) {
    this.unitHoldingScrapCost = config.unitHoldingScrapCost || 12; // $12/unit
    this.initialOldStock = config.initialOldStock || 680;
    this.fixedTransitionCost = config.fixedTransitionCost || 77.988;
    this.targetOptimalDay = config.targetOptimalDay || 15;
    this.lrmDay = config.lrmDay || 19;
  }

  /**
   * Computes component cost indices and total transition cost index.
   */
  computeCost(day, excessOldUnits, shortageUnits) {
    // 1. Scrap / holding write-off index
    const scrapCost = excessOldUnits * this.unitHoldingScrapCost;
    const excessCostIndex = (excessOldUnits / this.initialOldStock) * 25.0;

    // 2. Shortage cost index
    let shortageCostIndex = 0;
    if (shortageUnits > 0) {
      const starvedDays = shortageUnits / 40;
      shortageCostIndex = Math.min(60, (starvedDays * 5.0) + (starvedDays * starvedDays * 0.25));
    }

    // 3. Late delay & dual-BOM overhead after target window
    let lateDelayCostIndex = 0;
    if (day > this.targetOptimalDay) {
      const delayDays = day - this.targetOptimalDay;
      lateDelayCostIndex = (delayDays * 1.5) + (day > this.lrmDay ? (day - this.lrmDay) * 2.5 : 0);
    }

    const totalIndex = this.fixedTransitionCost + excessCostIndex + shortageCostIndex + lateDelayCostIndex;

    return {
      scrapCost,
      excessCostIndex,
      shortageCostIndex,
      lateDelayCostIndex,
      fixedTransitionCost: this.fixedTransitionCost,
      totalIndex: parseFloat(totalIndex.toFixed(1))
    };
  }
}
