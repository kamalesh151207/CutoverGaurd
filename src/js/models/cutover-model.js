/**
 * Deterministic Cutover Material Netting & Feasibility Model
 */

export class CutoverModel {
  constructor(config = {}) {
    this.baseDemand = config.baseDemand || 40;
    this.initialOldStock = config.initialOldStock || 680;
    this.newMaterialReadyDay = config.newMaterialReadyDay || 11;
    this.lrmDay = config.lrmDay || 19;
    this.targetOptimalDay = config.targetOptimalDay || 15;
  }

  /**
   * Calculates inventory balances and feasibility state for a given candidate day.
   */
  evaluateDay(day) {
    const oldConsumed = Math.min(this.initialOldStock, (day - 1) * this.baseDemand);
    const excessOldUnits = Math.max(0, this.initialOldStock - oldConsumed);

    let shortageUnits = 0;
    if (day < this.newMaterialReadyDay) {
      const starvedDays = this.newMaterialReadyDay - day;
      shortageUnits = starvedDays * this.baseDemand;
    }

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
      statusText = 'OUTSIDE FEASIBLE WINDOW (HIGH SCRAP/DELAY)';
    } else if (day >= 12 && day <= 16) {
      status = 'OPTIMAL';
      badgeClass = 'badge-feasible';
      statusText = 'FEASIBLE (RECOMMENDED WINDOW)';
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
      isFeasible: day >= this.newMaterialReadyDay && day <= this.lrmDay
    };
  }
}
