/**
 * Digital Cutover Twin UI Component
 * Visual simulation of component transition, inventory depletion, replenishment, and shortage zones.
 */
import { EventBus } from '../core/event-bus.js';

export function initDigitalTwin(calculationService) {
  const twinSvg = document.getElementById('twinSvgChart');
  const twinCutoverDateLabel = document.getElementById('twinCutoverDateLabel');
  const twinScrappedStock = document.getElementById('twinScrappedStock');
  const twinShortageDeficit = document.getElementById('twinShortageDeficit');
  const twinFeasibilityPill = document.getElementById('twinFeasibilityPill');

  function renderTwin(day = 15) {
    if (!twinSvg) return;

    const sim = calculationService.simulateDigitalTwin(day);
    const maxVal = Math.max(
      ...sim.timeline.map(t => Math.max(t.oldStock, t.newStock, t.cumDemand)),
      sim.timeline[0]?.oldStock || 680,
      1000
    );

    const width = 860;
    const height = 240;
    const padX = 40;
    const padY = 25;
    const plotW = width - padX * 2;
    const plotH = height - padY * 2;

    const scaleX = (d) => padX + ((d - 1) / 29) * plotW;
    const scaleY = (v) => height - padY - (v / maxVal) * plotH;

    // Build SVG paths
    let pathOld = '';
    let pathNew = '';
    let pathDemand = '';

    sim.timeline.forEach((pt, i) => {
      const x = scaleX(pt.day);
      const yOld = scaleY(pt.oldStock);
      const yNew = scaleY(pt.newStock);
      const yDem = scaleY(pt.cumDemand);

      const cmd = i === 0 ? 'M' : 'L';
      pathOld += ` ${cmd} ${x.toFixed(1)} ${yOld.toFixed(1)}`;
      pathNew += ` ${cmd} ${x.toFixed(1)} ${yNew.toFixed(1)}`;
      pathDemand += ` ${cmd} ${x.toFixed(1)} ${yDem.toFixed(1)}`;
    });

    // Cutover indicator X
    const cutX = scaleX(sim.cutoverDay);
    const dockX = scaleX(sim.dockDay);

    twinSvg.innerHTML = `
      <!-- Grid Lines -->
      <line x1="${padX}" y1="${scaleY(maxVal * 0.75)}" x2="${width - padX}" y2="${scaleY(maxVal * 0.75)}" stroke="var(--border-color)" stroke-dasharray="3,3" />
      <line x1="${padX}" y1="${scaleY(maxVal * 0.5)}" x2="${width - padX}" y2="${scaleY(maxVal * 0.5)}" stroke="var(--border-color)" stroke-dasharray="3,3" />
      <line x1="${padX}" y1="${scaleY(maxVal * 0.25)}" x2="${width - padX}" y2="${scaleY(maxVal * 0.25)}" stroke="var(--border-color)" stroke-dasharray="3,3" />
      <line x1="${padX}" y1="${height - padY}" x2="${width - padX}" y2="${height - padY}" stroke="var(--border-color)" />

      <!-- Dock Arrival Zone -->
      <rect x="${dockX}" y="${padY}" width="${width - padX - dockX}" height="${plotH}" fill="rgba(37, 99, 235, 0.03)" />
      <line x1="${dockX}" y1="${padY}" x2="${dockX}" y2="${height - padY}" stroke="var(--blue-primary)" stroke-dasharray="4,4" stroke-width="1.5" />
      <text x="${dockX + 5}" y="${padY + 12}" fill="var(--blue-primary)" font-size="10" font-family="var(--font-mono)" font-weight="bold">Dock Ready (Day ${sim.dockDay})</text>

      <!-- Trajectory Curves -->
      <path d="${pathDemand}" fill="none" stroke="#94A3B8" stroke-width="1.5" stroke-dasharray="4,3" />
      <path d="${pathOld}" fill="none" stroke="#DC2626" stroke-width="2.5" />
      <path d="${pathNew}" fill="none" stroke="#16A34A" stroke-width="2.5" />

      <!-- Cutover Date Marker Line -->
      <line x1="${cutX}" y1="${padY}" x2="${cutX}" y2="${height - padY}" stroke="#2563EB" stroke-width="2.5" />
      <circle cx="${cutX}" cy="${scaleY(sim.timeline[sim.cutoverDay - 1]?.oldStock || 0)}" r="5" fill="#2563EB" stroke="#FFFFFF" stroke-width="2" />
      <text x="${cutX}" y="${height - 6}" text-anchor="middle" fill="#2563EB" font-size="11" font-family="var(--font-mono)" font-weight="bold">Cutover: ${sim.cutoverDay} DEC</text>
    `;

    // Metrics readouts
    if (twinCutoverDateLabel) twinCutoverDateLabel.textContent = `${sim.cutoverDay < 10 ? '0' + sim.cutoverDay : sim.cutoverDay} DEC 2026`;
    if (twinScrappedStock) twinScrappedStock.textContent = `${sim.totalScrapped} Units ($${(sim.totalScrapped * 12).toLocaleString()})`;
    if (twinShortageDeficit) {
      twinShortageDeficit.textContent = `${sim.totalShortage} Units`;
      twinShortageDeficit.style.color = sim.totalShortage > 0 ? 'var(--risk-red)' : 'var(--success-green)';
    }
    if (twinFeasibilityPill) {
      twinFeasibilityPill.className = `badge ${sim.isFeasible ? 'badge-feasible' : 'badge-risk'}`;
      twinFeasibilityPill.textContent = sim.isFeasible ? 'FEASIBLE TRANSITION' : 'SHORTAGE DEFICIT DETECTED';
    }
  }

  // Listen to slider changes & calculations
  EventBus.on('cutover:evaluated', (model) => renderTwin(model.day));
  EventBus.on('calculations:reconfigured', () => renderTwin(calculationService.cutoverModel.targetOptimalDay));
  EventBus.on('ecn:changed', () => renderTwin(calculationService.cutoverModel.targetOptimalDay));

  renderTwin(calculationService.cutoverModel.targetOptimalDay || 15);
}
