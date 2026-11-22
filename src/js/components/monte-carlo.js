/**
 * Monte Carlo Uncertainty Visualization & Execution Component
 */
import { MonteCarloModel } from '../models/monte-carlo-model.js';

export function initMonteCarlo() {
  const runMonteCarloBtn = document.getElementById('runMonteCarloBtn');
  const mcRunsSelect = document.getElementById('mcRunsSelect');
  const mcDemandVolSlider = document.getElementById('mcDemandVolSlider');
  const mcLeadTimeVolSlider = document.getElementById('mcLeadTimeVolSlider');

  const mcDemandVolVal = document.getElementById('mcDemandVolVal');
  const mcLeadTimeVolVal = document.getElementById('mcLeadTimeVolVal');
  const histogramBarsGroup = document.getElementById('histogramBarsGroup');
  const mcProbShortage = document.getElementById('mc-prob-shortage');
  const mcP10P90 = document.getElementById('mc-p10-p90');
  const mcRunStatusBadge = document.getElementById('mcRunStatusBadge');

  const model = new MonteCarloModel();

  if (mcDemandVolSlider) {
    mcDemandVolSlider.addEventListener('input', () => {
      if (mcDemandVolVal) mcDemandVolVal.textContent = `±${mcDemandVolSlider.value}% Standard Deviation`;
    });
  }

  if (mcLeadTimeVolSlider) {
    mcLeadTimeVolSlider.addEventListener('input', () => {
      if (mcLeadTimeVolVal) mcLeadTimeVolVal.textContent = `0 to +${mcLeadTimeVolSlider.value} Days Jitter`;
    });
  }

  function runSimulation() {
    if (!mcRunsSelect) return;

    const runs = parseInt(mcRunsSelect.value, 10);
    const demandSigma = parseInt(mcDemandVolSlider.value, 10) / 100;
    const maxDelay = parseInt(mcLeadTimeVolSlider.value, 10);

    const result = model.runSimulation({ runs, demandSigma, maxDelay });

    // Render Histogram SVG Bars
    if (histogramBarsGroup) {
      histogramBarsGroup.innerHTML = '';
      const barWidth = 20;

      result.buckets.forEach((count, b) => {
        const barHeight = (count / result.maxBucketCount) * 125;
        const x = 45 + b * 22;
        const y = 150 - barHeight;

        const rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
        rect.setAttribute('x', x);
        rect.setAttribute('y', y);
        rect.setAttribute('width', barWidth);
        rect.setAttribute('height', barHeight);

        // Highlight recommended target window (Days 14 to 16 = buckets 6 to 8)
        if (b >= 6 && b <= 8) {
          rect.setAttribute('fill', 'var(--blue-primary)');
        } else {
          rect.setAttribute('fill', 'var(--border-color)');
        }

        histogramBarsGroup.appendChild(rect);
      });
    }

    if (mcProbShortage) mcProbShortage.textContent = `${result.shortageProbability}%`;
    if (mcP10P90) mcP10P90.textContent = `${result.p10}–${result.p90} DEC`;
    if (mcRunStatusBadge) {
      mcRunStatusBadge.textContent = `${runs} RUNS EXECUTED`;
      mcRunStatusBadge.className = 'badge badge-feasible';
    }
  }

  if (runMonteCarloBtn) {
    runMonteCarloBtn.addEventListener('click', runSimulation);
  }

  // Initial simulation pass
  runSimulation();
}
