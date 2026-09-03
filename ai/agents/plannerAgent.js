import dotenv from "dotenv";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { PLANNER_SYSTEM_PROMPT } from "../prompts.js";
import { AVAILABLE_TOOLS } from "../tools.js";

dotenv.config();

/**
 * Converts Intent into a sequence of tool tasks.
 * Returns structured JSON: { intent: string, tasks: string[], reasoning?: string }
 */
export async function createPlan(intentResult, userQuery = "") {
  const intent =
    typeof intentResult === "string" ? intentResult : intentResult.intent;
  const apiKey = process.env.GEMINI_API_KEY;

  if (apiKey && apiKey.trim() !== "" && apiKey !== "your_gemini_api_key_here") {
    try {
      const genAI = new GoogleGenerativeAI(apiKey);
      const model = genAI.getGenerativeModel({
        model: process.env.MODEL_NAME || "gemini-2.5-flash",
        generationConfig: { responseMimeType: "application/json" },
      });

      const promptPayload = `${PLANNER_SYSTEM_PROMPT}\n\nIntent: "${intent}"\nUser Query: "${userQuery}"\nAvailable Tools: ${JSON.stringify(AVAILABLE_TOOLS)}`;

      const response = await model.generateContent(promptPayload);
      const text = response.response.text();
      const parsed = JSON.parse(text);
      if (parsed && Array.isArray(parsed.tasks)) {
        // Validate all returned tasks are valid tools
        const validTasks = parsed.tasks.filter((t) =>
          AVAILABLE_TOOLS.includes(t),
        );
        return {
          intent: intent,
          tasks: validTasks,
          reasoning: parsed.reasoning || "Generated task plan via Gemini LLM",
        };
      }
    } catch (err) {
      console.warn(
        "  [PlannerAgent] LLM API call failed or key invalid. Switching to deterministic planner. Error:",
        err.message,
      );
    }
  }

  // Deterministic Planner Mapping
  return fallbackCreatePlan(intent, userQuery);
}

/**
 * Deterministic mapping rule table for intent -> tool task sequence
 */
function fallbackCreatePlan(intent, userQuery) {
  const planMap = {
    PFZ_SEARCH: ["getNearbyPFZ"],
    MARINE_SAFETY: ["analyzeMarine"],
    SAFE_ROUTE: [
      "getNearbyPFZ",
      "getRiskMap",
      "checkGeofence",
      "findSafeRoute",
    ],
    MARINE_CONDITIONS: ["getWeather", "getOceanConditions", "getWarnings"],
    GEOFENCE_CHECK: ["checkGeofence"],
    HAZARD_ALERT: ["getWarnings", "calculateRisk"],
    GENERAL_QUERY: [],
  };

  const tasks = planMap[intent] || [];

  return {
    intent: intent,
    tasks: tasks,
    reasoning: `Mapped intent '${intent}' to standard execution sequence: [${tasks.join(", ")}]`,
  };
}
