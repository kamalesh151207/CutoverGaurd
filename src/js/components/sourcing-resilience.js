/**
 * Sourcing Resilience Risk Component
 */
import { RiskModel } from '../models/risk-model.js';

export function initSourcingResilience() {
  const srLeadTimeSlider = document.getElementById('srLeadTimeSlider');
  const srVariabilitySlider = document.getElementById('srVariabilitySlider');
  const srConfirmedSelect = document.getElementById('srConfirmedSelect');
  const srDualSourceSelect = document.getElementById('srDualSourceSelect');

  const srLeadTimeVal = document.getElementById('srLeadTimeVal');
  const srVariabilityVal = document.getElementById('srVariabilityVal');
  const srScoreCircle = document.getElementById('srScoreCircle');
  const srScoreNum = document.getElementById('srScoreNum');
  const srResilienceBadge = document.getElementById('srResilienceBadge');
  const srSummaryTitle = document.getElementById('srSummaryTitle');
  const srSummaryDesc = document.getElementById('srSummaryDesc');
  const srSingleSourceRisk = document.getElementById('srSingleSourceRisk');
  const srSafetyBufferNeeded = document.getElementById('srSafetyBufferNeeded');

  function updateResilience() {
    if (!srLeadTimeSlider) return;

    const leadTime = parseInt(srLeadTimeSlider.value, 10);
    const variability = parseInt(srVariabilitySlider.value, 10);
    const poStatus = srConfirmedSelect ? srConfirmedSelect.value : 'confirmed';
    const dualSource = srDualSourceSelect ? srDualSourceSelect.value : 'yes';

    if (srLeadTimeVal) srLeadTimeVal.textContent = `${leadTime} Working Days`;
    if (srVariabilityVal) srVariabilityVal.textContent = `±${variability} Days Variance`;

    const res = RiskModel.evaluateSourcingResilience({
      leadTime,
      variability,
      poStatus,
      dualSource
    });

    if (srScoreNum) srScoreNum.textContent = res.score;
    if (srScoreCircle) {
      srScoreCircle.style.borderColor = res.score >= 75 ? 'var(--success-green)' : (res.score >= 50 ? 'var(--warning-amber)' : 'var(--risk-red)');
    }
    if (srResilienceBadge) {
      srResilienceBadge.textContent = res.category;
      srResilienceBadge.className = `badge ${res.badgeClass}`;
    }
    if (srSummaryTitle) srSummaryTitle.textContent = res.title;
    if (srSummaryDesc) srSummaryDesc.textContent = res.description;
    if (srSafetyBufferNeeded) srSafetyBufferNeeded.textContent = res.safetyBuffer;

    if (srSingleSourceRisk) {
      srSingleSourceRisk.textContent = res.singleSourceRisk;
      srSingleSourceRisk.style.color = res.isDualSource ? 'var(--success-green)' : 'var(--risk-red)';
    }
  }

  [srLeadTimeSlider, srVariabilitySlider, srConfirmedSelect, srDualSourceSelect].forEach(input => {
    if (input) input.addEventListener('input', updateResilience);
  });

  updateResilience();
}
