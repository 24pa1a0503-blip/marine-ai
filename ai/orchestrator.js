import { detectIntent } from "./agents/intentAgent.js";
import { createPlan } from "./agents/plannerAgent.js";
import { synthesizeResponse } from "./agents/synthesisAgent.js";
import { ContextManager } from "./contextManager.js";
import { tools } from "./tools.js";

/**
 * Main Orchestrator for Marine Advisory AI
 *
 * Pipeline:
 * User Query
 *      ↓
 * Intent Agent
 *      ↓
 * Planner Agent
 *      ↓
 * Tool Execution
 *      ↓
 * Context Update
 *      ↓
 * Synthesis Agent
 *      ↓
 * Evidence-Based Answer
 *
 * @param {string} userQuery - Raw input query from user
 * @param {object} options - Options flag
 * @param {object} initialContext - Previous conversation context
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

  // =====================================================
  // Step 1: Intent Detection Agent
  // =====================================================

  if (options.verbose) {
    console.log("🤖 [Step 1] Running Intent Detection Agent...");
  }

  const intentResult = await detectIntent(userQuery, contextMgr.getContext());

  if (options.verbose) {
    console.log(
      `   ↳ Intent Classified: ${intentResult.intent} (Confidence: ${intentResult.confidence})`,
    );

    console.log(
      `   ↳ Language: ${intentResult.language}, Location Req: ${intentResult.locationRequired}, Dest Req: ${intentResult.destinationRequired}`,
    );
  }

  // =====================================================
  // Step 2: Task Planner Agent
  // =====================================================

  if (options.verbose) {
    console.log("🧭 [Step 2] Running Planner Agent...");
  }

  const planResult = await createPlan(intentResult, userQuery);

  if (options.verbose) {
    console.log(
      `   ↳ Generated Task Sequence: [${planResult.tasks.join(", ")}]`,
    );
  }

  // =====================================================
  // Step 3: Tool Execution Wrapper
  // =====================================================

  const toolResults = {};

  if (options.executeTools && planResult.tasks.length > 0) {
    for (const taskName of planResult.tasks) {
      if (typeof tools[taskName] !== "function") {
        console.warn(`⚠️ [Tool Warning] Tool "${taskName}" is not available.`);
        continue;
      }

      // Default parameters for every tool
      let toolParams = {
        query: userQuery,
        intent: intentResult.intent,
        context: contextMgr.getContext(),
      };

      // =================================================
      // Special handling for calculateRisk
      //
      // Uses forecast values for tomorrow queries and
      // live values for current queries.
      // =================================================

      if (taskName === "calculateRisk") {
        const weatherResult =
          toolResults.getWeatherForecast || toolResults.getWeather || {};

        const oceanResult =
          toolResults.getMarineForecast || toolResults.getOceanConditions || {};

        const warningResult = toolResults.getWarnings || {};

        // Support both possible backend/tool response shapes
        const weather =
          weatherResult.data?.windSpeed !== undefined
            ? weatherResult.data
            : weatherResult.data?.data || weatherResult;

        const ocean =
          oceanResult.data?.waveHeight !== undefined
            ? oceanResult.data
            : oceanResult.data?.data || oceanResult;

        const warning =
          warningResult.data?.data || warningResult.data || warningResult;

        toolParams = {
          ...toolParams,
          windSpeed: Number(weather.windSpeed ?? 0),
          windGust: Number(weather.windGust ?? 0),
          rainProbability: Number(weather.precipitationProbability ?? 0),
          waveHeight: Number(ocean.waveHeight ?? 0),
          lightning: Number(warning.lightning ?? 0),
          cyclone: Boolean(warning.cyclone ?? false),
        };
        console.log("========== RISK INPUT DEBUG ==========");

        console.log("Weather object:", JSON.stringify(weather, null, 2));

        console.log("Ocean object:", JSON.stringify(ocean, null, 2));

        console.log("Wind gust:", weather.windGust);

        console.log(
          "Risk parameters:",
          JSON.stringify(
            {
              windSpeed: toolParams.windSpeed,
              waveHeight: toolParams.waveHeight,
              rainProbability: toolParams.rainProbability,
              lightning: toolParams.lightning,
              cyclone: toolParams.cyclone,
            },
            null,
            2,
          ),
        );

        console.log("=======================================");
      }

      // =================================================
      // Execute tool
      // =================================================

      if (options.verbose) {
        console.log(`   🔧 [Executing Tool] ${taskName}`);
      }

      try {
        toolResults[taskName] = await tools[taskName](toolParams);
      } catch (error) {
        console.error(`❌ [Tool Error] ${taskName}:`, error.message);

        toolResults[taskName] = {
          success: false,
          error: error.message,
        };
      }

      // =================================================
      // Update context immediately after each tool
      // =================================================

      contextMgr.updateFromQueryAndIntent(intentResult, {
        [taskName]: toolResults[taskName],
      });
    }
  }

  // =====================================================
  // Step 4: Updated Context
  // =====================================================

  const updatedContext = contextMgr.getContext();

  // =====================================================
  // Step 5: Response & Advisory Synthesis Agent
  // =====================================================

  if (options.verbose) {
    console.log("🗣️ [Step 5] Synthesizing Evidence-Based Answer...");
  }

  const synthesis = await synthesizeResponse(
    intentResult,
    planResult,
    toolResults,
    userQuery,
    updatedContext,
  );

  // =====================================================
  // Step 6: Final Response
  // =====================================================

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

  // =====================================================
  // Debug Output
  // =====================================================

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

// =======================================================
// CLI Direct Invocation
//
// Example:
// node orchestrator.js "Can I go fishing tomorrow morning?"
// =======================================================

if (
  import.meta.url === `file:///${process.argv[1]?.replace(/\\/g, "/")}` ||
  process.argv[1]?.endsWith("orchestrator.js")
) {
  const queryArg = process.argv[2] || "Can I go fishing tomorrow morning?";

  processQuery(queryArg);
}
