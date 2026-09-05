import { processQuery } from "./orchestrator.js";

const TEST_CASES = [
  {
    name: "Test Case 1 - PFZ Search",
    query: "Where is the nearest PFZ?",
    expectedIntent: "PFZ_SEARCH",
    expectedTasks: ["getNearbyPFZ"],
    expectedLang: "en",
  },
  {
    name: "Test Case 2 - Marine Safety",
    query: "Can I go fishing tomorrow morning?",
    expectedIntent: "MARINE_SAFETY",
    expectedTasks: ["analyzeMarine"],
    expectedLang: "en",
  },
  {
    name: "Test Case 3 - Safe Route",
    query: "Find the safest route to the nearest fishing zone.",
    expectedIntent: "SAFE_ROUTE",
    expectedTasks: [
      "getNearbyPFZ",
      "getRiskMap",
      "checkGeofence",
      "findSafeRoute",
    ],
    expectedLang: "en",
  },
  {
    name: "Test Case 4 - Marine Conditions",
    query: "What is the wave height and sea weather today?",
    expectedIntent: "MARINE_CONDITIONS",
    expectedTasks: ["getWeather", "getOceanConditions", "getWarnings"],
    expectedLang: "en",
  },
  {
    name: "Test Case 5 - Geofence Check",
    query: "Am I close to the international maritime border zone?",
    expectedIntent: "GEOFENCE_CHECK",
    expectedTasks: ["checkGeofence"],
    expectedLang: "en",
  },
  {
    name: "Test Case 6 - Hazard Alert",
    query: "Are there any cyclone or high wave warnings active?",
    expectedIntent: "HAZARD_ALERT",
    expectedTasks: ["getWarnings", "calculateRisk"],
    expectedLang: "en",
  },
  {
    name: "Test Case 7 - Regional Language Query (Telugu Safety Check)",
    query: "రేపు సముద్రంలోకి వేటకు వెళ్ళవచ్చా?",
    expectedIntent: "MARINE_SAFETY",
    expectedTasks: ["analyzeMarine"],
    expectedLang: "te",
  },
  {
    name: "Test Case 8 - General Query",
    query: "Hello, what can this assistant do?",
    expectedIntent: "GENERAL_QUERY",
    expectedTasks: [],
    expectedLang: "en",
  },
];

async function runSafetyOverrideTest() {
  console.log("\n=======================================================");
  console.log("🚨 DANGEROUS LOCATION SAFETY OVERRIDE TEST");
  console.log("=======================================================\n");

  const latitude = 17.0;
  const longitude = 83.5;

  console.log(`Testing location: ${latitude}, ${longitude}`);

  try {
    const result = await processQuery(
      "Can I safely go fishing from this location?",
      {
        executeTools: true,
        verbose: false,
      },
      {
        lastLocation: {
          name: "Dangerous Test Location",
          lat: latitude,
          lon: longitude,
        },
      },
    );

    console.log(`  Intent: ${result.intent}`);
    console.log(`  Tasks: ${JSON.stringify(result.tasks)}`);
    console.log(`  Recommendation: ${result.recommendation}`);
    console.log(`  Answer: ${result.answer}`);

    if (result.recommendation === "DO_NOT_SAIL") {
      console.log("\nResult: ✅ SAFETY OVERRIDE PASSED");
    } else {
      console.log("\nResult: ❌ SAFETY OVERRIDE FAILED");
      console.log("Expected: DO_NOT_SAIL");
    }
  } catch (err) {
    console.log(`\nResult: ❌ ERROR - ${err.message}`);
    console.error(err);
  }
}

async function runTests() {
  console.log("\n=======================================================");
  console.log("🧪 MEMBER 1 — AGENTIC AI END-TO-END TEST SUITE");
  console.log("=======================================================\n");

  let passed = 0;
  let failed = 0;

  for (let i = 0; i < TEST_CASES.length; i++) {
    const testCase = TEST_CASES[i];
    console.log(
      `\n--- [TEST ${i + 1}/${TEST_CASES.length}] ${testCase.name} ---`,
    );
    console.log(`Query: "${testCase.query}"`);

    try {
      const result = await processQuery(testCase.query, {
        executeTools: true,
        verbose: false,
      });

      const intentMatch = result.intent === testCase.expectedIntent;
      const tasksMatch =
        JSON.stringify(result.tasks) === JSON.stringify(testCase.expectedTasks);
      const langMatch = result.language === testCase.expectedLang;
      const hasAnswer = Boolean(result.answer && result.answer.length > 5);
      const hasRecommendation = Boolean(result.recommendation);
      const hasEvidence = Boolean(
        result.evidence &&
        result.evidence.source &&
        Array.isArray(result.evidence.parametersUsed),
      );

      console.log(`  Actual Intent: ${result.intent}`);
      console.log(`  Actual Tasks: ${JSON.stringify(result.tasks)}`);
      console.log(`  Language: ${result.language}`);
      console.log(`  Recommendation: ${result.recommendation}`);
      console.log(`  Evidence Source: ${result.evidence?.source}`);
      console.log(`  Answer Preview: "${result.answer.substring(0, 75)}..."`);

      if (
        intentMatch &&
        tasksMatch &&
        langMatch &&
        hasAnswer &&
        hasRecommendation &&
        hasEvidence
      ) {
        console.log(`Result: ✅ PASSED`);
        passed++;
      } else {
        console.log(`Result: ❌ FAILED`);
        if (!intentMatch)
          console.log(
            `  Expected Intent: ${testCase.expectedIntent}, got: ${result.intent}`,
          );
        if (!tasksMatch)
          console.log(
            `  Expected Tasks: ${JSON.stringify(testCase.expectedTasks)}, got: ${JSON.stringify(result.tasks)}`,
          );
        if (!langMatch)
          console.log(
            `  Expected Language: ${testCase.expectedLang}, got: ${result.language}`,
          );
        if (!hasAnswer) console.log(`  Answer missing or too short`);
        if (!hasEvidence) console.log(`  Evidence structure incomplete`);
        failed++;
      }
    } catch (err) {
      console.log(`Result: ❌ ERROR - ${err.message}`);
      console.error(err);
      failed++;
    }
  }

  console.log("\n=======================================================");
  console.log(
    `📊 TEST RESULTS SUMMARY: ${passed} PASSED, ${failed} FAILED out of ${TEST_CASES.length} tests.`,
  );
  console.log("=======================================================\n");

  if (failed > 0) {
    process.exit(1);
  }
}

runTests().then(runSafetyOverrideTest);
