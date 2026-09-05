import dotenv from "dotenv";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { INTENT_SYSTEM_PROMPT } from "../prompts.js";

dotenv.config();

/**
 * Classifies user intent and outputs structured JSON metadata.
 * Supported intents:
 * - PFZ_SEARCH
 * - MARINE_SAFETY
 * - SAFE_ROUTE
 * - MARINE_CONDITIONS
 * - GEOFENCE_CHECK
 * - HAZARD_ALERT
 * - GENERAL_QUERY
 */
export async function detectIntent(userQuery, context = {}) {
  if (!userQuery || typeof userQuery !== "string" || userQuery.trim() === "") {
    return {
      intent: "GENERAL_QUERY",
      locationRequired: false,
      timeRequired: false,
      destinationRequired: false,
      language: "en",
      confidence: 1.0,
      reasoning: "Empty or invalid user query provided.",
    };
  }

  // Context-aware follow-up detection
  // Resolve references such as "there", "that zone", and "that place"
  // using the previously selected PFZ.
  if (context?.selectedPFZ) {
    const query = userQuery.toLowerCase();

    const refersToPreviousPFZ =
      query.includes("there") ||
      query.includes("that zone") ||
      query.includes("that place") ||
      query.includes("that pfz") ||
      query.includes("this zone") ||
      query.includes("this place");

    if (refersToPreviousPFZ) {
      // Marine conditions follow-up
      if (
        query.includes("condition") ||
        query.includes("weather") ||
        query.includes("wave") ||
        query.includes("wind") ||
        query.includes("current") ||
        query.includes("temperature") ||
        query.includes("sea") ||
        query.includes("tide")
      ) {
        return {
          intent: "MARINE_CONDITIONS",
          locationRequired: true,
          timeRequired: true,
          destinationRequired: false,
          language: detectLanguage(userQuery),
          confidence: 0.99,
          reasoning: `Follow-up marine conditions query referring to previously selected PFZ: ${context.selectedPFZ.name || "selected PFZ"}.`,
        };
      }

      // Safety follow-up
      if (
        query.includes("safe") ||
        query.includes("risk") ||
        query.includes("danger") ||
        query.includes("can i go") ||
        query.includes("should i go") ||
        query.includes("go fishing")
      ) {
        return {
          intent: "MARINE_SAFETY",
          locationRequired: true,
          timeRequired: true,
          destinationRequired: false,
          language: detectLanguage(userQuery),
          confidence: 0.99,
          reasoning: `Follow-up safety query referring to previously selected PFZ: ${context.selectedPFZ.name || "selected PFZ"}.`,
        };
      }

      // Route follow-up
      if (
        query.includes("route") ||
        query.includes("path") ||
        query.includes("way to") ||
        query.includes("navigation")
      ) {
        return {
          intent: "SAFE_ROUTE",
          locationRequired: true,
          timeRequired: false,
          destinationRequired: true,
          language: detectLanguage(userQuery),
          confidence: 0.99,
          reasoning: `Follow-up route query referring to previously selected PFZ: ${context.selectedPFZ.name || "selected PFZ"}.`,
        };
      }
    }
  }

  const apiKey = process.env.GEMINI_API_KEY;

  if (apiKey && apiKey.trim() !== "" && apiKey !== "your_gemini_api_key_here") {
    try {
      const genAI = new GoogleGenerativeAI(apiKey);
      const model = genAI.getGenerativeModel({
        model: process.env.MODEL_NAME || "gemini-2.5-flash",
        generationConfig: { responseMimeType: "application/json" },
      });

      const contextInfo = context?.selectedPFZ
        ? `
Previous conversation context:
- Selected PFZ: ${context.selectedPFZ.name || "Unknown"}
- PFZ latitude: ${context.selectedPFZ.latitude ?? "unavailable"}
- PFZ longitude: ${context.selectedPFZ.longitude ?? "unavailable"}
- Distance: ${context.selectedPFZ.distanceKm ?? "unavailable"} km

The user may use references such as "there", "that zone", "there today", or "that place" to refer to this selected PFZ.
`
        : `
No previously selected PFZ is available in the conversation context.
`;

      const response = await model.generateContent(
        `${INTENT_SYSTEM_PROMPT}

${contextInfo}

Important contextual intent rules:
- If the user asks about "conditions", "weather", "sea", "waves", "wind", "tide", or similar conditions while referring to "there", "that zone", "that place", or the previously selected PFZ, classify as MARINE_CONDITIONS.
- If the user asks whether it is safe to go there, classify as MARINE_SAFETY.
- If the user asks for a route to there/that zone, classify as SAFE_ROUTE.
- Use the previous context to resolve references instead of classifying them as GENERAL_QUERY.

User Query: "${userQuery}"`,
      );
      const text = response.response.text();
      const parsed = JSON.parse(text);

      if (parsed && parsed.intent) {
        return {
          intent: parsed.intent,
          locationRequired: Boolean(parsed.locationRequired),
          timeRequired: Boolean(parsed.timeRequired),
          destinationRequired: Boolean(parsed.destinationRequired),
          language: parsed.language || detectLanguage(userQuery),
          confidence: parsed.confidence || 0.95,
          reasoning: parsed.reasoning || "Classified via Gemini LLM",
        };
      }
    } catch (err) {
      console.warn(
        "  [IntentAgent] LLM API call failed or key invalid. Switching to deterministic fallback. Error:",
        err.message,
      );
    }
  }

  // Deterministic Fallback Classifier
  return fallbackDetectIntent(userQuery);
}

/**
 * Helper to detect basic language scripts
 */
function detectLanguage(text) {
  // Telugu Unicode block range \u0C00-\u0C7F
  if (/[\u0C00-\u0C7F]/.test(text)) return "te";
  // Hindi (Devanagari) Unicode block range \u0900-\u097F
  if (/[\u0900-\u097F]/.test(text)) return "hi";
  // Tamil Unicode block range \u0B80-\u0BFF
  if (/[\u0B80-\u0BFF]/.test(text)) return "ta";
  return "en";
}

/**
 * Fallback rule-based classifier ensuring test suite passes deterministically
 */
function fallbackDetectIntent(userQuery) {
  const query = userQuery.toLowerCase();
  const lang = detectLanguage(userQuery);

  // 1. HAZARD_ALERT check
  if (
    query.includes("alert") ||
    query.includes("warning") ||
    query.includes("cyclone") ||
    query.includes("tsunami") ||
    query.includes("storm") ||
    query.includes("emergency") ||
    query.includes("ప్రమాదం") ||
    query.includes("హెచ్చరిక")
  ) {
    return {
      intent: "HAZARD_ALERT",
      locationRequired: true,
      timeRequired: true,
      destinationRequired: false,
      language: lang,
      confidence: 0.97,
      reasoning:
        "Query asks about active weather warnings, cyclone alerts, or emergency hazards.",
    };
  }

  // 2. SAFE_ROUTE check
  if (
    query.includes("route") ||
    query.includes("path") ||
    query.includes("navigation") ||
    query.includes("way to") ||
    query.includes("దోవ") ||
    query.includes("రహదారి")
  ) {
    return {
      intent: "SAFE_ROUTE",
      locationRequired: true,
      timeRequired: false,
      destinationRequired: true,
      language: lang,
      confidence: 0.98,
      reasoning:
        "Query explicitly requests route, path, or safe navigation instructions.",
    };
  }

  // 3. MARINE_SAFETY check
  if (
    query.includes("safe") ||
    query.includes("can i go") ||
    query.includes("should i go") ||
    query.includes("fishing tomorrow") ||
    query.includes("risk") ||
    query.includes("danger") ||
    query.includes("safety") ||
    query.includes("go fishing") ||
    query.includes("వేటకు వెళ్ళవచ్చా") ||
    query.includes("సురక్షితమేనా")
  ) {
    const timeReq =
      query.includes("tomorrow") ||
      query.includes("morning") ||
      query.includes("today") ||
      query.includes("tonight") ||
      query.includes("రేపు");
    return {
      intent: "MARINE_SAFETY",
      locationRequired: true,
      timeRequired: timeReq,
      destinationRequired: false,
      language: lang,
      confidence: 0.96,
      reasoning:
        "Query asks about safety, trip feasibility, or fishing permission.",
    };
  }

  // 4. PFZ_SEARCH check
  if (
    query.includes("pfz") ||
    query.includes("potential fishing zone") ||
    query.includes("fishing zone") ||
    query.includes("nearest pfz") ||
    query.includes("where is the nearest") ||
    query.includes("catch fish") ||
    query.includes("fish concentration") ||
    query.includes("చేపల మండలం")
  ) {
    return {
      intent: "PFZ_SEARCH",
      locationRequired: true,
      timeRequired: false,
      destinationRequired: false,
      language: lang,
      confidence: 0.99,
      reasoning:
        "Query asks for Potential Fishing Zone location or nearest fishing spot.",
    };
  }

  // 5. MARINE_CONDITIONS check
  if (
    query.includes("weather") ||
    query.includes("wave") ||
    query.includes("wind") ||
    query.includes("current") ||
    query.includes("temperature") ||
    query.includes("sea condition") ||
    query.includes("tide") ||
    query.includes("వాతావరణం") ||
    query.includes("అలలు") ||
    query.includes("సముద్ర పరిస్థితులు") ||
    query.includes("సముద్రం") ||
    query.includes("సముద్ర")
  ) {
    return {
      intent: "MARINE_CONDITIONS",
      locationRequired: true,
      timeRequired: true,
      destinationRequired: false,
      language: lang,
      confidence: 0.95,
      reasoning: "Query asks for oceanographic or weather metrics.",
    };
  }

  // 6. GEOFENCE_CHECK check
  if (
    query.includes("border") ||
    query.includes("geofence") ||
    query.includes("restricted") ||
    query.includes("imbl") ||
    query.includes("international line") ||
    query.includes("legal zone") ||
    query.includes("హద్దు")
  ) {
    return {
      intent: "GEOFENCE_CHECK",
      locationRequired: true,
      timeRequired: false,
      destinationRequired: false,
      language: lang,
      confidence: 0.96,
      reasoning:
        "Query asks about boundary limits or restricted maritime zones.",
    };
  }

  // 7. GENERAL_QUERY default
  return {
    intent: "GENERAL_QUERY",
    locationRequired: false,
    timeRequired: false,
    destinationRequired: false,
    language: lang,
    confidence: 0.85,
    reasoning:
      "Query classified as general conversation or non-maritime inquiry.",
  };
}
