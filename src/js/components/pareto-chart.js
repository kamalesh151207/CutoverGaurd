/**
 * Multi-Objective Pareto-Frontier Visualization Component
 * Plots Cost Index vs Shortage Risk and identifies non-dominated transition options.
 */
import { EventBus } from '../core/event-bus.js';

export function initParetoChart(calculationService) {
  const paretoSvg = document.getElementById('paretoSvgChart');
  const paretoOptimalCount = document.getElementById('paretoOptimalCount');
  const paretoBalancedDate = document.getElementById('paretoBalancedDate');
  const paretoLowestCostDate = document.getElementById('paretoLowestCostDate');

  function renderPareto() {
    if (!paretoSvg) return;

    const data = calculationService.computeParetoFrontier();
    const width = 860;
    const height = 260;
    const padL = 55;
    const padR = 30;
    const padT = 30;
    const padB = 40;

    const minCost = 75;
    const maxCost = 140;
    const minRisk = 0;
    const maxRisk = 65;

    const scaleX = (c) => padL + ((c - minCost) / (maxCost - minCost)) * (width - padL - padR);
    const scaleY = (r) => height - padB - ((r - minRisk) / (maxRisk - minRisk)) * (height - padT - padB);

    // Build Pareto frontier curve path
    let frontierPath = '';
    data.paretoPoints.forEach((pt, i) => {
      const x = scaleX(pt.cost);
      const y = scaleY(pt.shortageRisk);
      const cmd = i === 0 ? 'M' : 'L';
      frontierPath += ` ${cmd} ${x.toFixed(1)} ${y.toFixed(1)}`;
    });

    // Build SVG
    paretoSvg.innerHTML = `
      <!-- Axes & Grid -->
      <line x1="${padL}" y1="${height - padB}" x2="${width - padR}" y2="${height - padB}" stroke="var(--border-color)" stroke-width="1.5" />
      <line x1="${padL}" y1="${padT}" x2="${padL}" y2="${height - padB}" stroke="var(--border-color)" stroke-width="1.5" />

      <!-- Grid lines -->
      <line x1="${padL}" y1="${scaleY(20)}" x2="${width - padR}" y2="${scaleY(20)}" stroke="var(--border-color)" stroke-dasharray="3,3" />
      <line x1="${padL}" y1="${scaleY(40)}" x2="${width - padR}" y2="${scaleY(40)}" stroke="var(--border-color)" stroke-dasharray="3,3" />
      <line x1="${scaleX(90)}" y1="${padT}" x2="${scaleX(90)}" y2="${height - padB}" stroke="var(--border-color)" stroke-dasharray="3,3" />
      <line x1="${scaleX(110)}" y1="${padT}" x2="${scaleX(110)}" y2="${height - padB}" stroke="var(--border-color)" stroke-dasharray="3,3" />

      <!-- Axis Labels -->
      <text x="${width / 2}" y="${height - 8}" text-anchor="middle" font-size="11" fill="var(--text-muted)" font-family="var(--font-sans)">Total Transition Cost Index &rarr; (Minimize)</text>
      <text x="14" y="${height / 2}" text-anchor="middle" font-size="11" fill="var(--text-muted)" font-family="var(--font-sans)" transform="rotate(-90 14 ${height / 2})">Shortage Risk Index &rarr; (Minimize)</text>

      <!-- Tick Labels -->
      <text x="${scaleX(80)}" y="${height - padB + 16}" font-size="10" fill="var(--text-light)" font-family="var(--font-mono)">80</text>
      <text x="${scaleX(100)}" y="${height - padB + 16}" font-size="10" fill="var(--text-light)" font-family="var(--font-mono)">100</text>
      <text x="${scaleX(120)}" y="${height - padB + 16}" font-size="10" fill="var(--text-light)" font-family="var(--font-mono)">120</text>
      <text x="${padL - 8}" y="${scaleY(0) + 4}" text-anchor="end" font-size="10" fill="var(--text-light)" font-family="var(--font-mono)">0%</text>
      <text x="${padL - 8}" y="${scaleY(30) + 4}" text-anchor="end" font-size="10" fill="var(--text-light)" font-family="var(--font-mono)">30%</text>
      <text x="${padL - 8}" y="${scaleY(60) + 4}" text-anchor="end" font-size="10" fill="var(--text-light)" font-family="var(--font-mono)">60%</text>

      <!-- Pareto Frontier Curve -->
      <path d="${frontierPath}" fill="none" stroke="#2563EB" stroke-width="2.5" stroke-dasharray="4,2" />

      <!-- Candidate Date Points -->
      ${data.allPoints.map(pt => {
        const cx = scaleX(pt.cost);
        const cy = scaleY(pt.shortageRisk);
        let fill = '#94A3B8';
        let r = 4;
        let stroke = '#FFFFFF';
        let sw = 1.5;

        if (pt.isOptimal) {
          fill = '#2563EB';
          r = 7;
          stroke = '#FFFFFF';
          sw = 2.5;
        } else if (pt.isPareto) {
          fill = '#16A34A';
          r = 5.5;
        } else if (!pt.isFeasible) {
          fill = '#DC2626';
          r = 3.5;
        }

        return `
          <g class="pareto-point" data-day="${pt.day}" style="cursor: pointer;">
            <circle cx="${cx.toFixed(1)}" cy="${cy.toFixed(1)}" r="${r}" fill="${fill}" stroke="${stroke}" stroke-width="${sw}">
              <title>${pt.date}: Cost ${pt.cost}, Shortage ${pt.shortageUnits}u (${pt.isPareto ? 'Pareto-Optimal' : 'Dominated'})</title>
            </circle>
            ${pt.isOptimal ? `<text x="${cx + 8}" y="${cy - 8}" font-size="10" font-family="var(--font-mono)" font-weight="bold" fill="#2563EB">${pt.date} (Optimal)</text>` : ''}
          </g>
        `;
      }).join('')}
    `;

    // Interactive clicks on Pareto points
    paretoSvg.querySelectorAll('.pareto-point').forEach(el => {
      el.addEventListener('click', () => {
        const day = parseInt(el.getAttribute('data-day'), 10);
        const dateSlider = document.getElementById('cutoverDateSlider');
        if (dateSlider) {
          dateSlider.value = day;
          dateSlider.dispatchEvent(new Event('input'));
        }
      });
    });

    // Summary numbers
    if (paretoOptimalCount) paretoOptimalCount.textContent = `${data.paretoPoints.length} Non-Dominated Dates`;
    if (paretoBalancedDate) paretoBalancedDate.textContent = `${data.recommended.date} (Cost ${data.recommended.cost})`;
    const lowestCostPt = data.paretoPoints[0] || data.recommended;
    if (paretoLowestCostDate) paretoLowestCostDate.textContent = `${lowestCostPt.date} (Cost ${lowestCostPt.cost})`;
  }

  EventBus.on('calculations:reconfigured', renderPareto);
  EventBus.on('ecn:changed', renderPareto);
  renderPareto();
}
