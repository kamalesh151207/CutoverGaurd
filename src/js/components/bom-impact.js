/**
 * Multi-Level BOM Impact Analysis Component
 * Renders hierarchical BOM dependency tree, common component consumption across finished goods,
 * circular dependency detection, and impact report generation.
 */

import { bomModel } from '../models/bom-model.js';
import { EventBus } from '../core/event-bus.js';

export function initBomImpact(calculationService) {
  const bomTreeContainer = document.getElementById('bomTreeContainer');
  const bomAcyclicBadge = document.getElementById('bomAcyclicBadge');
  const bomProductsCount = document.getElementById('bomProductsCount');
  const bomAssembliesCount = document.getElementById('bomAssembliesCount');
  const bomCombinedDemand = document.getElementById('bomCombinedDemand');
  const downloadBomReportBtn = document.getElementById('downloadBomReportBtn');

  function renderBom() {
    if (!bomTreeContainer) return;

    const ecn = calculationService.activeEcn || {};
    const partOld = ecn.partOld || 'COMP-A-104';
    const impact = bomModel.analyzeComponentImpact(partOld);
    const circularCheck = bomModel.detectCircularDependencies();

    if (bomAcyclicBadge) {
      bomAcyclicBadge.textContent = circularCheck.hasCycle ? 'CIRCULAR DEPENDENCY DETECTED' : 'VALID ACYCLIC BOM';
      bomAcyclicBadge.className = `badge ${circularCheck.hasCycle ? 'badge-risk' : 'badge-feasible'}`;
    }

    if (bomProductsCount) bomProductsCount.textContent = `${impact.productCount} Finished Goods`;
    if (bomAssembliesCount) bomAssembliesCount.textContent = `${impact.subassemblyCount} Subassemblies`;
    if (bomCombinedDemand) bomCombinedDemand.textContent = `${impact.totalDailyDemand} Units / Day`;

    // Render interactive hierarchical tree
    bomTreeContainer.innerHTML = bomModel.products.map(prd => {
      const isProductAffected = impact.affectedProducts.some(p => p.productId === prd.id);

      return `
        <div class="bom-product-node" style="margin-bottom: 1rem; border: 1px solid var(--border-color); border-radius: var(--radius-sm); overflow: hidden; background: #FFF;">
          <div style="padding: 0.75rem 1rem; background: ${isProductAffected ? 'rgba(37, 99, 235, 0.05)' : 'var(--bg-surface-subtle)'}; display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid var(--border-color);">
            <div>
              <span style="font-family: var(--font-mono); font-size: 0.75rem; color: var(--text-muted);">${prd.id}</span>
              <div style="font-weight: 700; font-size: 0.9rem; color: var(--navy-primary);">${prd.name}</div>
              <div style="font-size: 0.75rem; color: var(--text-muted);">${prd.plant} &bull; ${prd.line} &bull; Rate: <strong>${prd.dailyProductionRate} units/day</strong></div>
            </div>
            <div>
              ${isProductAffected 
                ? '<span class="badge badge-warning" style="font-size: 0.7rem;">AFFECTED BY CHANGE</span>' 
                : '<span class="badge badge-neutral" style="font-size: 0.7rem;">UNAFFECTED</span>'}
            </div>
          </div>

          <div style="padding: 0.75rem 1rem; padding-left: 2rem;">
            ${prd.subassemblies.map(sub => {
              const isSubAffected = sub.components.some(c => c.componentId === partOld);

              return `
                <div style="margin-bottom: 0.75rem; padding-left: 1rem; border-left: 2px solid ${isSubAffected ? 'var(--blue-primary)' : 'var(--border-color)'};">
                  <div style="display: flex; justify-content: space-between; font-size: 0.825rem;">
                    <div>
                      <span style="font-family: var(--font-mono); font-size: 0.725rem; color: var(--text-muted);">${sub.id}</span>
                      <strong style="color: var(--navy-primary); margin-left: 0.35rem;">${sub.name}</strong>
                      <span style="color: var(--text-muted); font-size: 0.75rem;">(Qty: ${sub.qtyPerProduct} per product)</span>
                    </div>
                  </div>

                  <div style="margin-top: 0.35rem; padding-left: 1rem;">
                    ${sub.components.map(comp => {
                      const isTargetComp = comp.componentId === partOld;
                      return `
                        <div style="display: flex; justify-content: space-between; align-items: center; font-size: 0.785rem; padding: 0.25rem 0; ${isTargetComp ? 'background: #EFF6FF; padding: 0.25rem 0.5rem; border-radius: 3px;' : ''}">
                          <div>
                            <span style="font-family: var(--font-mono); font-weight: 700; color: ${isTargetComp ? 'var(--blue-primary)' : 'inherit'};">${comp.componentId}</span>
                            ${isTargetComp ? ` &rarr; <span style="font-family: var(--font-mono); font-weight: 700; color: var(--success-green);">${comp.replacementId}</span>` : ''}
                            <span style="color: var(--text-muted); font-size: 0.725rem;">(QPA: ${comp.qtyPerSubassembly})</span>
                          </div>
                          <div>
                            ${isTargetComp ? '<span class="badge badge-blue" style="font-size: 0.65rem;">ACTIVE ECN TARGET</span>' : '<span style="color: var(--text-light); font-size: 0.7rem;">Unchanged</span>'}
                          </div>
                        </div>
                      `;
                    }).join('')}
                  </div>
                </div>
              `;
            }).join('')}
          </div>
        </div>
      `;
    }).join('');
  }

  if (downloadBomReportBtn) {
    downloadBomReportBtn.addEventListener('click', () => {
      const ecn = calculationService.activeEcn || {};
      const partOld = ecn.partOld || 'COMP-A-104';
      const impact = bomModel.analyzeComponentImpact(partOld);

      const headers = ['Product_ID', 'Product_Name', 'Production_Line', 'Plant', 'Daily_Rate', 'Component_Qty_Per_Product', 'Daily_Component_Consumption'];
      const rows = impact.affectedProducts.map(p => [
        p.productId,
        `"${p.productName}"`,
        `"${p.line}"`,
        `"${p.plant}"`,
        p.dailyRate,
        p.componentQtyPerProduct,
        p.dailyComponentConsumption
      ]);

      const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `CutoverGuard_BOM_Impact_${ecn.id || 'ECN-0248'}.csv`;
      a.click();
      URL.revokeObjectURL(url);
    });
  }

  EventBus.on('ecn:changed', renderBom);
  EventBus.on('calculations:reconfigured', renderBom);

  renderBom();
}
