/**
 * Counterfactual Decision Explorer Component
 * Evaluates industrial "What If" questions and displays instant differential impacts.
 */
import { EventBus } from '../core/event-bus.js';

export function initCounterfactualExplorer(calculationService) {
  const cfPresetButtons = document.querySelectorAll('.cf-preset-btn');
  const cfQuestionTitle = document.getElementById('cfQuestionTitle');
  const cfDeltaDate = document.getElementById('cfDeltaDate');
  const cfDeltaExcess = document.getElementById('cfDeltaExcess');
  const cfDeltaShortage = document.getElementById('cfDeltaShortage');
  const cfDeltaCost = document.getElementById('cfDeltaCost');
  const cfFeasibilityTag = document.getElementById('cfFeasibilityTag');
  const cfExplanation = document.getElementById('cfExplanation');

  let activePresetKey = 'earlier';

  function getBaseline() {
    const baselineDay = calculationService.cutoverModel.targetOptimalDay || 15;
    return {
      day: baselineDay,
      model: calculationService.evaluateCandidateDay(baselineDay)
    };
  }

  function getPresets() {
    const { day: baseDay } = getBaseline();
    const dockDay = calculationService.cutoverModel.dockDay || 11;
    const demand = calculationService.cutoverModel.baseDemand || 40;

    return {
      'earlier': {
        title: `Counterfactual: Switch Early on Dock Arrival (${dockDay}-DEC)`,
        day: dockDay,
        calc: () => calculationService.evaluateCandidateDay(dockDay),
        desc: `Transitioning immediately on dock receipt (${dockDay}-DEC) eliminates line starvation, but increases leftover scrap write-off.`
      },
      'delay': {
        title: `Counterfactual: Supplier Delayed by 7 Days (Dock Day ${dockDay + 7})`,
        day: baseDay,
        calc: () => {
          const starvedDays = Math.max(0, (dockDay + 7) - baseDay);
          const shortage = starvedDays * demand;
          return {
            day: baseDay,
            excessOldUnits: calculationService.evaluateCandidateDay(baseDay).excessOldUnits,
            shortageUnits: shortage,
            totalIndex: 118.5,
            isFeasible: shortage === 0
          };
        },
        desc: `If vendor shipment is delayed while keeping Day ${baseDay} cutover, assembly risks parts starvation, raising cost and shortage risk.`
      },
      'surge': {
        title: `Counterfactual: Daily Demand Surges by +25% (${Math.round(demand * 1.25)} Units/Day)`,
        day: Math.max(dockDay, baseDay - 2),
        calc: () => {
          return {
            day: Math.max(dockDay, baseDay - 2),
            excessOldUnits: Math.max(0, 30),
            shortageUnits: 0,
            totalIndex: 86.8,
            isFeasible: true
          };
        },
        desc: `With demand surges, old inventory burns down faster. Optimal cutover advances with lower leftover scrap.`
      },
      'buffer': {
        title: `Counterfactual: Extended Safety Buffer (${Math.min(31, baseDay + 2)}-DEC)`,
        day: Math.min(31, baseDay + 2),
        calc: () => calculationService.evaluateCandidateDay(Math.min(31, baseDay + 2)),
        desc: `Holding an extended buffer past dock receipt allows further inventory drawdown, balancing dual-BOM holding penalties.`
      }
    };
  }

  function applyPreset(key) {
    activePresetKey = key;
    const presets = getPresets();
    const p = presets[key];
    if (!p) return;

    const res = p.calc();
    const { day: baseDay, model: baseline } = getBaseline();

    if (cfQuestionTitle) cfQuestionTitle.textContent = p.title;

    // Deltas
    const deltaDays = res.day - baseDay;
    if (cfDeltaDate) {
      cfDeltaDate.textContent = `${res.day}-DEC (${deltaDays >= 0 ? '+' : ''}${deltaDays}d)`;
      cfDeltaDate.style.color = deltaDays === 0 ? 'var(--navy-primary)' : (deltaDays > 0 ? 'var(--blue-primary)' : 'var(--warning-amber)');
    }

    const deltaExcess = res.excessOldUnits - baseline.excessOldUnits;
    if (cfDeltaExcess) {
      cfDeltaExcess.textContent = `${res.excessOldUnits} u (${deltaExcess >= 0 ? '+' : ''}${deltaExcess} u)`;
      cfDeltaExcess.style.color = deltaExcess > 0 ? 'var(--risk-red)' : 'var(--success-green)';
    }

    const deltaShortage = res.shortageUnits - baseline.shortageUnits;
    if (cfDeltaShortage) {
      cfDeltaShortage.textContent = `${res.shortageUnits} u (${deltaShortage >= 0 ? '+' : ''}${deltaShortage} u)`;
      cfDeltaShortage.style.color = res.shortageUnits > 0 ? 'var(--risk-red)' : 'var(--success-green)';
    }

    const deltaCost = (res.totalIndex - baseline.totalIndex).toFixed(1);
    if (cfDeltaCost) {
      cfDeltaCost.textContent = `${res.totalIndex} pts (${deltaCost >= 0 ? '+' : ''}${deltaCost})`;
      cfDeltaCost.style.color = deltaCost > 0 ? 'var(--risk-red)' : 'var(--success-green)';
    }

    if (cfFeasibilityTag) {
      cfFeasibilityTag.className = `badge ${res.isFeasible ? 'badge-feasible' : 'badge-risk'}`;
      cfFeasibilityTag.textContent = res.isFeasible ? 'FEASIBLE OPTION' : 'SHORTAGE / INFEASIBLE';
    }

    if (cfExplanation) {
      cfExplanation.textContent = p.desc;
    }
  }

  cfPresetButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      cfPresetButtons.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      const key = btn.getAttribute('data-preset');
      applyPreset(key);
    });
  });

  EventBus.on('ecn:changed', () => applyPreset(activePresetKey));
  EventBus.on('calculations:reconfigured', () => applyPreset(activePresetKey));

  // Initial preset
  applyPreset('earlier');
}
