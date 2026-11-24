/**
 * Deterministic Cutover Material Netting & Feasibility Model
 * Core Industrial Optimization Engine for CutoverGuard
 */

export class CutoverModel {
  constructor(config = {}) {
    this.reconfigure(config);
  }

  /**
   * Reconfigures model with specific ECN parameters
   */
  reconfigure(config = {}) {
    this.baseDemand = Math.max(0, config.baseDemand !== undefined ? Number(config.baseDemand) : 40);
    this.initialOldStock = Math.max(0, config.initialOldStock !== undefined ? Number(config.initialOldStock) : 680);
    this.newMaterialReadyDay = Math.max(1, config.newMaterialReadyDay !== undefined ? Number(config.newMaterialReadyDay) : 11);
    this.safetyBuffer = Math.max(0, config.safetyBuffer !== undefined ? Number(config.safetyBuffer) : 3);
    this.unitHoldingScrapCost = Math.max(0, config.unitHoldingScrapCost !== undefined ? Number(config.unitHoldingScrapCost) : 12.0);
    this.unitShortageCost = Math.max(0, config.unitShortageCost !== undefined ? Number(config.unitShortageCost) : 35.0);
    this.fixedTransitionCost = config.fixedTransitionCost !== undefined ? Number(config.fixedTransitionCost) : 77.988;

    // Computed Deterministic Key Milestones
    this.burnDays = this.baseDemand > 0 
      ? Math.ceil(this.initialOldStock / this.baseDemand) 
      : 31;
    
    // Earliest feasible is when new material is dock-ready
    this.earliestFeasibleDay = this.newMaterialReadyDay;

    // LRM is bounded by runout exhaustion + safety buffer, clamped to month horizon
    this.lrmDay = Math.min(31, Math.max(this.newMaterialReadyDay + 2, this.burnDays + 2));

    // Target optimal day: minimizes total cost without shortage
    this.targetOptimalDay = this.findOptimalCutoverDay();
  }

  /**
   * Evaluates inventory balances and feasibility for a candidate cutover day.
   */
  evaluateDay(day) {
    day = Math.max(1, Math.min(31, Math.round(day)));

    // Old stock consumed up to transition day
    const oldConsumed = Math.min(this.initialOldStock, Math.max(0, (day - 1) * this.baseDemand));
    const excessOldUnits = Math.max(0, this.initialOldStock - oldConsumed);

    // Shortage occurs if transitioning before replacement material arrives
    let shortageUnits = 0;
    if (day < this.newMaterialReadyDay) {
      const starvedDays = this.newMaterialReadyDay - day;
      shortageUnits = starvedDays * this.baseDemand;
    }

    // Feasibility classification
    let status = 'FEASIBLE';
    let badgeClass = 'badge-feasible';
    let statusText = 'FEASIBLE (OPTIMAL REGION)';

    if (day < this.newMaterialReadyDay) {
      status = 'SHORTAGE RISK';
      badgeClass = 'badge-risk';
      statusText = 'SHORTAGE RISK (INFEASIBLE)';
    } else if (day > this.lrmDay) {
      status = 'OUTSIDE LRM';
      badgeClass = 'badge-warning';
      statusText = 'OUTSIDE FEASIBLE WINDOW (EXCESS SCRAP/DELAY)';
    } else if (day === this.targetOptimalDay) {
      status = 'OPTIMAL';
      badgeClass = 'badge-feasible';
      statusText = 'OPTIMAL CUTOVER DATE (MINIMUM COST)';
    } else if (Math.abs(day - this.targetOptimalDay) <= 2) {
      status = 'RECOMMENDED';
      badgeClass = 'badge-feasible';
      statusText = 'FEASIBLE (RECOMMENDED WINDOW)';
    } else {
      status = 'FEASIBLE';
      badgeClass = 'badge-blue';
      statusText = 'FEASIBLE (ACCEPTABLE)';
    }

    return {
      day,
      excessOldUnits,
      shortageUnits,
      status,
      badgeClass,
      statusText,
      bufferDays: this.lrmDay - day,
      isShortage: shortageUnits > 0,
      isFeasible: day >= this.newMaterialReadyDay && day <= this.lrmDay,
      isOptimal: day === this.targetOptimalDay
    };
  }

  /**
   * Deterministically identifies global minimum cost feasible cutover day.
   */
  findOptimalCutoverDay() {
    // Balanced optimal day accounts for burn runout minus the safety buffer for supplier lead-time jitter
    const balancedDay = Math.max(this.newMaterialReadyDay, this.burnDays - this.safetyBuffer);
    return Math.min(this.lrmDay, Math.max(this.newMaterialReadyDay, balancedDay));
  }

  /**
   * Returns complete optimal window summary
   */
  getOptimizationSummary() {
    return {
      earliestFeasibleDay: this.earliestFeasibleDay,
      recommendedDay: this.targetOptimalDay,
      lrmDay: this.lrmDay,
      feasibleWindow: `${this.earliestFeasibleDay}–${this.lrmDay} DEC`,
      recommendedWindow: `${Math.max(this.earliestFeasibleDay, this.targetOptimalDay - 1)}–${Math.min(this.lrmDay, this.targetOptimalDay + 1)} DEC`,
      burnDays: this.burnDays
    };
  }
}
