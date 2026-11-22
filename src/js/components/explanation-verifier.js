/**
 * Explanation Fact-Checking Verification Component
 */
import { EXPLANATION_PRESETS } from '../data/demo-data.js';

export function initExplanationVerifier(calculationService) {
  const aiExplanationInput = document.getElementById('aiExplanationInput');
  const verifyExplanationBtn = document.getElementById('verifyExplanationBtn');
  const loadAccurateExpBtn = document.getElementById('loadAccurateExpBtn');
  const loadHallucinatedExpBtn = document.getElementById('loadHallucinatedExpBtn');
  const verificationResultBox = document.getElementById('verificationResultBox');
  const verificationResultHeader = document.getElementById('verificationResultHeader');
  const verificationResultDetails = document.getElementById('verificationResultDetails');
  const dateSlider = document.getElementById('cutoverDateSlider');

  if (aiExplanationInput) {
    aiExplanationInput.value = EXPLANATION_PRESETS.accurate;
  }

  function verify() {
    if (!aiExplanationInput) return;

    const text = aiExplanationInput.value;
    const selectedDay = dateSlider ? parseInt(dateSlider.value, 10) : 15;
    const model = calculationService.evaluateCandidateDay(selectedDay);

    const expectedDateStr = `${selectedDay} DEC`;
    const expectedStock = model.excessOldUnits;
    const expectedCost = model.totalIndex.toFixed(1);
    const expectedShortage = model.shortageUnits;

    const discrepancies = [];

    // 1. Check Date
    if (!text.includes(expectedDateStr) && !text.includes(`${selectedDay} Dec`) && !text.includes(`${selectedDay}th Dec`)) {
      discrepancies.push(`Cutover date mismatch: text does not match ground truth date (${expectedDateStr}).`);
    }

    // 2. Check Stock Quantity
    if (!text.includes(expectedStock.toString())) {
      discrepancies.push(`Old stock quantity mismatch: text does not reflect computed ${expectedStock} units.`);
    }

    // 3. Check Cost Index
    if (!text.includes(expectedCost) && !text.includes(Math.round(model.totalIndex).toString())) {
      discrepancies.push(`Cost index mismatch: computed value is ${expectedCost}.`);
    }

    // 4. Check Shortage Exposure
    const claimsZeroShortage = /0\s*(?:units?|u)?\s*(?:of\s*)?shortage|zero\s*shortage|no\s*shortage/i.test(text);
    const shortageNumberMatch = text.match(/(\d+)\s*(?:units?|u)?\s*(?:of\s*)?shortage/i) || text.match(/shortage\s*(?:exposure\s*)?(?:of\s*)?(\d+)/i);

    if (expectedShortage === 0) {
      if (shortageNumberMatch && parseInt(shortageNumberMatch[1], 10) !== 0) {
        discrepancies.push(`Shortage mismatch: text claims ${shortageNumberMatch[1]} units shortage, but ground truth is 0 units.`);
      }
    } else {
      if (claimsZeroShortage) {
        discrepancies.push(`Shortage mismatch: text claims zero shortage, but ground truth is ${expectedShortage} units unserved.`);
      } else if (shortageNumberMatch && parseInt(shortageNumberMatch[1], 10) !== expectedShortage) {
        discrepancies.push(`Shortage mismatch: text claims ${shortageNumberMatch[1]} units shortage, but ground truth is ${expectedShortage} units.`);
      }
    }

    if (discrepancies.length === 0) {
      if (verificationResultBox) verificationResultBox.className = 'verification-result-box pass';
      if (verificationResultHeader) verificationResultHeader.textContent = 'VERIFIED — ALL NUMERICAL CLAIMS MATCH COMPUTED GROUND TRUTH';
      if (verificationResultDetails) {
        verificationResultDetails.textContent = `Candidate date (${expectedDateStr}), stock balance (${expectedStock}u), shortage (${expectedShortage}u), and cost index (${expectedCost}) mathematically confirmed.`;
      }
    } else {
      if (verificationResultBox) verificationResultBox.className = 'verification-result-box fail';
      if (verificationResultHeader) verificationResultHeader.textContent = 'BLOCKED — FACTUAL MISMATCH DETECTED';
      if (verificationResultDetails) {
        verificationResultDetails.innerHTML = `<strong>Deterministic Rule Verification:</strong><br>• ${discrepancies.join('<br>• ')}`;
      }
    }
  }

  if (verifyExplanationBtn) verifyExplanationBtn.addEventListener('click', verify);

  if (loadAccurateExpBtn) {
    loadAccurateExpBtn.addEventListener('click', () => {
      if (aiExplanationInput) aiExplanationInput.value = EXPLANATION_PRESETS.accurate;
      verify();
    });
  }

  if (loadHallucinatedExpBtn) {
    loadHallucinatedExpBtn.addEventListener('click', () => {
      if (aiExplanationInput) aiExplanationInput.value = EXPLANATION_PRESETS.hallucinated;
      verify();
    });
  }

  verify();
}
