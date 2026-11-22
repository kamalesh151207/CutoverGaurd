/**
 * Sourcing Resilience Risk Model
 */

export class RiskModel {
  /**
   * Computes composite sourcing resilience score (0-100) and diagnostic status.
   */
  static evaluateSourcingResilience({ leadTime, variability, poStatus, dualSource }) {
    let score = 100;

    // Lead time penalty over 20 days
    score -= Math.max(0, (leadTime - 20) * 0.75);

    // Delivery jitter variance penalty
    score -= (variability * 3.5);

    // Purchase order confirmation status penalty
    if (poStatus === 'acknowledged') score -= 15;
    if (poStatus === 'pending') score -= 30;

    // Dual-source mitigation factor
    if (dualSource === 'no') score -= 22;

    const finalScore = Math.max(10, Math.min(99, Math.round(score)));

    let category = 'HIGH RESILIENCE';
    let badgeClass = 'badge-feasible';
    let title = 'Stable Supply Horizon';
    let description = 'Confirmed delivery status and qualified backup source provide high confidence against line disruption.';
    let safetyBuffer = `${Math.max(1, variability)} Days`;

    if (finalScore < 50) {
      category = 'HIGH SUPPLY EXPOSURE';
      badgeClass = 'badge-risk';
      title = 'Supply Bottleneck Risk';
      description = 'Unconfirmed orders and absence of secondary supplier create critical risk of assembly stoppage.';
      safetyBuffer = `${variability + 6} Days`;
    } else if (finalScore < 75) {
      category = 'MODERATE RESILIENCE';
      badgeClass = 'badge-warning';
      title = 'Buffer Recommended';
      description = 'Supplier variability or single-source dependency requires preserving an expanded transition buffer.';
      safetyBuffer = `${variability + 3} Days`;
    }

    return {
      score: finalScore,
      category,
      badgeClass,
      title,
      description,
      safetyBuffer,
      singleSourceRisk: dualSource === 'yes' ? 'MITIGATED (DUAL-SOURCE)' : 'CRITICAL SINGLE-SOURCE',
      isDualSource: dualSource === 'yes'
    };
  }
}
