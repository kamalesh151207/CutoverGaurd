/**
 * Recommendation Guardrails Model
 * Validates deterministic industrial constraints to prevent unsafe or unviable cutover approvals.
 */

export class GuardrailsModel {
  /**
   * Evaluates all 5 constraint guardrails for a candidate cutover decision.
   */
  static evaluateGuardrails({
    cutoverDay = 15,
    dockDay = 11,
    shortageUnits = 0,
    lrmDay = 19,
    sourcingScore = 82,
    dataQualityScore = 95,
    variability = 2
  }) {
    const rules = [
      {
        id: 'GR-01',
        name: 'Replacement Dock Readiness',
        desc: 'Cutover date cannot precede confirmed replacement component dock readiness.',
        passed: cutoverDay >= dockDay,
        status: cutoverDay >= dockDay ? 'PASSED' : 'VIOLATION',
        detail: cutoverDay >= dockDay 
          ? `Cutover on Day ${cutoverDay} occurs after dock arrival (Day ${dockDay}).`
          : `Cutover on Day ${cutoverDay} precedes dock arrival on Day ${dockDay}! Assembly starvation will occur.`
      },
      {
        id: 'GR-02',
        name: 'Zero Shortage Exposure',
        desc: 'Proposed transition must have 0 units of unserved demand exposure.',
        passed: shortageUnits === 0,
        status: shortageUnits === 0 ? 'PASSED' : 'VIOLATION',
        detail: shortageUnits === 0
          ? 'Zero assembly line starvation projected.'
          : `Deficit of ${shortageUnits} units detected during transition!`
      },
      {
        id: 'GR-03',
        name: 'Sourcing Resilience & Jitter Buffer',
        desc: 'Available safety buffer must absorb supplier delivery variance jitter.',
        passed: sourcingScore >= 50 && (lrmDay - cutoverDay) >= variability,
        status: sourcingScore >= 50 ? 'PASSED' : 'WARNING',
        detail: (lrmDay - cutoverDay) >= variability
          ? `Remaining buffer (${lrmDay - cutoverDay} days) absorbs supplier jitter (±${variability} days).`
          : `Buffer (${lrmDay - cutoverDay} days) is narrower than supplier delivery jitter (±${variability} days).`
      },
      {
        id: 'GR-04',
        name: 'Data Quality & Ingestion Gate',
        desc: 'Input inventory and demand parameters must satisfy verification thresholds.',
        passed: dataQualityScore >= 75,
        status: dataQualityScore >= 75 ? 'PASSED' : 'WARNING',
        detail: `Verified parameter confidence score: ${dataQualityScore}%.`
      },
      {
        id: 'GR-05',
        name: 'Latest Responsible Moment (LRM) Limit',
        desc: 'Cutover must execute on or before the Latest Responsible Moment to avoid obsolete scrap.',
        passed: cutoverDay <= lrmDay,
        status: cutoverDay <= lrmDay ? 'PASSED' : 'VIOLATION',
        detail: cutoverDay <= lrmDay
          ? `Cutover Day ${cutoverDay} is within LRM limit (Day ${lrmDay}).`
          : `Cutover Day ${cutoverDay} exceeds LRM (Day ${lrmDay}). Severe obsolescence penalties apply.`
      }
    ];

    const violations = rules.filter(r => r.status === 'VIOLATION');
    const warnings = rules.filter(r => r.status === 'WARNING');
    const allPassed = violations.length === 0;

    return {
      allPassed,
      passCount: rules.filter(r => r.passed).length,
      totalRules: rules.length,
      violations,
      warnings,
      rules,
      statusLabel: allPassed 
        ? (warnings.length === 0 ? 'ALL GUARDRAILS PASSED' : 'CLEARED WITH WARNINGS')
        : 'GUARDRAIL VIOLATION DETECTED',
      badgeClass: allPassed
        ? (warnings.length === 0 ? 'badge-feasible' : 'badge-warning')
        : 'badge-risk'
    };
  }
}
