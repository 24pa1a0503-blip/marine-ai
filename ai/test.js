import { processQuery } from './orchestrator.js';

const TEST_CASES = [
  {
    name: "Day 1 Test Case 1 - PFZ Search",
    query: "Where is the nearest PFZ?",
    expectedIntent: "PFZ_SEARCH",
    expectedTasks: ["getNearbyPFZ"]
  },
  {
    name: "Day 1 Test Case 2 - Marine Safety",
    query: "Can I go fishing tomorrow morning?",
    expectedIntent: "MARINE_SAFETY",
    expectedTasks: ["getWeather", "getOceanConditions", "getWarnings", "calculateRisk"]
  },
  {
    name: "Day 1 Test Case 3 - Safe Route",
    query: "Find the safest route to the nearest fishing zone.",
    expectedIntent: "SAFE_ROUTE",
    expectedTasks: ["getNearbyPFZ", "getRiskMap", "checkGeofence", "findSafeRoute"]
  },
  {
    name: "Additional Test Case 4 - Marine Conditions",
    query: "What is the wave height and sea weather today?",
    expectedIntent: "MARINE_CONDITIONS",
    expectedTasks: ["getWeather", "getOceanConditions", "getWarnings"]
  },
  {
    name: "Additional Test Case 5 - Geofence Check",
    query: "Am I close to the international maritime border zone?",
    expectedIntent: "GEOFENCE_CHECK",
    expectedTasks: ["checkGeofence"]
  },
  {
    name: "Additional Test Case 6 - General Query",
    query: "Hello, what can this assistant do?",
    expectedIntent: "GENERAL_QUERY",
    expectedTasks: []
  }
];

async function runTests() {
  console.log("\n=======================================================");
  console.log("🧪 MEMBER 1 - DAY-1 AGENTIC AI TEST SUITE");
  console.log("=======================================================\n");

  let passed = 0;
  let failed = 0;

  for (let i = 0; i < TEST_CASES.length; i++) {
    const testCase = TEST_CASES[i];
    console.log(`\n--- [TEST ${i + 1}/${TEST_CASES.length}] ${testCase.name} ---`);
    console.log(`Query: "${testCase.query}"`);

    try {
      const result = await processQuery(testCase.query, { executeTools: false, verbose: false });

      const intentMatch = result.intent === testCase.expectedIntent;
      const tasksMatch = JSON.stringify(result.tasks) === JSON.stringify(testCase.expectedTasks);

      console.log("Actual Output:", JSON.stringify({ intent: result.intent, tasks: result.tasks }, null, 2));

      if (intentMatch && tasksMatch) {
        console.log(`Result: ✅ PASSED`);
        passed++;
      } else {
        console.log(`Result: ❌ FAILED`);
        if (!intentMatch) console.log(`  Expected Intent: ${testCase.expectedIntent}, got: ${result.intent}`);
        if (!tasksMatch) console.log(`  Expected Tasks: ${JSON.stringify(testCase.expectedTasks)}, got: ${JSON.stringify(result.tasks)}`);
        failed++;
      }
    } catch (err) {
      console.log(`Result: ❌ ERROR - ${err.message}`);
      failed++;
    }
  }

  console.log("\n=======================================================");
  console.log(`📊 TEST RESULTS SUMMARY: ${passed} PASSED, ${failed} FAILED out of ${TEST_CASES.length} tests.`);
  console.log("=======================================================\n");

  if (failed > 0) {
    process.exit(1);
  }
}

runTests();
