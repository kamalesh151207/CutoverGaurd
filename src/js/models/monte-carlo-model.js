/**
 * Stochastic Monte Carlo Uncertainty Simulation Model
 */
import { pseudoRandom } from '../core/utilities.js';

export class MonteCarloModel {
  constructor(config = {}) {
    this.baseDemand = config.baseDemand || 40;
    this.initialOldStock = config.initialOldStock || 680;
    this.nominalReadyDay = config.nominalReadyDay || 11;
  }

  /**
   * Executes N simulated iterations using reproducible seeded PRNG.
   */
  runSimulation({ runs = 500, demandSigma = 0.15, maxDelay = 3, seed = 42 }) {
    const rand = pseudoRandom(seed + runs);
    const buckets = new Array(19).fill(0); // Buckets for days 8 to 26
    let shortageCount = 0;
    const candidateDays = [];

    for (let i = 0; i < runs; i++) {
      // Box-Muller transform for normal distribution
      const u1 = Math.max(1e-7, rand());
      const u2 = rand();
      const z0 = Math.sqrt(-2.0 * Math.log(u1)) * Math.cos(2.0 * Math.PI * u2);

      const simDemand = this.baseDemand * (1 + z0 * demandSigma);
      const simDelay = Math.floor(rand() * (maxDelay + 1));
      const simReadyDay = this.nominalReadyDay + simDelay;

      // Old inventory burnout day under simulated demand
      const burnDays = Math.round(this.initialOldStock / Math.max(15, simDemand));

      // A physical shortage occurs if existing stock exhausts before replacement stock is dock-ready
      if (burnDays < simReadyDay) {
        shortageCount++;
      }

      // Candidate transition date bounded by dock readiness
      const optDay = Math.max(simReadyDay, Math.min(26, burnDays));
      candidateDays.push(optDay);

      const bucketIdx = Math.max(0, Math.min(18, optDay - 8));
      buckets[bucketIdx]++;
    }

    // Percentiles
    candidateDays.sort((a, b) => a - b);
    const p10 = candidateDays[Math.floor(runs * 0.1)];
    const p90 = candidateDays[Math.floor(runs * 0.9)];
    const shortageProbability = ((shortageCount / runs) * 100).toFixed(1);

    return {
      runs,
      shortageCount,
      shortageProbability,
      p10,
      p90,
      buckets,
      maxBucketCount: Math.max(...buckets, 1)
    };
  }
}
