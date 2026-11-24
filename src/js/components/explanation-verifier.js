/**
 * Explanation Fact-Checking Verification Component
 * Validates natural language AI explanations against deterministic calculation ground truth.
 */
import { EventBus } from '../core/event-bus.js';

/**
 * Generates an accurate explanation dynamically from current deterministic ground-truth values.
 */
export function generateAccurateExplanation(ecn = {}, model = {}) {
  const ecnId = ecn.id || 'ECN-0248';
  const day = model.day || 15;
  const dayStr = `${day < 10 ? '0' + day : day} DEC`;
  const excess = model.excessOldUnits !== undefined ? model.excessOldUnits : 120;
  const shortage = model.shortageUnits !== undefined ? model.shortageUnits : 0;
  const cost = (model.totalIndex !== undefined ? model.totalIndex : 82.4).toFixed(1);
  const feasibleStr = model.isFeasible ? 'feasible' : 'infeasible';
  const shortageStr = shortage === 0 ? 'zero shortage exposure' : `${shortage} units of shortage exposure`;

  return `For ${ecnId}, the recommended cutover date is ${dayStr}. The calculated old stock remaining is ${excess} units, with ${shortageStr} and a relative cost index of ${cost}. The transition is currently classified as ${feasibleStr} based on the evaluated inputs and constraints.`;
}

/**
 * Generates a deliberately hallucinated explanation to test the verification gate.
 */
export function generateHallucinatedExplanation(ecn = {}, model = {}) {
  const ecnId = ecn.id || 'ECN-0248';
  return `For ${ecnId}, transitioning on 04 DEC provides an optimal balance with only 12 units of old stock remaining and 45 units of shortage exposure, achieving an exceptional cost index of 41.2.`;
}

/**
 * Verifies factual claims in an explanation text against a deterministic model snapshot.
 */
export function verifyExplanationClaims(text, model = {}, ecn = {}) {
  const expectedDay = model.day || 15;
  const expectedDateStr = `${expectedDay < 10 ? '0' + expectedDay : expectedDay} DEC`;
  const altDateStr = `${expectedDay} DEC`;
  const expectedStock = model.excessOldUnits !== undefined ? model.excessOldUnits : 120;
  const expectedCost = (model.totalIndex !== undefined ? model.totalIndex : 82.4).toFixed(1);
  const expectedShortage = model.shortageUnits !== undefined ? model.shortageUnits : 0;
  const expectedFeasible = model.isFeasible !== undefined ? model.isFeasible : true;

  const discrepancies = [];

  // 1. Check Date Claim
  const hasExpectedDate = text.includes(expectedDateStr) || 
                          text.includes(altDateStr) || 
                          text.includes(`${expectedDay} Dec`) || 
                          text.includes(`${expectedDay}th Dec`);
  
  // Detect explicit incorrect date claims (e.g. "04 DEC", "4 DEC", "28 DEC")
  const dateMatches = [...text.matchAll(/(\d{1,2})\s*(?:DEC|Dec|december|December)/g)];
  if (dateMatches.length > 0) {
    const claimedDays = dateMatches.map(m => parseInt(m[1], 10));
    if (!claimedDays.includes(expectedDay)) {
      discrepancies.push(`Cutover date mismatch: text claims ${claimedDays[0]} DEC, but deterministic ground truth is ${expectedDateStr}.`);
    }
  } else if (!hasExpectedDate) {
    discrepancies.push(`Cutover date mismatch: text does not state ground truth date (${expectedDateStr}).`);
  }

  // 2. Check Old Stock Quantity
  const stockMatch = text.match(/(\d+)\s*(?:units?|u)?\s*(?:of\s*)?(?:old\s*stock|remaining|stock\s*remaining)/i) ||
                     text.match(/(?:old\s*stock|stock\s*remaining)[^\d]*(\d+)\s*(?:units?|u)?/i);
  if (stockMatch) {
    const claimedStock = parseInt(stockMatch[1], 10);
    if (claimedStock !== expectedStock) {
      discrepancies.push(`Old stock quantity mismatch: text claims ${claimedStock} units, but computed ground truth is ${expectedStock} units.`);
    }
  } else if (!text.includes(expectedStock.toString())) {
    discrepancies.push(`Old stock quantity mismatch: text does not reflect computed ${expectedStock} units.`);
  }

  // 3. Check Cost Index
  const costMatch = text.match(/(?:cost\s*index|relative\s*cost)[^\d]*(\d+\.?\d*)/i) ||
                    text.match(/(\d+\.\d+)\s*(?:points|pts|cost\s*index)?/);
  if (costMatch) {
    const claimedCost = parseFloat(costMatch[1]);
    const expectedNum = parseFloat(expectedCost);
    if (Math.abs(claimedCost - expectedNum) > 0.5) {
      discrepancies.push(`Cost index mismatch: text claims ${claimedCost.toFixed(1)}, but computed ground truth is ${expectedCost}.`);
    }
  } else if (!text.includes(expectedCost) && !text.includes(Math.round(parseFloat(expectedCost)).toString())) {
    discrepancies.push(`Cost index mismatch: computed ground truth is ${expectedCost}.`);
  }

  // 4. Check Shortage Exposure
  const claimsZeroShortage = /0\s*(?:units?|u)?\s*(?:of\s*)?shortage|zero\s*shortage|no\s*shortage/i.test(text);
  const shortageMatch = text.match(/(\d+)\s*(?:units?|u)?\s*(?:of\s*)?shortage/i) || 
                        text.match(/shortage\s*(?:exposure\s*)?(?:of\s*)?(\d+)/i);

  if (expectedShortage === 0) {
    if (shortageMatch && parseInt(shortageMatch[1], 10) !== 0) {
      discrepancies.push(`Shortage mismatch: text claims ${shortageMatch[1]} units shortage exposure, but verified ground truth is 0 units.`);
    } else if (!claimsZeroShortage && !text.includes('0 units of shortage') && !text.includes('zero shortage')) {
      discrepancies.push(`Shortage mismatch: text does not confirm 0 units shortage exposure.`);
    }
  } else {
    if (claimsZeroShortage) {
      discrepancies.push(`Shortage mismatch: text claims zero shortage, but ground truth is ${expectedShortage} units shortage deficit.`);
    } else if (shortageMatch && parseInt(shortageMatch[1], 10) !== expectedShortage) {
      discrepancies.push(`Shortage mismatch: text claims ${shortageMatch[1]} units shortage, but ground truth is ${expectedShortage} units.`);
    }
  }

  // 5. Check Feasibility Status
  const claimsInfeasible = /\binfeasible\b/i.test(text);
  const claimsFeasible = /\bfeasible\b/i.test(text) && !claimsInfeasible;
  if (expectedFeasible && claimsInfeasible) {
    discrepancies.push(`Feasibility classification mismatch: text claims transition is infeasible, but ground truth confirms feasible.`);
  } else if (!expectedFeasible && claimsFeasible) {
    discrepancies.push(`Feasibility classification mismatch: text claims transition is feasible, but ground truth indicates shortage violation.`);
  }

  const isValid = discrepancies.length === 0;

  return {
    isValid,
    discrepancies,
    expected: {
      date: expectedDateStr,
      stock: expectedStock,
      cost: expectedCost,
      shortage: expectedShortage,
      feasible: expectedFeasible
    }
  };
}

export function initExplanationVerifier(calculationService) {
  const aiExplanationInput = document.getElementById('aiExplanationInput');
  const verifyExplanationBtn = document.getElementById('verifyExplanationBtn');
  const loadAccurateExpBtn = document.getElementById('loadAccurateExpBtn');
  const loadHallucinatedExpBtn = document.getElementById('loadHallucinatedExpBtn');
  const verificationResultBox = document.getElementById('verificationResultBox');
  const verificationResultHeader = document.getElementById('verificationResultHeader');
  const verificationResultDetails = document.getElementById('verificationResultDetails');
  
  // Left ground truth table elements
  const gtCutoverDate = document.getElementById('gt-cutover-date');
  const gtOldStock = document.getElementById('gt-old-stock');
  const gtShortage = document.getElementById('gt-shortage');
  const gtCostIndex = document.getElementById('gt-cost-index');
  const gtFeasibility = document.getElementById('gt-feasibility');

  function getCurrentModel() {
    const day = calculationService.cutoverModel.targetOptimalDay || 15;
    return calculationService.evaluateCandidateDay(day);
  }

  function updateGroundTruthTable(model) {
    const ecn = calculationService.activeEcn || {};
    const day = model.day || 15;
    const dayStr = `${day < 10 ? '0' + day : day} DEC`;

    if (gtCutoverDate) gtCutoverDate.textContent = dayStr;
    if (gtOldStock) gtOldStock.textContent = `${model.excessOldUnits} units`;
    if (gtShortage) gtShortage.textContent = `${model.shortageUnits} units`;
    if (gtCostIndex) gtCostIndex.textContent = model.totalIndex.toFixed(1);
    if (gtFeasibility) {
      gtFeasibility.textContent = model.isFeasible ? 'FEASIBLE' : 'INFEASIBLE';
      gtFeasibility.style.color = model.isFeasible ? 'var(--success-green)' : 'var(--risk-red)';
    }
  }

  function runVerification() {
    if (!aiExplanationInput) return;

    const text = aiExplanationInput.value;
    const model = getCurrentModel();
    const ecn = calculationService.activeEcn || {};

    updateGroundTruthTable(model);

    const result = verifyExplanationClaims(text, model, ecn);

    if (result.isValid) {
      if (verificationResultBox) verificationResultBox.className = 'verification-result-box pass';
      if (verificationResultHeader) verificationResultHeader.textContent = 'VERIFIED — ALL NUMERICAL CLAIMS MATCH COMPUTED GROUND TRUTH';
      if (verificationResultDetails) {
        verificationResultDetails.textContent = `Candidate date (${result.expected.date}), old stock balance (${result.expected.stock}u), shortage (${result.expected.shortage}u), and cost index (${result.expected.cost}) mathematically confirmed.`;
      }
    } else {
      if (verificationResultBox) verificationResultBox.className = 'verification-result-box fail';
      if (verificationResultHeader) verificationResultHeader.textContent = 'BLOCKED — FACTUAL MISMATCH DETECTED';
      if (verificationResultDetails) {
        verificationResultDetails.innerHTML = `<strong>Deterministic Rule Verification:</strong><br>• ${result.discrepancies.join('<br>• ')}`;
      }
    }
  }

  function loadAccurate() {
    const model = getCurrentModel();
    const ecn = calculationService.activeEcn || {};
    updateGroundTruthTable(model);
    if (aiExplanationInput) {
      aiExplanationInput.value = generateAccurateExplanation(ecn, model);
    }
    runVerification();
  }

  function loadHallucinated() {
    const model = getCurrentModel();
    const ecn = calculationService.activeEcn || {};
    updateGroundTruthTable(model);
    if (aiExplanationInput) {
      aiExplanationInput.value = generateHallucinatedExplanation(ecn, model);
    }
    runVerification();
  }

  if (verifyExplanationBtn) verifyExplanationBtn.addEventListener('click', runVerification);
  if (loadAccurateExpBtn) loadAccurateExpBtn.addEventListener('click', loadAccurate);
  if (loadHallucinatedExpBtn) loadHallucinatedExpBtn.addEventListener('click', loadHallucinated);

  // Sync when calculations or active ECN change
  EventBus.on('calculations:reconfigured', () => {
    loadAccurate();
  });
  EventBus.on('ecn:changed', () => {
    loadAccurate();
  });

  // Initial load: display accurate text verified
  loadAccurate();
}
