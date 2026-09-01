import { detectIntent } from './agents/intentAgent.js';
import { createPlan } from './agents/plannerAgent.js';
import { tools } from './tools.js';

/**
 * Main Orchestrator for Marine Advisory AI (Member 1 - Day 1)
 * Pipeline: User Query -> Intent Agent -> Planner Agent -> Tool Execution -> Result
 *
 * @param {string} userQuery - Raw input query from user
 * @param {object} options - Options flag (e.g. executeTools: boolean, verbose: boolean)
 */
export async function processQuery(userQuery, options = { executeTools: true, verbose: true }) {
  if (options.verbose) {
    console.log("\n=======================================================");
    console.log(`📥 [USER QUERY]: "${userQuery}"`);
    console.log("=======================================================");
  }

  // Step 1: Intent Detection
  if (options.verbose) console.log("🤖 [Step 1] Running Intent Detection Agent...");
  const intentResult = await detectIntent(userQuery);
  if (options.verbose) {
    console.log(`   ↳ Intent Classified: ${intentResult.intent} (Confidence: ${intentResult.confidence})`);
    console.log(`   ↳ Location Required: ${intentResult.locationRequired}, Time Required: ${intentResult.timeRequired}`);
  }

  // Step 2: Task Planning
  if (options.verbose) console.log("🧭 [Step 2] Running Planner Agent...");
  const planResult = await createPlan(intentResult, userQuery);
  if (options.verbose) {
    console.log(`   ↳ Generated Tasks: [${planResult.tasks.join(', ')}]`);
  }

  // Step 3: Tool Execution (Placeholders for Day 1)
  const toolResults = {};
  if (options.executeTools && planResult.tasks.length > 0) {
    if (options.verbose) console.log("🛠️ [Step 3] Executing Planned Tools...");
    for (const taskName of planResult.tasks) {
      if (typeof tools[taskName] === 'function') {
        toolResults[taskName] = await tools[taskName]({ query: userQuery, intent: intentResult.intent });
      } else {
        console.warn(`   ⚠️ Warning: Tool '${taskName}' registered in plan but not found in tools.js`);
      }
    }
  }

  // Structured response according to Day-1 requirement
  const response = {
    intent: planResult.intent,
    tasks: planResult.tasks,
    intentDetails: intentResult,
    toolResults: options.executeTools ? toolResults : undefined
  };

  if (options.verbose) {
    console.log("✅ [Step 4] Pipeline Completed. Structured Plan Output:");
    console.log(JSON.stringify({
      intent: response.intent,
      tasks: response.tasks
    }, null, 2));
  }

  return response;
}

// Support CLI direct invocation: `node orchestrator.js "Where is the nearest PFZ?"`
if (import.meta.url === `file:///${process.argv[1].replace(/\\/g, '/')}` || process.argv[1]?.endsWith('orchestrator.js')) {
  const queryArg = process.argv[2] || "Where is the nearest PFZ?";
  processQuery(queryArg);
}
