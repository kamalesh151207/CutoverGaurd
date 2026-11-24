/**
 * CutoverGuard Comprehensive Automated Test Suite
 * Verifies Deterministic Math Models, AI Risk Prediction, Pareto Optimization,
 * Digital Twin Simulation, Guardrails, and REST API Endpoints.
 */

import http from 'http';
import { CutoverModel } from '../src/js/models/cutover-model.js';
import { CostModel } from '../src/js/models/cost-model.js';
import { CutoverIntelligenceEngine } from '../src/js/models/ai-engine.js';
import { ParetoModel } from '../src/js/models/pareto-model.js';
import { DigitalTwinModel } from '../src/js/models/digital-twin-model.js';
import { GuardrailsModel } from '../src/js/models/guardrails-model.js';
import { CalculationService } from '../src/js/services/calculation-service.js';
import { handleApiRequest } from '../src/api/routes.js';
import { generateAccurateExplanation, generateHallucinatedExplanation, verifyExplanationClaims } from '../src/js/components/explanation-verifier.js';
import { bomModel } from '../src/js/models/bom-model.js';
import { ecnIntelligenceService } from '../src/js/services/ecn-intelligence-service.js';

let passed = 0;
let failed = 0;

function assert(condition, testName) {
  if (condition) {
    console.log(`  \x1b[32m✔ PASS\x1b[0m ${testName}`);
    passed++;
  } else {
    console.error(`  \x1b[31m✘ FAIL\x1b[0m ${testName}`);
    failed++;
  }
}

function assertClose(actual, expected, tolerance = 0.5, testName) {
  const diff = Math.abs(actual - expected);
  assert(diff <= tolerance, `${testName} (expected ~${expected}, got ${actual})`);
}

async function request(options, postData = null) {
  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, data: JSON.parse(body) });
        } catch {
          resolve({ status: res.statusCode, data: body });
        }
      });
    });
    req.on('error', reject);
    if (postData) {
      req.write(typeof postData === 'string' ? postData : JSON.stringify(postData));
    }
    req.end();
  });
}

console.log('\n=============================================================');
console.log('   CUTOVERGUARD INDUSTRIAL DECISION INTELLIGENCE TEST SUITE   ');
console.log('=============================================================\n');

// -------------------------------------------------------------
// SUITE 1: DETERMINISTIC MATERIAL NETTING & COST CURVE
// -------------------------------------------------------------
console.log('[Suite 1: Deterministic Material Netting & Optimization]');
const cutoverModel = new CutoverModel({
  initialOldStock: 680,
  baseDemand: 40,
  newMaterialReadyDay: 11
});

// Feasibility check: Day 10 is before dock ready (Day 11) -> shortage = 40
const evalDay10 = cutoverModel.evaluateDay(10);
assert(!evalDay10.isFeasible, 'Day 10 (pre-dock) is correctly flagged as INFEASIBLE');
assert(evalDay10.shortageUnits === 40, 'Day 10 has exact shortage deficit of 40 units');

// Feasibility check: Day 11 is dock ready -> zero shortage
const evalDay11 = cutoverModel.evaluateDay(11);
assert(evalDay11.isFeasible, 'Day 11 (dock ready) is FEASIBLE with zero shortage');
assert(evalDay11.shortageUnits === 0, 'Day 11 shortage deficit is exactly 0');
assert(evalDay11.excessOldUnits === 280, 'Day 11 excess old stock is exactly 280 units');

// Day 15 (Optimal) evaluation
const evalDay15 = cutoverModel.evaluateDay(15);
assert(evalDay15.isFeasible, 'Day 15 is FEASIBLE');
assert(evalDay15.excessOldUnits === 120, 'Day 15 excess stock burns down to 120 units');
assert(evalDay15.shortageUnits === 0, 'Day 15 maintains zero shortage');

// Day 17 (Burnout day)
assert(cutoverModel.burnDays === 17, 'Deterministic old stock exhaustion occurs at Day 17');
const evalDay18 = cutoverModel.evaluateDay(18);
assert(evalDay18.excessOldUnits === 0, 'Day 18 excess stock is 0 units (fully consumed)');

// Cost Model Verification
const costModel = new CostModel({
  initialOldStock: cutoverModel.initialOldStock,
  baseDemand: cutoverModel.baseDemand,
  targetOptimalDay: cutoverModel.targetOptimalDay,
  lrmDay: cutoverModel.lrmDay
});
const costDay15 = costModel.computeCost(15, evalDay15.excessOldUnits, evalDay15.shortageUnits);
assert(costDay15.totalIndex > 0 && costDay15.totalIndex < 100, `Day 15 cost index (${costDay15.totalIndex.toFixed(1)}) is in optimal range`);
assert(costDay15.shortageCostIndex === 0, 'Day 15 shortage cost is exactly 0');

// Edge cases
const zeroStockModel = new CutoverModel({ initialOldStock: 0, baseDemand: 40, newMaterialReadyDay: 11 });
const evalZeroStockDay11 = zeroStockModel.evaluateDay(11);
assert(evalZeroStockDay11.isFeasible && evalZeroStockDay11.excessOldUnits === 0, 'Edge case: Stock=0 evaluates cleanly with 0 excess');

const lateDockModel = new CutoverModel({ initialOldStock: 680, baseDemand: 40, newMaterialReadyDay: 22 });
assert(!lateDockModel.evaluateDay(15).isFeasible, 'Edge case: Delayed dock (Day 22) makes Day 15 infeasible');

// -------------------------------------------------------------
// SUITE 2: CUTOVER INTELLIGENCE ENGINE (AI/ML)
// -------------------------------------------------------------
console.log('\n[Suite 2: Cutover Intelligence Engine (AI/ML & XAI)]');
const aiEngine = new CutoverIntelligenceEngine();

// Model Card Verification
assert(aiEngine.modelCard.modelName.includes('Ensemble'), 'AI Model Card contains valid architecture name');
assert(aiEngine.modelCard.evaluationMetrics.accuracy === '94.2%', 'AI Model Card reports certified 94.2% accuracy');
assert(aiEngine.modelCard.limitations.length >= 2, 'AI Model Card includes explicit industrial limitations');

// Ingestion & Risk Prediction
const riskInference = aiEngine.predictRisks({
  poStatus: 'confirmed',
  dualSource: 'yes',
  variability: 2
}, {
  day: 15,
  isFeasible: true,
  shortageUnits: 0,
  excessOldUnits: 120,
  lrmBufferDays: 4
});

assert(riskInference.category.includes('LOW') || riskInference.category.includes('MINIMAL'), `Predicted composite risk (${riskInference.metrics.compositeRisk}%) is correctly low for cleared baseline`);
assert(riskInference.metrics.shortageRisk < 1.0, 'Shortage risk is < 1% when zero shortage is physically verified');
assert(riskInference.drivers.length >= 3, 'Explainable AI waterfall provides at least 3 feature attributions');
assert(riskInference.mitigations.length >= 2, 'Actionable mitigations generated for industrial planners');

// Grounded explanation verification
const groundedExp = aiEngine.generateDecisionExplanation({ ...evalDay15, ...costDay15 }, { id: 'ECN-0248', partOld: 'COMP-A-104', partNew: 'COMP-B-208' });
assert(groundedExp.includes('ECN-0248'), 'AI narrative references correct ECN ID');
assert(groundedExp.includes('120 units'), 'AI narrative strictly reflects deterministic 120 units excess');
assert(!groundedExp.includes('NaN'), 'AI narrative has no NaN values');

// AI Verification Gate: Accurate vs Hallucinated Fact Checking
const modelSnapshot = { day: 15, excessOldUnits: 120, shortageUnits: 0, totalIndex: 82.4, isFeasible: true };
const activeEcn = { id: 'ECN-0248' };
const accurateText = generateAccurateExplanation(activeEcn, modelSnapshot);
const accurateVerification = verifyExplanationClaims(accurateText, modelSnapshot, activeEcn);
assert(accurateVerification.isValid === true, 'AI Verification Gate: Accurate explanation VERIFIED');
assert(accurateVerification.discrepancies.length === 0, 'AI Verification Gate: Zero factual discrepancies detected for accurate text');

const hallucinatedText = generateHallucinatedExplanation(activeEcn, modelSnapshot);
const hallucinatedVerification = verifyExplanationClaims(hallucinatedText, modelSnapshot, activeEcn);
assert(hallucinatedVerification.isValid === false, 'AI Verification Gate: Hallucinated explanation BLOCKED');
assert(hallucinatedVerification.discrepancies.length >= 3, `AI Verification Gate: Correctly isolated ${hallucinatedVerification.discrepancies.length} factual discrepancies in hallucinated text`);

// Strategy Comparison
const calcService = new CalculationService();
const strategies = aiEngine.compareStrategies(calcService);
assert(strategies.length === 4, 'Provides 4 distinct operational cutover strategies');
const recStrategy = strategies.find(s => s.isRecommended);
assert(recStrategy && recStrategy.strategy.includes('Balanced Optimal'), 'Correctly identifies Balanced Optimal as recommended');

// -------------------------------------------------------------
// SUITE 3: MULTI-OBJECTIVE PARETO OPTIMIZATION
// -------------------------------------------------------------
console.log('\n[Suite 3: Multi-Objective Pareto Optimization]');
const paretoResult = calcService.computeParetoFrontier();

assert(paretoResult.paretoPoints.length >= 3, `Identified ${paretoResult.paretoPoints.length} non-dominated Pareto points`);
assert(paretoResult.allPoints.length === 31, 'Evaluated all 31 candidate days in horizon');
assert(paretoResult.recommended.day >= 14 && paretoResult.recommended.day <= 16, `Pareto balanced recommendation is Day ${paretoResult.recommended.day} (within 14-16 DEC target)`);

// Verify Pareto non-domination property: no point on frontier is strictly worse in both cost and risk than another
let paretoConsistent = true;
for (let i = 0; i < paretoResult.paretoPoints.length; i++) {
  for (let j = 0; j < paretoResult.paretoPoints.length; j++) {
    if (i !== j) {
      const p1 = paretoResult.paretoPoints[i];
      const p2 = paretoResult.paretoPoints[j];
      if (p1.cost <= p2.cost && p1.shortageRisk <= p2.shortageRisk && (p1.cost < p2.cost || p1.shortageRisk < p2.shortageRisk)) {
        paretoConsistent = false;
        break;
      }
    }
  }
}
assert(paretoConsistent, 'Pareto frontier satisfies mathematical non-domination criteria');

// -------------------------------------------------------------
// SUITE 4: DIGITAL CUTOVER TWIN SIMULATION
// -------------------------------------------------------------
console.log('\n[Suite 4: Digital Cutover Twin Simulation]');
const twinSim = calcService.simulateDigitalTwin(15, 30);

assert(twinSim.timeline.length === 30, 'Simulated complete 30-day discrete trajectory');
assert(twinSim.cutoverDay === 15, 'Cutover marker fixed at Day 15');
assert(twinSim.dockDay === 11, 'Dock arrival marker at Day 11');
assert(twinSim.totalShortage === 0, 'Zero production shortage recorded across 30 days');
assert(twinSim.isFeasible === true, 'Simulation confirms overall transition feasibility');

// Initial day stock matches initial warehouse stock minus day 1 consumption
assert(twinSim.timeline[0].oldStock === 640, 'Day 1 ends with 640 units (680 initial minus 40 consumed)');

// -------------------------------------------------------------
// SUITE 5: PRODUCTION GUARDRAILS ENGINE
// -------------------------------------------------------------
console.log('\n[Suite 5: Recommendation Guardrails Compliance]');
const clearedGuardrails = calcService.evaluateGuardrails(15);
assert(clearedGuardrails.allPassed, 'Day 15 clears all 5 industrial guardrails');
assert(clearedGuardrails.statusLabel.includes('PASSED'), 'Guardrails status reports ALL GUARDRAILS PASSED');

const violatedGuardrails = calcService.evaluateGuardrails(8);
assert(!violatedGuardrails.allPassed, 'Day 8 fails guardrails due to pre-dock arrival and shortage');

// -------------------------------------------------------------
// SUITE 6: REST API ENDPOINTS (IN-MEMORY HANDLER)
// -------------------------------------------------------------
console.log('\n[Suite 6: REST API Endpoints Verification]');

function invokeApi(pathname, method = 'GET', body = null) {
  return new Promise(async (resolve, reject) => {
    try {
      let responseData = '';
      let responseStatus = 200;
      let headersSent = {};
      const res = {
        writeHead(status, headers) {
          responseStatus = status;
          headersSent = headers;
        },
        end(data) {
          responseData = data;
          try {
            resolve({ status: responseStatus, data: JSON.parse(responseData) });
          } catch {
            resolve({ status: responseStatus, data: responseData });
          }
        }
      };
      const req = {
        url: pathname,
        method,
        headers: { host: 'localhost:3000' },
        on(event, handler) {
          if (event === 'data' && body) {
            handler(Buffer.from(JSON.stringify(body)));
          }
          if (event === 'end') {
            handler();
          }
        }
      };
      await handleApiRequest(req, res);
    } catch (e) {
      reject(e);
    }
  });
}

try {
  // 1. GET /api/db/status
  const dbRes = await invokeApi('/api/db/status', 'GET');
  assert(dbRes.status === 200, 'GET /api/db/status returns HTTP 200');
  assert(dbRes.data.success === true, 'Database status reports success: true');

  // 2. GET /api/ecns
  const ecnsRes = await invokeApi('/api/ecns', 'GET');
  assert(ecnsRes.status === 200, 'GET /api/ecns returns HTTP 200');
  assert(Array.isArray(ecnsRes.data.data) && ecnsRes.data.data.length >= 4, 'GET /api/ecns returns at least 4 active ECNs');

  // 3. GET /api/decisions
  const decRes = await invokeApi('/api/decisions', 'GET');
  assert(decRes.status === 200, 'GET /api/decisions returns HTTP 200');
  assert(Array.isArray(decRes.data.data), 'GET /api/decisions returns decision records array');

  // 4. GET /api/audit
  const auditRes = await invokeApi('/api/audit', 'GET');
  assert(auditRes.status === 200, 'GET /api/audit returns HTTP 200');
  assert(Array.isArray(auditRes.data.data), 'GET /api/audit returns cryptographic audit chain');

  // 5. GET /api/ai/model-card
  const modelCardRes = await invokeApi('/api/ai/model-card', 'GET');
  assert(modelCardRes.status === 200, 'GET /api/ai/model-card returns HTTP 200');
  assert(modelCardRes.data.data.evaluationMetrics.accuracy === '94.2%', 'Model card endpoint serves verified ML accuracy');

  // 6. POST /api/ai/predict
  const predictRes = await invokeApi('/api/ai/predict', 'POST', { day: 15, poStatus: 'confirmed', dualSource: 'yes' });
  assert(predictRes.status === 200, 'POST /api/ai/predict returns HTTP 200');
  assert(predictRes.data.data.metrics.compositeRisk !== undefined, 'POST /api/ai/predict computes composite risk metric');

} catch (err) {
  console.error('API Test Error:', err);
  failed++;
}

// -------------------------------------------------------------
// TEST SUITE: MULTI-LEVEL BOM TRAVERSAL & AGGREGATE DEMAND
// -------------------------------------------------------------
console.log('\n--- Test Suite 9: Multi-Level BOM Traversal & Shared Components ---');
try {
  // Acyclic Dependency Check
  const cycleResult = bomModel.detectCircularDependencies();
  assert(cycleResult.hasCycle === false, 'BOM Graph is acyclic without circular dependency loops');
  assert(cycleResult.visitedCount >= 4, `All top-level product structures validated (${cycleResult.visitedCount} nodes)`);

  // Shared Component Impact Analysis (COMP-A-104)
  const compImpact = bomModel.analyzeComponentImpact('COMP-A-104');
  assert(compImpact.productCount === 2, 'COMP-A-104 impacts exactly 2 finished good product lines');
  assert(compImpact.subassemblyCount === 2, 'COMP-A-104 traverses 2 intermediate subassemblies');
  assert(compImpact.totalDailyDemand === 40, 'Multi-product aggregated daily demand equals exactly 40 units/day (15*2 + 10*1)');
  assert(compImpact.isCommonComponent === true, 'COMP-A-104 flagged as common component shared across multiple lines');
  assert(compImpact.affectedProducts.some(p => p.productId === 'PRD-EV-INVERTER-X1'), 'Includes PRD-EV-INVERTER-X1 at 30 units/day');
  assert(compImpact.affectedProducts.some(p => p.productId === 'PRD-SERVO-DRIVE-S5'), 'Includes PRD-SERVO-DRIVE-S5 at 10 units/day');

  // Single-product component impact
  const valveImpact = bomModel.analyzeComponentImpact('VALVE-HYD-04');
  assert(valveImpact.productCount === 1, 'VALVE-HYD-04 impacts 1 finished good product');
  assert(valveImpact.totalDailyDemand === 25, 'VALVE-HYD-04 aggregated demand is 25 units/day');
} catch (err) {
  console.error('BOM Test Error:', err);
  failed++;
}

// -------------------------------------------------------------
// TEST SUITE: AUTOMATED ECN INTELLIGENCE PIPELINE
// -------------------------------------------------------------
console.log('\n--- Test Suite 10: Automatic ECN Intelligence & Optimization Pipeline ---');
try {
  const testEcn = {
    id: 'ECN-0248',
    title: 'MOSFET Power Stage Thermal Redesign',
    partOld: 'COMP-A-104',
    partNew: 'COMP-B-208',
    plant: 'Plant 3 (Austin, TX)',
    line: 'Line 3 (Powertrain Inverter)',
    onHand: 680,
    reserved: 80,
    unitCost: 12.00,
    replacementUnitCost: 14.50,
    supplierLeadTimeDays: 10,
    dailyConsumption: 40
  };

  const analysis = ecnIntelligenceService.analyzeEcn(testEcn);

  // Validate optimization output
  assert(analysis.optimization.recommendedDay === 15, 'ECN analysis recommends optimal cutover Day 15');
  assert(analysis.optimization.recommendedDate === '15-DEC', 'ECN analysis maps Day 15 to 15-DEC calendar date');
  assert(analysis.optimization.shortageDeficit === 0, 'Zero stockout shortage deficit at recommended cutover date');
  assert(analysis.optimization.isFeasible === true, 'Recommended cutover passes all physical and supplier feasibility checks');
  assert(analysis.optimization.feasibleRange === '11–19 DEC', 'Feasible cutover window correctly spans 11-DEC through 19-DEC');
  assert(analysis.optimization.lrmDay === 19, 'Latest Responsible Moment calculated at Day 19 (19-DEC)');
  assert(analysis.inventory.available === 600, 'Available stock correctly balances: onHand (680) - reserved (80) = 600');
  assert(analysis.inventory.dockDay === 11, 'Replacement dock arrival calculated at Day 11 (PO Day 1 + 10-day lead time)');

  // Validate narrative grounding
  assert(analysis.narrative.summary.includes('15 DEC') || analysis.narrative.summary.includes('15-DEC'), 'Narrative summary explicitly references recommended date 15-DEC');
  assert(analysis.narrative.summary.includes('120 units') || analysis.narrative.summary.includes('600'), 'Narrative summary cites exact physical inventory netting');
  assert(Array.isArray(analysis.narrative.keyTakeaways) && analysis.narrative.keyTakeaways.length >= 3, 'Provides at least 3 structured engineering takeaways');
} catch (err) {
  console.error('ECN Intelligence Test Error:', err);
  failed++;
}

// -------------------------------------------------------------
// TEST SUITE 11: CUTOVER CALCULATION ENGINE & CONSTRAINT AUDIT
// -------------------------------------------------------------
console.log('\n--- Test Suite 11: Cutover Calculation Engine & Constraint Audit ---');
try {
  // Test 1: Incomplete ECN validation (No arbitrary default date)
  const incompleteEcn = { id: 'ECN-INCOMP' };
  const incRes = ecnIntelligenceService.analyzeEcn(incompleteEcn);
  assert(incRes.isFeasible === false, 'Incomplete ECN is marked infeasible');
  assert(incRes.missingFields.length >= 3, `Incomplete ECN isolated missing fields (${incRes.missingFields.join(', ')})`);
  assert(incRes.optimization.recommendedDate === 'INCOMPLETE — DATA REQUIRED', 'Incomplete ECN returns explicit INCOMPLETE indicator instead of arbitrary date');

  // Test 2: Infeasible Cutover Window (Dock Day beyond 30-day horizon)
  const infeasibleEcn = { id: 'ECN-LATE', partOld: 'COMP-A-104', partNew: 'COMP-B-208', onHand: 400, dailyDemand: 40, dockDay: 35 };
  const infRes = ecnIntelligenceService.analyzeEcn(infeasibleEcn);
  assert(infRes.isFeasible === false, 'Delayed dock beyond horizon flags transition as infeasible');
  assert(infRes.optimization.recommendedDate === 'NO FEASIBLE CUTOVER WINDOW', 'Infeasible ECN explicitly outputs NO FEASIBLE CUTOVER WINDOW');

  // Test 3: Dynamic Old Inventory Change (680 -> 920 units)
  const customStockEcn = { id: 'ECN-STK-920', partOld: 'COMP-A-104', partNew: 'COMP-B-208', onHand: 920, dailyDemand: 40, dockDay: 11, safetyBuffer: 2 };
  const stkRes = ecnIntelligenceService.analyzeEcn(customStockEcn);
  assert(stkRes.optimization.burnDays === 23, '920 units at 40/day burns down in exactly 23 days');
  assert(stkRes.optimization.recommendedDay === 21, 'Recommended cutover day shifts dynamically to Day 21 (23 - 2 buffer)');
  assert(stkRes.optimization.recommendedDate === '21-DEC', 'Recommended date maps to 21-DEC');

  // Test 4: Dynamic Demand Change (Surge to 50 u/day with 400 stock)
  const surgeEcn = { id: 'ECN-SURGE', partOld: 'COMP-A-104', partNew: 'COMP-B-208', onHand: 400, dailyDemand: 50, dockDay: 11 };
  const surgeRes = ecnIntelligenceService.analyzeEcn(surgeEcn);
  assert(surgeRes.optimization.burnDays === 8, '400 units at 50/day burns out on Day 8');
  assert(surgeRes.optimization.burnDays < surgeRes.inventory.dockDay, 'Surged burnout precedes dock Day 11, creating pre-dock deficit');

  // Test 5: Delayed Supplier Delivery (Dock Day 11 -> Day 16)
  const delayEcn = { id: 'ECN-DELAY', partOld: 'COMP-A-104', partNew: 'COMP-B-208', onHand: 680, dailyDemand: 40, dockDay: 16 };
  const delayRes = ecnIntelligenceService.analyzeEcn(delayEcn);
  assert(delayRes.optimization.earliestFeasibleDay === 16, 'Earliest feasible day shifts to Day 16');
  assert(delayRes.optimization.feasibleWindow === '16–19 DEC', 'Feasible window contracts to 16–19 DEC');
} catch (err) {
  console.error('Constraint Audit Test Error:', err);
  failed++;
}

// -------------------------------------------------------------
// TEST SUITE 12: REST API PERSISTENCE & DATA FLOW VERIFICATION
// -------------------------------------------------------------
console.log('\n--- Test Suite 12: REST API Persistence & Data Flow Verification ---');
try {
  // 1. Create custom ECN
  const postEcnRes = await invokeApi('/api/ecns', 'POST', {
    id: 'ECN-TEST-999',
    partOld: 'TEST-PART-OLD',
    partNew: 'TEST-PART-NEW',
    initialStock: 500,
    dailyDemand: 25,
    dockDay: 8
  });
  assert(postEcnRes.status === 201, 'POST /api/ecns creates new record with HTTP 201');
  assert(postEcnRes.data.data.id === 'ECN-TEST-999', 'Created record retains exact entered ID');
  assert(postEcnRes.data.data.initialStock === 500, 'Created record persists entered stock (500 units)');

  // 2. Query GET /api/ecns to confirm persistence
  const getEcnsRes = await invokeApi('/api/ecns', 'GET');
  assert(getEcnsRes.data.data.some(e => e.id === 'ECN-TEST-999'), 'GET /api/ecns confirms persistence of ECN-TEST-999');

  // 3. Update ECN via PUT
  const putEcnRes = await invokeApi('/api/ecns', 'PUT', {
    id: 'ECN-TEST-999',
    initialStock: 450
  });
  assert(putEcnRes.status === 200, 'PUT /api/ecns updates record with HTTP 200');
  assert(putEcnRes.data.data.initialStock === 450, 'Updated stock persists (450 units)');

  // 4. Save and retrieve scenario
  const postScenRes = await invokeApi('/api/scenarios', 'POST', {
    ecnId: 'ECN-TEST-999',
    cutoverDay: 18,
    costIndex: 85.5
  });
  assert(postScenRes.status === 201, 'POST /api/scenarios persists scenario run with HTTP 201');

  const getScenRes = await invokeApi('/api/scenarios', 'GET');
  assert(getScenRes.data.data.some(s => s.ecnId === 'ECN-TEST-999'), 'GET /api/scenarios confirms scenario persistence');
} catch (err) {
  console.error('API Persistence Test Error:', err);
  failed++;
}

// -------------------------------------------------------------
// TEST SUMMARY REPORT
// -------------------------------------------------------------
console.log('\n=============================================================');
console.log(`TEST SUITE RESULTS: \x1b[32m${passed} PASSED\x1b[0m, \x1b[${failed > 0 ? '31m' : '32m'}${failed} FAILED\x1b[0m`);
console.log('=============================================================\n');

if (failed > 0) {
  process.exit(1);
} else {
  process.exit(0);
}
