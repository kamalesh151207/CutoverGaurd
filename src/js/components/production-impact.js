/**
 * Production Schedule Impact Analysis & Gantt Component
 * Evaluates active production orders across manufacturing lines and maps cutover date impact.
 */

import { EventBus } from '../core/event-bus.js';

export function initProductionImpact(calculationService) {
  const productionGanttSvg = document.getElementById('productionGanttSvg');
  const ganttLineCount = document.getElementById('ganttLineCount');
  const ganttCutoverMarker = document.getElementById('ganttCutoverMarker');

  const workOrders = [
    {
      line: 'Line 1 (Robotics Servo)',
      orderId: 'WO-8801',
      product: 'PRD-SERVO-DRIVE-S5',
      startDay: 1,
      endDay: 20,
      targetCutover: 15,
      status: 'ON_TRACK',
      color: '#2563EB'
    },
    {
      line: 'Line 2 (Hydraulic Valves)',
      orderId: 'WO-8802',
      product: 'PRD-HYD-MANIFOLD-M2',
      startDay: 3,
      endDay: 24,
      targetCutover: 18,
      status: 'SCHEDULED',
      color: '#16A34A'
    },
    {
      line: 'Line 3 (EV Inverter Powertrain)',
      orderId: 'WO-8803',
      product: 'PRD-EV-INVERTER-X1',
      startDay: 1,
      endDay: 28,
      targetCutover: 15, // ACTIVE TARGET
      status: 'CUTOVER_TARGET',
      color: '#1D4ED8'
    },
    {
      line: 'Line 4 (Electric Truck Chassis)',
      orderId: 'WO-8804',
      product: 'PRD-CHASSIS-FRAME-F1',
      startDay: 5,
      endDay: 25,
      targetCutover: 22,
      status: 'SCHEDULED',
      color: '#475569'
    }
  ];

  function renderGantt() {
    if (!productionGanttSvg) return;

    const cutoverDay = calculationService.cutoverModel.targetOptimalDay || 15;
    const width = 860;
    const height = 180;
    const padL = 180;
    const padR = 30;
    const padT = 30;
    const plotW = width - padL - padR;

    const scaleX = (d) => padL + ((d - 1) / 30) * plotW;
    const rowH = 32;

    const cutX = scaleX(cutoverDay);

    if (ganttLineCount) ganttLineCount.textContent = '4 Operational Lines Monitored';
    if (ganttCutoverMarker) ganttCutoverMarker.textContent = `${cutoverDay}-DEC Target (0 Line Stoppages)`;

    let barsHtml = '';
    workOrders.forEach((wo, idx) => {
      const y = padT + idx * rowH;
      const x1 = scaleX(wo.startDay);
      const x2 = scaleX(wo.endDay);
      const barW = Math.max(10, x2 - x1);

      barsHtml += `
        <!-- Line Label -->
        <text x="${padL - 12}" y="${y + 16}" text-anchor="end" font-size="10.5" font-weight="600" fill="var(--navy-primary)" font-family="var(--font-sans)">${wo.line}</text>
        
        <!-- Bar background track -->
        <rect x="${padL}" y="${y + 4}" width="${plotW}" height="20" fill="var(--bg-surface-subtle)" rx="3" />
        
        <!-- Work order bar -->
        <rect x="${x1}" y="${y + 4}" width="${barW}" height="20" fill="${wo.color}" opacity="0.85" rx="3" />
        <text x="${x1 + 6}" y="${y + 18}" font-size="9.5" fill="#FFFFFF" font-family="var(--font-mono)" font-weight="bold">${wo.orderId}: ${wo.product}</text>
      `;
    });

    productionGanttSvg.innerHTML = `
      <!-- Grid days -->
      ${[1, 5, 10, 15, 20, 25, 30].map(d => `
        <line x1="${scaleX(d)}" y1="${padT}" x2="${scaleX(d)}" y2="${height - 20}" stroke="var(--border-color)" stroke-dasharray="2,2" />
        <text x="${scaleX(d)}" y="${height - 6}" font-size="9.5" fill="var(--text-muted)" font-family="var(--font-mono)" text-anchor="middle">${d < 10 ? '0' + d : d} DEC</text>
      `).join('')}

      <!-- Work order rows -->
      ${barsHtml}

      <!-- Vertical Active Cutover Marker Line -->
      <line x1="${cutX}" y1="${padT - 10}" x2="${cutX}" y2="${height - 20}" stroke="#DC2626" stroke-width="2.5" stroke-dasharray="4,2" />
      <rect x="${cutX - 35}" y="${padT - 22}" width="70" height="18" fill="#DC2626" rx="3" />
      <text x="${cutX}" y="${padT - 10}" text-anchor="middle" font-size="9" font-family="var(--font-mono)" font-weight="bold" fill="#FFFFFF">CUTOVER ${cutoverDay}d</text>
    `;
  }

  EventBus.on('ecn:changed', renderGantt);
  EventBus.on('cutover:evaluated', renderGantt);
  EventBus.on('calculations:reconfigured', renderGantt);

  renderGantt();
}
