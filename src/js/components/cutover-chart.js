/**
 * Main Interactive Cutover Cost Curve & LRM Chart Component
 */
import { dayToX, costToY, formatCurrency } from '../core/utilities.js';
import { EventBus } from '../core/event-bus.js';
import { dbService } from '../services/db-service.js';

export function initCutoverChart(calculationService) {
  const dateSlider = document.getElementById('cutoverDateSlider');
  const dateDisplay = document.getElementById('cutoverDateDisplay');
  const statusBadge = document.getElementById('feasibilityStatusBadge');

  const readoutExcess = document.getElementById('readout-excess-stock');
  const readoutScrap = document.getElementById('readout-scrap-cost');
  const readoutShortage = document.getElementById('readout-shortage');
  const readoutTotalCost = document.getElementById('readout-total-cost');
  const readoutLrm = document.getElementById('readout-lrm-buffer');

  // Input Assumptions & Tuning Controls
  const cutoverAssumpEcn = document.getElementById('cutoverAssumpEcn');
  const cutoverAssumpStatusBadge = document.getElementById('cutoverAssumpStatusBadge');
  const tuneStockInput = document.getElementById('tuneStockInput');
  const tuneDemandInput = document.getElementById('tuneDemandInput');
  const tuneDockInput = document.getElementById('tuneDockInput');
  const cutoverAssumpStock = document.getElementById('cutoverAssumpStock');
  const cutoverAssumpDemand = document.getElementById('cutoverAssumpDemand');
  const cutoverAssumpDock = document.getElementById('cutoverAssumpDock');

  const recomputeCutoverBtn = document.getElementById('recomputeCutoverBtn');
  const resetCutoverBtn = document.getElementById('resetCutoverBtn');
  const saveScenarioBtn = document.getElementById('saveScenarioBtn');
  const exportCutoverBriefBtn = document.getElementById('exportCutoverBriefBtn');
  const plannerRecalcBtns = document.querySelectorAll('#plannerRecalcBtn');

  // SVG paths and marker indicators
  const curveOldStock = document.getElementById('curveOldStock');
  const curveShortage = document.getElementById('curveShortage');
  const curveTransition = document.getElementById('curveTransition');
  const curveTotalCost = document.getElementById('curveTotalCost');

  const guideLine = document.getElementById('guideLine');
  const guidePointTotal = document.getElementById('guidePointTotal');
  const guidePointOld = document.getElementById('guidePointOld');
  const guidePointShortage = document.getElementById('guidePointShortage');

  // LRM Track Indicators
  const lrmSliderIndicator = document.getElementById('lrmSliderIndicator');
  const lrmLiveStatElem = document.getElementById('lrm-live-status');
  const lrmLiveDaysElem = document.getElementById('lrm-live-days');

  // Ground Truth Table Elements
  const gtDate = document.getElementById('gt-cutover-date');
  const gtStock = document.getElementById('gt-old-stock');
  const gtShort = document.getElementById('gt-shortage');
  const gtCost = document.getElementById('gt-cost-index');

  let baselineSnapshot = null;

  function syncAssumptionLabels(ecn) {
    if (!ecn) ecn = calculationService.activeEcn || {};
    if (cutoverAssumpEcn) {
      cutoverAssumpEcn.textContent = `ANALYSIS INPUT ASSUMPTIONS (${ecn.id || 'ECN-0248'})`;
    }
    const stock = ecn.initialStock !== undefined ? ecn.initialStock : (ecn.onHand || 680);
    const demand = ecn.dailyDemand || 40;
    const dockDay = ecn.dockDay || 11;

    if (tuneStockInput && document.activeElement !== tuneStockInput) tuneStockInput.value = stock;
    if (tuneDemandInput && document.activeElement !== tuneDemandInput) tuneDemandInput.value = demand;
    if (tuneDockInput && document.activeElement !== tuneDockInput) tuneDockInput.value = dockDay;

    if (cutoverAssumpStock) cutoverAssumpStock.textContent = `${stock} Units on-hand`;
    if (cutoverAssumpDemand) cutoverAssumpDemand.textContent = `${demand} Units/Day`;
    if (cutoverAssumpDock) cutoverAssumpDock.textContent = `Day ${dockDay} (${dockDay < 10 ? '0' + dockDay : dockDay}-DEC)`;

    if (baselineSnapshot === null || baselineSnapshot.id !== ecn.id) {
      baselineSnapshot = { id: ecn.id, stock, demand, dockDay };
    }
  }

  function renderCurves() {
    const horizon = calculationService.computeFullHorizon();
    let pathOld = '';
    let pathShortage = '';
    let pathTrans = '';
    let pathTotal = '';

    horizon.forEach((pt, idx) => {
      const x = dayToX(pt.day);
      const yOld = costToY(pt.excessCostIndex);
      const yShort = costToY(pt.shortageCostIndex);
      const yTrans = costToY(18);
      const yTot = costToY(pt.totalIndex);

      const cmd = idx === 0 ? 'M' : 'L';
      pathOld += ` ${cmd} ${x} ${yOld}`;
      pathShortage += ` ${cmd} ${x} ${yShort}`;
      pathTrans += ` ${cmd} ${x} ${yTrans}`;
      pathTotal += ` ${cmd} ${x} ${yTot}`;
    });

    if (curveOldStock) curveOldStock.setAttribute('d', pathOld.trim());
    if (curveShortage) curveShortage.setAttribute('d', pathShortage.trim());
    if (curveTransition) curveTransition.setAttribute('d', pathTrans.trim());
    if (curveTotalCost) curveTotalCost.setAttribute('d', pathTotal.trim());
  }

  function updateView(day) {
    const model = calculationService.evaluateCandidateDay(day);
    const dockDay = calculationService.cutoverModel.newMaterialReadyDay || 11;
    const lrmDay = calculationService.cutoverModel.lrmDay || 19;

    // Update Slider Readout & Status Badge
    if (dateDisplay) dateDisplay.textContent = `${day < 10 ? '0' + day : day} DEC`;
    const sliderDateVal = document.getElementById('sliderDateVal');
    if (sliderDateVal) sliderDateVal.textContent = `${day < 10 ? '0' + day : day}-DEC-2026`;

    if (statusBadge) {
      statusBadge.textContent = model.statusText;
      statusBadge.className = `badge ${model.badgeClass}`;
    }

    // Live Metrics Readout
    if (readoutExcess) readoutExcess.textContent = `${model.excessOldUnits} u`;
    if (readoutScrap) readoutScrap.textContent = formatCurrency(model.scrapCost);
    if (readoutShortage) {
      if (model.shortageUnits > 0) {
        readoutShortage.textContent = `${model.shortageUnits} u (${formatCurrency(model.shortageUnits * 45)})`;
        readoutShortage.style.color = 'var(--risk-red)';
      } else {
        readoutShortage.textContent = '0 u ($0)';
        readoutShortage.style.color = 'var(--success-green)';
      }
    }
    if (readoutTotalCost) readoutTotalCost.textContent = model.totalIndex.toFixed(1);

    if (readoutLrm) {
      if (model.bufferDays >= 0) {
        readoutLrm.textContent = `+${model.bufferDays} Days`;
        readoutLrm.style.color = 'var(--cyan-data)';
      } else {
        readoutLrm.textContent = `${model.bufferDays} Days (Violated)`;
        readoutLrm.style.color = 'var(--risk-red)';
      }
    }

    // Guide Marker on SVG
    const xPos = dayToX(day);
    if (guideLine) {
      guideLine.setAttribute('x1', xPos);
      guideLine.setAttribute('x2', xPos);
    }
    if (guidePointTotal) {
      guidePointTotal.setAttribute('cx', xPos);
      guidePointTotal.setAttribute('cy', costToY(model.totalIndex));
    }
    if (guidePointOld) {
      guidePointOld.setAttribute('cx', xPos);
      guidePointOld.setAttribute('cy', costToY(model.excessCostIndex));
    }
    if (guidePointShortage) {
      guidePointShortage.setAttribute('cx', xPos);
      guidePointShortage.setAttribute('cy', costToY(model.shortageCostIndex));
    }

    // LRM Horizon Indicator
    const pct = ((day - 1) / 30) * 100;
    if (lrmSliderIndicator) lrmSliderIndicator.style.left = `${pct}%`;

    if (lrmLiveStatElem && lrmLiveDaysElem) {
      if (day < dockDay) {
        lrmLiveStatElem.textContent = 'BLOCKED (SHORTAGE DEFICIT)';
        lrmLiveStatElem.style.color = 'var(--risk-red)';
        lrmLiveDaysElem.textContent = `Prior to replacement availability (Day ${dockDay})`;
      } else if (day <= lrmDay) {
        lrmLiveStatElem.textContent = 'WITHIN SAFE BOUNDS';
        lrmLiveStatElem.style.color = 'var(--success-green)';
        lrmLiveDaysElem.textContent = `+${lrmDay - day} Working Days Buffer (LRM: Day ${lrmDay})`;
      } else {
        lrmLiveStatElem.textContent = 'PAST RESPONSIBLE MOMENT';
        lrmLiveStatElem.style.color = 'var(--warning-amber)';
        lrmLiveDaysElem.textContent = `${day - lrmDay} Days Overdue (Past Day ${lrmDay})`;
      }
    }

    // Ground Truth sync
    if (gtDate) gtDate.textContent = `${day < 10 ? '0' + day : day} DEC`;
    if (gtStock) gtStock.textContent = `${model.excessOldUnits} units`;
    if (gtShort) gtShort.textContent = `${model.shortageUnits} units`;
    if (gtCost) gtCost.textContent = model.totalIndex.toFixed(1);

    // Emit event for other components
    EventBus.emit('cutover:evaluated', model);
  }

  function handleRecalculate() {
    const stock = parseInt(tuneStockInput ? tuneStockInput.value : 680, 10) || 680;
    const demand = parseInt(tuneDemandInput ? tuneDemandInput.value : 40, 10) || 40;
    const dockDay = parseInt(tuneDockInput ? tuneDockInput.value : 11, 10) || 11;

    calculationService.reconfigure({
      initialOldStock: stock,
      baseDemand: demand,
      newMaterialReadyDay: dockDay
    });

    const activeId = calculationService.activeEcn.id;
    if (activeId) {
      dbService.updateEcn(activeId, {
        initialStock: stock,
        dailyDemand: demand,
        dockDay: dockDay
      }).catch(() => {});
    }

    syncAssumptionLabels({ id: activeId, initialStock: stock, dailyDemand: demand, dockDay });
    renderCurves();

    const targetDay = calculationService.cutoverModel.targetOptimalDay || 15;
    if (dateSlider) dateSlider.value = targetDay;
    updateView(targetDay);
  }

  function handleReset() {
    if (!baselineSnapshot) return;
    if (tuneStockInput) tuneStockInput.value = baselineSnapshot.stock;
    if (tuneDemandInput) tuneDemandInput.value = baselineSnapshot.demand;
    if (tuneDockInput) tuneDockInput.value = baselineSnapshot.dockDay;
    handleRecalculate();
  }

  function handleSaveScenario() {
    const stock = parseInt(tuneStockInput ? tuneStockInput.value : 680, 10);
    const demand = parseInt(tuneDemandInput ? tuneDemandInput.value : 40, 10);
    const dockDay = parseInt(tuneDockInput ? tuneDockInput.value : 11, 10);
    const day = dateSlider ? parseInt(dateSlider.value, 10) : 15;
    const evalResult = calculationService.evaluateCandidateDay(day);

    const scenario = {
      ecnId: calculationService.activeEcn.id,
      cutoverDay: day,
      cutoverDate: `${day < 10 ? '0' + day : day}-DEC-2026`,
      stock,
      demand,
      dockDay,
      excessStock: evalResult.excessOldUnits,
      scrapCost: evalResult.scrapCost,
      shortageUnits: evalResult.shortageUnits,
      costIndex: evalResult.totalIndex,
      status: evalResult.statusText
    };

    dbService.saveScenario(scenario);

    if (saveScenarioBtn) {
      const originalText = saveScenarioBtn.textContent;
      saveScenarioBtn.textContent = 'Saved!';
      saveScenarioBtn.style.background = 'var(--success-green)';
      saveScenarioBtn.style.color = '#FFF';
      setTimeout(() => {
        saveScenarioBtn.textContent = originalText;
        saveScenarioBtn.style.background = '';
        saveScenarioBtn.style.color = '';
      }, 1800);
    }
  }

  function handleExportCsv() {
    const horizon = calculationService.computeFullHorizon();
    const ecn = calculationService.activeEcn || {};
    let csv = `ECN ID,Candidate Day,Candidate Date,Feasibility,Remaining Old Stock (Units),Scrap Cost ($),Shortage Exposure (Units),Shortage Cost ($),Total Cost Index,LRM Buffer (Days)\n`;

    horizon.forEach(pt => {
      csv += `${ecn.id || 'ECN-0248'},${pt.day},"${pt.date}","${pt.statusText}",${pt.excessOldUnits},${pt.scrapCost},${pt.shortageUnits},${pt.shortageCost},${pt.totalIndex.toFixed(1)},${pt.bufferDays}\n`;
    });

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `CutoverGuard_${ecn.id || 'ECN-0248'}_Evaluation_Horizon.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  // Event Listeners for Controls
  if (recomputeCutoverBtn) recomputeCutoverBtn.addEventListener('click', handleRecalculate);
  if (plannerRecalcBtns) {
    plannerRecalcBtns.forEach(btn => btn.addEventListener('click', handleRecalculate));
  }
  if (resetCutoverBtn) resetCutoverBtn.addEventListener('click', handleReset);
  if (saveScenarioBtn) saveScenarioBtn.addEventListener('click', handleSaveScenario);
  if (exportCutoverBriefBtn) exportCutoverBriefBtn.addEventListener('click', handleExportCsv);

  [tuneStockInput, tuneDemandInput, tuneDockInput].forEach(inp => {
    if (inp) {
      inp.addEventListener('change', handleRecalculate);
    }
  });

  if (dateSlider) {
    dateSlider.addEventListener('input', () => {
      const selected = parseInt(dateSlider.value, 10);
      updateView(selected);
    });
  }

  // Update on ECN change
  EventBus.on('ecn:changed', (ecn) => {
    syncAssumptionLabels(ecn);
    renderCurves();
    const optDay = calculationService.cutoverModel.targetOptimalDay || 15;
    if (dateSlider) dateSlider.value = optDay;
    updateView(optDay);
  });

  EventBus.on('calculations:reconfigured', () => {
    syncAssumptionLabels();
    renderCurves();
    const optDay = calculationService.cutoverModel.targetOptimalDay || 15;
    if (dateSlider) dateSlider.value = optDay;
    updateView(optDay);
  });

  EventBus.on('theme:changed', () => {
    renderCurves();
  });

  // Initial draw
  syncAssumptionLabels();
  renderCurves();
  updateView(dateSlider ? parseInt(dateSlider.value, 10) : 15);
}
