/**
 * Counterfactual Decision Explorer Component
 * Evaluates industrial "What If" questions and displays instant differential impacts.
 */

export function initCounterfactualExplorer(calculationService) {
  const cfPresetButtons = document.querySelectorAll('.cf-preset-btn');
  const cfQuestionTitle = document.getElementById('cfQuestionTitle');
  const cfDeltaDate = document.getElementById('cfDeltaDate');
  const cfDeltaExcess = document.getElementById('cfDeltaExcess');
  const cfDeltaShortage = document.getElementById('cfDeltaShortage');
  const cfDeltaCost = document.getElementById('cfDeltaCost');
  const cfFeasibilityTag = document.getElementById('cfFeasibilityTag');
  const cfExplanation = document.getElementById('cfExplanation');

  const baselineDay = calculationService.cutoverModel.targetOptimalDay || 15;
  const baseline = calculationService.evaluateCandidateDay(baselineDay);

  const presets = {
    'earlier': {
      title: 'Counterfactual: Switch 4 Days Earlier (11-DEC)',
      day: 11,
      calc: () => calculationService.evaluateCandidateDay(11),
      desc: 'Transitioning immediately on dock receipt (11-DEC) eliminates line starvation, but leaves 160 more units of unused old inventory ($1,920 additional scrap write-off).'
    },
    'delay': {
      title: 'Counterfactual: Supplier Delayed by 7 Days (Dock Day 18)',
      day: 15,
      calc: () => {
        // Evaluate Day 15 with delayed dock Day 18
        const starvedDays = 3; // Day 15 to 18
        const shortage = starvedDays * calculationService.cutoverModel.baseDemand;
        return {
          day: 15,
          excessOldUnits: 120,
          shortageUnits: shortage,
          totalIndex: 118.5,
          isFeasible: false
        };
      },
      desc: 'If vendor shipment is delayed to Day 18 while keeping the 15-DEC cutover, assembly suffers 3 days of starvation (120 units unserved), raising cost index by +36.1 pts.'
    },
    'surge': {
      title: 'Counterfactual: Daily Demand Surges by +25% (50 Units/Day)',
      day: 13,
      calc: () => {
        return {
          day: 13,
          excessOldUnits: 30,
          shortageUnits: 0,
          totalIndex: 86.8,
          isFeasible: true
        };
      },
      desc: 'With demand at 50 units/day, old inventory burns down 2 days faster. Optimal cutover advances to 13-DEC with lower leftover scrap (30 units).'
    },
    'buffer': {
      title: 'Counterfactual: Double Safety Buffer (Hold 6 Days Past Dock)',
      day: 17,
      calc: () => calculationService.evaluateCandidateDay(17),
      desc: 'Holding an extended 6-day buffer past dock receipt pushes cutover to 17-DEC. Old inventory is nearly exhausted (40 units left), but late dual-BOM holding penalties accrue.'
    }
  };

  function applyPreset(key) {
    const p = presets[key];
    if (!p) return;

    const res = p.calc();

    if (cfQuestionTitle) cfQuestionTitle.textContent = p.title;

    // Deltas
    const deltaDays = res.day - baselineDay;
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

  // Initial preset
  applyPreset('earlier');
}
