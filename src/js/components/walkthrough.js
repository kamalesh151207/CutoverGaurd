/**
 * 60-Second Demo Walkthrough Component
 */
import { WALKTHROUGH_STEPS } from '../data/demo-data.js';
import { router } from '../core/router.js';

export function initWalkthrough() {
  const wtStepNum = document.getElementById('walkthroughStepNum');
  if (!wtStepNum) return;
  const wtStepTag = document.getElementById('walkthroughStepTag');
  const wtStepTitle = document.getElementById('walkthroughStepTitle');
  const wtStepDesc = document.getElementById('walkthroughStepDesc');
  const wtProgressFill = document.getElementById('walkthroughProgressFill');
  const wtPrevBtn = document.getElementById('wtPrevBtn');
  const wtNextBtn = document.getElementById('wtNextBtn');
  const wtResetBtn = document.getElementById('wtResetBtn');

  let currentStep = 0;

  function renderStep(index) {
    currentStep = index;
    const step = WALKTHROUGH_STEPS[index];
    if (!step) return;

    if (wtStepNum) wtStepNum.textContent = step.num;
    if (wtStepTag) wtStepTag.textContent = step.tag;
    if (wtStepTitle) wtStepTitle.textContent = step.title;
    if (wtStepDesc) wtStepDesc.textContent = step.desc;

    const pct = ((index + 1) / WALKTHROUGH_STEPS.length) * 100;
    if (wtProgressFill) wtProgressFill.style.width = `${pct}%`;

    if (wtPrevBtn) wtPrevBtn.disabled = (index === 0);
    if (wtNextBtn) wtNextBtn.textContent = (index === WALKTHROUGH_STEPS.length - 1) ? 'Finish Tour' : 'Next Step →';

    // Remove previous highlights
    document.querySelectorAll('.walkthrough-highlight-target').forEach(el => {
      el.classList.remove('walkthrough-highlight-target');
    });

    const target = document.getElementById(step.targetId);
    if (target) {
      // Find parent page-view and navigate to it if needed
      const pageView = target.closest('.page-view');
      if (pageView && pageView.dataset.route) {
        if (router.getCurrentRoute() !== pageView.dataset.route) {
          router.navigate(pageView.dataset.route, true);
        }
      }

      setTimeout(() => {
        target.classList.add('walkthrough-highlight-target');
        target.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }, 60);
    }
  }

  if (wtNextBtn) {
    wtNextBtn.addEventListener('click', () => {
      if (currentStep < WALKTHROUGH_STEPS.length - 1) {
        renderStep(currentStep + 1);
      } else {
        alert('Walkthrough complete! Feel free to explore all 15 interactive modules.');
      }
    });
  }

  if (wtPrevBtn) {
    wtPrevBtn.addEventListener('click', () => {
      if (currentStep > 0) {
        renderStep(currentStep - 1);
      }
    });
  }

  if (wtResetBtn) {
    wtResetBtn.addEventListener('click', () => {
      renderStep(0);
    });
  }

  renderStep(0);
}
