/**
 * Main Interactive Cutover Cost Curve & LRM Chart Component
 */
import { dayToX, costToY, formatCurrency } from '../core/utilities.js';
import { eventBus } from '../core/event-bus.js';

export function initCutoverChart(calculationService) {
  const dateSlider = document.getElementById('cutoverDateSlider');
  const dateDisplay = document.getElementById('cutoverDateDisplay');
  const statusBadge = document.getElementById('feasibilityStatusBadge');

  const readoutExcess = document.getElementById('readout-excess-stock');
  const readoutScrap = document.getElementById('readout-scrap-cost');
  const readoutShortage = document.getElementById('readout-shortage');
  const readoutTotalCost = document.getElementById('readout-total-cost');
  const readoutLrm = document.getElementById('readout-lrm-buffer');

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

    // Update Slider Readout & Status Badge
    if (dateDisplay) dateDisplay.textContent = `${day < 10 ? '0' + day : day} DEC`;
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
      if (day < 11) {
        lrmLiveStatElem.textContent = 'BLOCKED (SHORTAGE)';
        lrmLiveStatElem.style.color = 'var(--risk-red)';
        lrmLiveDaysElem.textContent = 'Prior to replacement availability';
      } else if (day <= 19) {
        lrmLiveStatElem.textContent = 'WITHIN SAFE BOUNDS';
        lrmLiveStatElem.style.color = 'var(--success-green)';
        lrmLiveDaysElem.textContent = `+${19 - day} Working Days Buffer`;
      } else {
        lrmLiveStatElem.textContent = 'PAST RESPONSIBLE MOMENT';
        lrmLiveStatElem.style.color = 'var(--warning-amber)';
        lrmLiveDaysElem.textContent = `${day - 19} Days Overdue`;
      }
    }

    // Ground Truth sync
    if (gtDate) gtDate.textContent = `${day} DEC`;
    if (gtStock) gtStock.textContent = `${model.excessOldUnits} units`;
    if (gtShort) gtShort.textContent = `${model.shortageUnits} units`;
    if (gtCost) gtCost.textContent = model.totalIndex.toFixed(1);

    // Emit event for other components (e.g. KPI cards, Explanation Verifier)
    eventBus.emit('cutover:evaluated', model);
  }

  if (dateSlider) {
    dateSlider.addEventListener('input', () => {
      const selected = parseInt(dateSlider.value, 10);
      updateView(selected);
    });
  }

  // Redraw curves on theme change if needed
  eventBus.on('theme:changed', () => {
    renderCurves();
  });

  // Initial draw
  renderCurves();
  updateView(dateSlider ? parseInt(dateSlider.value, 10) : 15);
}
