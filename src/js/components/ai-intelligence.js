/**
 * Cutover Intelligence Engine UI Component
 * Renders Calibrated Risk Predictions, Explainable AI Drivers, Strategy Comparison, and Model Card.
 */
import { aiEngine } from '../models/ai-engine.js';
import { EventBus } from '../core/event-bus.js';

export function initAiIntelligence(calculationService) {
  // Elements
  const aiRiskBadge = document.getElementById('aiCompositeRiskBadge');
  const aiShortageRiskVal = document.getElementById('aiShortageRiskVal');
  const aiShortageRiskBar = document.getElementById('aiShortageRiskBar');
  const aiExcessRiskVal = document.getElementById('aiExcessRiskVal');
  const aiExcessRiskBar = document.getElementById('aiExcessRiskBar');
  const aiDelayRiskVal = document.getElementById('aiDelayRiskVal');
  const aiDelayRiskBar = document.getElementById('aiDelayRiskBar');
  const aiDisruptionRiskVal = document.getElementById('aiDisruptionRiskVal');
  const aiDisruptionRiskBar = document.getElementById('aiDisruptionRiskBar');
  const aiOverrunRiskVal = document.getElementById('aiOverrunRiskVal');
  const aiOverrunRiskBar = document.getElementById('aiOverrunRiskBar');

  const aiDriversContainer = document.getElementById('aiDriversContainer');
  const aiMitigationsContainer = document.getElementById('aiMitigationsContainer');
  const aiStrategiesTableBody = document.getElementById('aiStrategiesTableBody');
  const generateAiExpBtn = document.getElementById('generateAiExpBtn');
  const aiGeneratedNarrative = document.getElementById('aiGeneratedNarrative');

  function renderPredictions() {
    const risks = calculationService.predictAiRisks({
      poStatus: 'confirmed',
      dualSource: 'yes',
      variability: 2
    });

    if (aiRiskBadge) {
      aiRiskBadge.textContent = `${risks.category} (${risks.metrics.compositeRisk}% INDEX)`;
      aiRiskBadge.className = `badge ${risks.badgeClass}`;
    }

    // Risk bars
    updateRiskBar(aiShortageRiskVal, aiShortageRiskBar, risks.metrics.shortageRisk);
    updateRiskBar(aiExcessRiskVal, aiExcessRiskBar, risks.metrics.excessRisk);
    updateRiskBar(aiDelayRiskVal, aiDelayRiskBar, risks.metrics.supplierDelayRisk);
    updateRiskBar(aiDisruptionRiskVal, aiDisruptionRiskBar, risks.metrics.disruptionRisk);
    updateRiskBar(aiOverrunRiskVal, aiOverrunRiskBar, risks.metrics.costOverrunRisk);

    // Explainable AI Drivers
    if (aiDriversContainer) {
      aiDriversContainer.innerHTML = risks.drivers.map(d => `
        <div class="xai-driver-row">
          <div style="flex: 1;">
            <div style="font-weight: 600; font-size: 0.8rem; color: var(--navy-primary);">${d.name}</div>
            <div style="font-size: 0.725rem; color: var(--text-muted);">${d.desc}</div>
          </div>
          <span class="badge ${d.type === 'mitigating' ? 'badge-feasible' : 'badge-risk'}" style="font-family: var(--font-mono); font-size: 0.7rem;">
            ${d.impact > 0 ? '+' : ''}${d.impact}%
          </span>
        </div>
      `).join('');
    }

    // Actionable Mitigations
    if (aiMitigationsContainer) {
      aiMitigationsContainer.innerHTML = risks.mitigations.map((m, i) => `
        <div style="display: flex; gap: 0.5rem; margin-bottom: 0.4rem; font-size: 0.8rem; color: var(--text-main);">
          <span style="color: var(--blue-primary); font-weight: 700;">${i + 1}.</span>
          <span>${m}</span>
        </div>
      `).join('');
    }

    // Decision Strategy Comparison
    if (aiStrategiesTableBody) {
      const strategies = calculationService.compareAiStrategies();
      aiStrategiesTableBody.innerHTML = strategies.map(s => `
        <tr style="${s.isRecommended ? 'background: rgba(37, 99, 235, 0.04); font-weight: 600;' : ''}">
          <td>
            <div>${s.strategy}</div>
            <div style="font-size: 0.725rem; color: var(--text-muted); font-weight: normal;">${s.tradeoff}</div>
          </td>
          <td style="font-family: var(--font-mono); font-weight: 700; color: ${s.isRecommended ? 'var(--blue-primary)' : 'inherit'};">${s.date}</td>
          <td style="font-family: var(--font-mono); font-weight: 600;">${s.costIndex}</td>
          <td style="font-family: var(--font-mono); font-size: 0.8rem;">${s.excessStock}</td>
          <td><span class="badge ${s.badgeClass}">${s.shortageRisk}</span></td>
        </tr>
      `).join('');
    }

    // Generated Explanation
    if (aiGeneratedNarrative) {
      aiGeneratedNarrative.textContent = calculationService.generateAiExplanation(calculationService.cutoverModel.targetOptimalDay);
    }
  }

  function updateRiskBar(valEl, barEl, val) {
    if (valEl) valEl.textContent = `${val}%`;
    if (barEl) {
      barEl.style.width = `${val}%`;
      barEl.style.backgroundColor = val < 30 ? 'var(--success-green)' : (val < 65 ? 'var(--warning-amber)' : 'var(--risk-red)');
    }
  }

  if (generateAiExpBtn) {
    generateAiExpBtn.addEventListener('click', () => {
      const dateSlider = document.getElementById('cutoverDateSlider');
      const day = dateSlider ? parseInt(dateSlider.value, 10) : 15;
      if (aiGeneratedNarrative) {
        aiGeneratedNarrative.textContent = calculationService.generateAiExplanation(day);
      }
    });
  }

  // Update when ECN or calculations change
  EventBus.on('calculations:reconfigured', renderPredictions);
  EventBus.on('cutover:evaluated', (model) => {
    if (aiGeneratedNarrative) {
      aiGeneratedNarrative.textContent = calculationService.generateAiExplanation(model.day);
    }
  });

  renderPredictions();
}
