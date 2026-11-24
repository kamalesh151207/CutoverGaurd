/**
 * Deterministic Transition Cost Objective Model
 * Computes scrap liability, shortage penalty, holding overhead, and total cost index.
 */

export class CostModel {
  constructor(config = {}) {
    this.reconfigure(config);
  }

  reconfigure(config = {}) {
    this.unitHoldingScrapCost = Math.max(0, config.unitHoldingScrapCost !== undefined ? Number(config.unitHoldingScrapCost) : 12.0);
    this.initialOldStock = Math.max(1, config.initialOldStock !== undefined ? Number(config.initialOldStock) : 680);
    this.baseDemand = Math.max(1, config.baseDemand !== undefined ? Number(config.baseDemand) : 40);
    this.fixedTransitionCost = config.fixedTransitionCost !== undefined ? Number(config.fixedTransitionCost) : 77.988;
    this.targetOptimalDay = config.targetOptimalDay !== undefined ? Number(config.targetOptimalDay) : 15;
    this.lrmDay = config.lrmDay !== undefined ? Number(config.lrmDay) : 19;
  }

  /**
   * Computes component cost indices and total transition cost index for any day.
   */
  computeCost(day, excessOldUnits, shortageUnits) {
    excessOldUnits = Math.max(0, Number(excessOldUnits) || 0);
    shortageUnits = Math.max(0, Number(shortageUnits) || 0);

    // 1. Scrap / holding write-off in currency
    const scrapCost = excessOldUnits * this.unitHoldingScrapCost;

    // 2. Excess cost index (0 to 25 pts scale relative to baseline stock)
    const excessCostIndex = (excessOldUnits / this.initialOldStock) * 25.0;

    // 3. Shortage cost index (steep penalty curve with quadratic risk compounding)
    let shortageCostIndex = 0;
    if (shortageUnits > 0) {
      const starvedDays = shortageUnits / this.baseDemand;
      shortageCostIndex = Math.min(80, (starvedDays * 6.5) + (starvedDays * starvedDays * 0.35));
    }

    // 4. Late delay & dual-BOM carrying overhead after optimal cutover point
    let lateDelayCostIndex = 0;
    if (day > this.targetOptimalDay) {
      const delayDays = day - this.targetOptimalDay;
      lateDelayCostIndex = (delayDays * 1.4) + (day > this.lrmDay ? (day - this.lrmDay) * 2.8 : 0);
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
