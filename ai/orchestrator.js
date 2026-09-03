import { detectIntent } from "./agents/intentAgent.js";
import { createPlan } from "./agents/plannerAgent.js";
import { synthesizeResponse } from "./agents/synthesisAgent.js";
import { ContextManager } from "./contextManager.js";
import { tools } from "./tools.js";

/**
 * Main Orchestrator for Marine Advisory AI (Member 1 - Days 2, 3, 4 Core)
 * Pipeline: User Query -> Intent Agent -> Planner Agent -> Tool Execution -> Context Update -> Synthesis Agent -> Evidence Answer
 *
 * @param {string} userQuery - Raw input query from user
 * @param {object} options - Options flag (e.g. executeTools: boolean, verbose: boolean)
 * @param {object} initialContext - Previous conversation context object
 */
export async function processQuery(
  userQuery,
  options = { executeTools: true, verbose: true },
  initialContext = {},
) {
  const contextMgr = new ContextManager(initialContext);

  if (options.verbose) {
    console.log("\n=======================================================");
    console.log(`📥 [USER QUERY]: "${userQuery}"`);
    console.log("=======================================================");
  }

  // Step 1: Intent Detection Agent
  if (options.verbose)
    console.log("🤖 [Step 1] Running Intent Detection Agent...");
  const intentResult = await detectIntent(userQuery);
  if (options.verbose) {
    console.log(
      `   ↳ Intent Classified: ${intentResult.intent} (Confidence: ${intentResult.confidence})`,
    );
    console.log(
      `   ↳ Language: ${intentResult.language}, Location Req: ${intentResult.locationRequired}, Dest Req: ${intentResult.destinationRequired}`,
    );
  }

  // Step 2: Task Planner Agent
  if (options.verbose) console.log("🧭 [Step 2] Running Planner Agent...");
  const planResult = await createPlan(intentResult, userQuery);
  if (options.verbose) {
    console.log(
      `   ↳ Generated Task Sequence: [${planResult.tasks.join(", ")}]`,
    );
  }

  // Step 3: Tool Execution Wrapper
  const toolResults = {};

  if (options.executeTools && planResult.tasks.length > 0) {
    for (const taskName of planResult.tasks) {
      if (typeof tools[taskName] === "function") {
        toolResults[taskName] = await tools[taskName]({
          query: userQuery,
          intent: intentResult.intent,
          context: contextMgr.getContext(),
        });

        // Update context immediately after each tool.
        // This allows later tools to use results from earlier tools.
        contextMgr.updateFromQueryAndIntent(intentResult, {
          [taskName]: toolResults[taskName],
        });
      }
    }
  }

  const updatedContext = contextMgr.getContext();

  // Step 5: Response & Advisory Synthesis Agent
  if (options.verbose)
    console.log("🗣️ [Step 4] Synthesizing Evidence-Based Answer...");
  const synthesis = await synthesizeResponse(
    intentResult,
    planResult,
    toolResults,
    userQuery,
    updatedContext,
  );

  const finalResponse = {
    query: userQuery,
    intent: planResult.intent,
    language: intentResult.language || "en",
    tasks: planResult.tasks,
    answer: synthesis.answer,
    recommendation: synthesis.recommendation,
    evidence: synthesis.evidence,
    intentDetails: intentResult,
    toolResults: options.executeTools ? toolResults : undefined,
    context: updatedContext,
  };

  if (options.verbose) {
    console.log("✅ [Pipeline Completed] Final Synthesis Response:");
    console.log(
      JSON.stringify(
        {
          intent: finalResponse.intent,
          recommendation: finalResponse.recommendation,
          answer: finalResponse.answer,
          evidence: finalResponse.evidence,
        },
        null,
        2,
      ),
    );
  }

  return finalResponse;
}

// Support CLI direct invocation: `node orchestrator.js "Can I go fishing tomorrow morning?"`
if (
  import.meta.url === `file:///${process.argv[1]?.replace(/\\/g, "/")}` ||
  process.argv[1]?.endsWith("orchestrator.js")
) {
  const queryArg = process.argv[2] || "Can I go fishing tomorrow morning?";
  processQuery(queryArg);
}
