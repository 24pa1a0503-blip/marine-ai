/**
 * Marine AI — Phase 7 Multi-Turn Context & Telugu Language Test Suite
 */
import { processQuery } from "./orchestrator.js";

console.log("=======================================================");
console.log("🧪 PHASE 7 MULTI-TURN & TELUGU LANGUAGE TEST SUITE");
console.log("=======================================================");

async function runMultiTurnTest() {
    let context = {};

    // TURN 1: User asks for fishing zones near Visakhapatnam
    console.log("\n--- TURN 1 ---");
    const turn1 = await processQuery("Show me fishing zones near Visakhapatnam", { executeTools: true, verbose: false }, context);
    context = turn1.context;
    console.log(`Intent        : ${turn1.intent}`);
    console.log(`Answer        : ${turn1.answer.slice(0, 120)}...`);
    console.log(`Selected PFZ  : ${context.selectedPFZ ? context.selectedPFZ.id || context.selectedPFZ.name : 'None'}`);

    // TURN 2: User asks "Which one is closest?" (Ordinal/Closest resolution)
    console.log("\n--- TURN 2 ---");
    const turn2 = await processQuery("Which one is closest?", { executeTools: true, verbose: false }, context);
    context = turn2.context;
    console.log(`Intent        : ${turn2.intent}`);
    console.log(`Answer        : ${turn2.answer.slice(0, 120)}...`);
    console.log(`Resolved PFZ  : ${turn2.intentDetails.resolvedPFZ ? turn2.intentDetails.resolvedPFZ.id : 'None'}`);

    // TURN 3: User asks "Is it safe tomorrow?" (Pronoun + Date shift resolution)
    console.log("\n--- TURN 3 ---");
    const turn3 = await processQuery("Is it safe tomorrow?", { executeTools: true, verbose: false }, context);
    context = turn3.context;
    console.log(`Intent        : ${turn3.intent}`);
    console.log(`Target Date   : ${context.targetDate}`);
    console.log(`Recommendation: ${turn3.recommendation}`);
    console.log(`Answer        : ${turn3.answer.slice(0, 120)}...`);

    // TURN 4: User asks "What is the safest route there?" (Pronoun + Route resolution)
    console.log("\n--- TURN 4 ---");
    const turn4 = await processQuery("What is the safest route there?", { executeTools: true, verbose: false }, context);
    context = turn4.context;
    console.log(`Intent        : ${turn4.intent}`);
    console.log(`Recommendation: ${turn4.recommendation}`);
    console.log(`Answer        : ${turn4.answer.slice(0, 120)}...`);

    // TURN 5: Telugu query "రేపు సముద్రంలోకి వేటకు వెళ్లవచ్చా?"
    console.log("\n--- TURN 5 (Telugu Query) ---");
    const turn5 = await processQuery("రేపు సముద్రంలోకి వేటకు వెళ్లవచ్చా?", { executeTools: true, verbose: false }, context);
    console.log(`Language      : ${turn5.language} (Expected: te)`);
    console.log(`Intent        : ${turn5.intent}`);
    console.log(`Answer        : ${turn5.answer}`);

    console.log("\n=======================================================");
    const passed = turn1.intent === "PFZ_SEARCH" &&
                   turn2.intentDetails.resolvedPFZ &&
                   turn3.intent === "MARINE_SAFETY" &&
                   turn4.intent === "SAFE_ROUTE" &&
                   turn5.language === "te";

    if (passed) {
        console.log("🏆 ALL PHASE 7 MULTI-TURN & TELUGU TESTS PASSED 100%!");
    } else {
        console.log("⚠️ SOME MULTI-TURN TESTS FAILED.");
    }
    console.log("=======================================================");
}

runMultiTurnTest().catch(console.error);
