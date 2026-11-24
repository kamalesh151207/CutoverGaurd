/**
 * Digital Cutover Twin Simulation Model
 * Computes dynamic inventory trajectories over time across old and replacement revisions.
 */

export class DigitalTwinModel {
  /**
   * Generates continuous day-by-day trajectory data for a chosen candidate cutover day.
   */
  static simulateTimeline({ 
    initialStock = 680, 
    dailyDemand = 40, 
    dockDay = 11, 
    cutoverDay = 15, 
    horizonDays = 30,
    replacementLotSize = 800
  }) {
    const timeline = [];
    let oldStock = initialStock;
    let newStock = 0;
    let cumDemand = 0;
    let totalScrapped = 0;
    let totalShortage = 0;

    for (let day = 1; day <= horizonDays; day++) {
      // 1. Replacement stock dock arrival
      if (day === dockDay) {
        newStock += replacementLotSize;
      }

      // 2. Daily demand consumption
      cumDemand += dailyDemand;
      const isPostCutover = day >= cutoverDay;

      let oldConsumption = 0;
      let newConsumption = 0;
      let dailyShortage = 0;

      if (!isPostCutover) {
        // Consuming old revision
        oldConsumption = Math.min(oldStock, dailyDemand);
        oldStock = Math.max(0, oldStock - oldConsumption);
        dailyShortage = dailyDemand - oldConsumption;
      } else {
        // Cutover triggered: switch consumption to replacement revision
        if (day === cutoverDay) {
          // Unused old stock is frozen / written-off as excess scrap
          totalScrapped = oldStock;
        }
        newConsumption = Math.min(newStock, dailyDemand);
        newStock = Math.max(0, newStock - newConsumption);
        dailyShortage = dailyDemand - newConsumption;
      }

      totalShortage += dailyShortage;

      timeline.push({
        day,
        date: `${day < 10 ? '0' + day : day} DEC`,
        oldStock,
        newStock,
        cumDemand,
        oldConsumption,
        newConsumption,
        dailyShortage,
        isCutoverPoint: day === cutoverDay,
        isDockDay: day === dockDay,
        isPostCutover,
        excessOldFrozen: isPostCutover ? totalScrapped : 0
      });
    }

    return {
      cutoverDay,
      dockDay,
      timeline,
      totalScrapped,
      totalShortage,
      isFeasible: totalShortage === 0 && cutoverDay >= dockDay
    };
  }
}
