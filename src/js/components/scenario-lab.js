/**
 * What-If Scenario Lab Component
 */

export function initScenarioLab(calculationService) {
  const scenarioDemandSlider = document.getElementById('scenarioDemandSlider');
  const scenarioDelaySlider = document.getElementById('scenarioDelaySlider');
  const scenarioStockSlider = document.getElementById('scenarioStockSlider');
  const scenarioBufferSlider = document.getElementById('scenarioBufferSlider');

  const scenarioDemandVal = document.getElementById('scenarioDemandVal');
  const scenarioDelayVal = document.getElementById('scenarioDelayVal');
  const scenarioStockVal = document.getElementById('scenarioStockVal');
  const scenarioBufferVal = document.getElementById('scenarioBufferVal');

  const resetScenariosBtn = document.getElementById('resetScenariosBtn');

  // Scenario Metric Elements
  const scenADate = document.getElementById('scenA-date');
  const scenACost = document.getElementById('scenA-cost');
  const scenAShortage = document.getElementById('scenA-shortage');
  const scenALeftover = document.getElementById('scenA-leftover');
  const scenARisk = document.getElementById('scenA-risk');

  const scenBDate = document.getElementById('scenB-date');
  const scenBCost = document.getElementById('scenB-cost');
  const scenBShortage = document.getElementById('scenB-shortage');
  const scenBLeftover = document.getElementById('scenB-leftover');
  const scenBRisk = document.getElementById('scenB-risk');

  const scenCDate = document.getElementById('scenC-date');
  const scenCCost = document.getElementById('scenC-cost');
  const scenCShortage = document.getElementById('scenC-shortage');
  const scenCLeftover = document.getElementById('scenC-leftover');
  const scenCRisk = document.getElementById('scenC-risk');

  function updateScenarios() {
    if (!scenarioDemandSlider) return;

    const demandVariation = parseInt(scenarioDemandSlider.value, 10);
    const supplierDelay = parseInt(scenarioDelaySlider.value, 10);
    const stockOnHand = parseInt(scenarioStockSlider.value, 10);
    const safetyBuffer = parseInt(scenarioBufferSlider.value, 10);

    if (scenarioDemandVal) scenarioDemandVal.textContent = `${demandVariation >= 0 ? '+' : ''}${demandVariation}%`;
    if (scenarioDelayVal) scenarioDelayVal.textContent = `+${supplierDelay} Days`;
    if (scenarioStockVal) scenarioStockVal.textContent = `${stockOnHand} Units`;
    if (scenarioBufferVal) scenarioBufferVal.textContent = `${safetyBuffer} Days`;

    const res = calculationService.evaluateScenarios({
      demandVariation,
      supplierDelay,
      stockOnHand,
      safetyBuffer
    });

    // Scenario A
    if (scenADate) scenADate.textContent = res.baseline.date;
    if (scenACost) scenACost.textContent = res.baseline.cost;
    if (scenALeftover) scenALeftover.textContent = res.baseline.leftover;
    if (scenAShortage) {
      scenAShortage.textContent = res.baseline.shortageLabel;
      scenAShortage.style.color = res.baseline.shortage > 0 ? 'var(--risk-red)' : 'var(--success-green)';
    }
    if (scenARisk) {
      scenARisk.className = `badge ${res.baseline.riskBadgeClass}`;
      scenARisk.textContent = res.baseline.riskCategory;
    }

    // Scenario B
    if (scenBDate) scenBDate.textContent = res.demandSurge.date;
    if (scenBCost) scenBCost.textContent = res.demandSurge.cost;
    if (scenBLeftover) scenBLeftover.textContent = res.demandSurge.leftover;
    if (scenBShortage) {
      scenBShortage.textContent = res.demandSurge.shortageLabel;
      scenBShortage.style.color = res.demandSurge.shortage > 0 ? 'var(--risk-red)' : 'var(--success-green)';
    }
    if (scenBRisk) {
      scenBRisk.className = `badge ${res.demandSurge.riskBadgeClass}`;
      scenBRisk.textContent = res.demandSurge.riskCategory;
    }

    // Scenario C
    if (scenCDate) scenCDate.textContent = res.supplierDelay.date;
    if (scenCCost) scenCCost.textContent = res.supplierDelay.cost;
    if (scenCLeftover) scenCLeftover.textContent = res.supplierDelay.leftover;
    if (scenCShortage) {
      scenCShortage.textContent = res.supplierDelay.shortageLabel;
      scenCShortage.style.color = res.supplierDelay.shortage > 0 ? 'var(--risk-red)' : 'var(--success-green)';
    }
    if (scenCRisk) {
      scenCRisk.className = `badge ${res.supplierDelay.riskBadgeClass}`;
      scenCRisk.textContent = res.supplierDelay.riskCategory;
    }
  }

  [scenarioDemandSlider, scenarioDelaySlider, scenarioStockSlider, scenarioBufferSlider].forEach(slider => {
    if (slider) slider.addEventListener('input', updateScenarios);
  });

  if (resetScenariosBtn) {
    resetScenariosBtn.addEventListener('click', () => {
      if (scenarioDemandSlider) scenarioDemandSlider.value = 0;
      if (scenarioDelaySlider) scenarioDelaySlider.value = 0;
      if (scenarioStockSlider) scenarioStockSlider.value = 600;
      if (scenarioBufferSlider) scenarioBufferSlider.value = 3;
      updateScenarios();
    });
  }

  updateScenarios();
}
