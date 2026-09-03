import dotenv from "dotenv";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { SYNTHESIS_SYSTEM_PROMPT } from "../prompts.js";

dotenv.config();

/**
 * Marine Safety Override
 *
 * Official warning information must override an AI-generated
 * optimistic recommendation.
 */
function applySafetyOverride(recommendation, toolResults = {}) {
  // Unified marine analysis result
  const marine = toolResults.analyzeMarine?.data;

  // Individual tool results — kept for backward compatibility
  const warnings = toolResults.getWarnings?.data;
  const risk = toolResults.calculateRisk?.data?.risk;
  const geofence = toolResults.checkGeofence?.data;

  // ==================================================
  // HIGHEST PRIORITY: UNIFIED MARINE SAFETY DECISION
  // ==================================================

  if (marine?.safety?.status === "DO_NOT_SAIL") {
    return "DO_NOT_SAIL";
  }

  if (marine?.safety?.riskLevel === "EXTREME") {
    return "DO_NOT_SAIL";
  }

  if (marine?.safety?.riskLevel === "HIGH") {
    return "PROCEED_WITH_CAUTION";
  }

  // Restricted geofence must never allow safe sailing
  if (marine?.geofence?.insideRestrictedZone === true) {
    return "DO_NOT_SAIL";
  }

  // Unified warning
  if (marine?.warning?.level === "HIGH") {
    return "DO_NOT_SAIL";
  }

  // ==================================================
  // INDIVIDUAL TOOL FALLBACK
  // ==================================================

  if (warnings?.level === "HIGH") {
    return "DO_NOT_SAIL";
  }

  if (warnings?.warning === true && warnings?.level === "HIGH") {
    return "DO_NOT_SAIL";
  }

  if (risk?.level === "EXTREME") {
    return "DO_NOT_SAIL";
  }

  if (risk?.level === "HIGH") {
    return "PROCEED_WITH_CAUTION";
  }

  if (geofence?.insideRestrictedZone === true) {
    return "DO_NOT_SAIL";
  }

  return recommendation;
}

/**
 * Response & Advisory Synthesis Agent
 */
export async function synthesizeResponse(
  intentResult,
  planResult,
  toolResults,
  userQuery = "",
  context = {},
) {
  const apiKey = process.env.GEMINI_API_KEY;
  const lang = intentResult.language || "en";

  if (apiKey && apiKey.trim() !== "" && apiKey !== "your_gemini_api_key_here") {
    try {
      const genAI = new GoogleGenerativeAI(apiKey);

      const model = genAI.getGenerativeModel({
        model: process.env.MODEL_NAME || "gemini-2.5-flash",
        generationConfig: {
          responseMimeType: "application/json",
        },
      });

      const payload = `${SYNTHESIS_SYSTEM_PROMPT}

IMPORTANT SAFETY RULE:
Official IMD warnings have priority over general environmental conditions.
Never state that it is safe to sail if the IMD warning level is HIGH.
Never invent cyclone status, geofence status, distances, route names, or measurements.

User Query: "${userQuery}"
Detected Intent: "${intentResult.intent}"
Detected Language: "${lang}"
Conversation Context: ${JSON.stringify(context)}
Tool Execution Results: ${JSON.stringify(toolResults)}`;

      const response = await model.generateContent(payload);

      const text = response.response.text();
      const parsed = JSON.parse(text);

      if (parsed && parsed.answer && parsed.recommendation && parsed.evidence) {
        // Apply deterministic safety override AFTER LLM generation.
        parsed.recommendation = applySafetyOverride(
          parsed.recommendation,
          toolResults,
        );

        parsed.answer = enforceSafetyAnswer(
          parsed.answer,
          parsed.recommendation,
          toolResults,
          lang,
        );

        return parsed;
      }
    } catch (err) {
      console.warn(
        "  [SynthesisAgent] LLM API call failed. Using deterministic synthesizer fallback. Error:",
        err.message,
      );
    }
  }

  return fallbackSynthesizeResponse(
    intentResult,
    planResult,
    toolResults,
    userQuery,
    context,
  );
}

/**
 * Prevent contradictory natural-language answers after
 * the safety override has been applied.
 */
function enforceSafetyAnswer(answer, recommendation, toolResults, lang) {
  const warnings = toolResults.getWarnings?.data;

  if (recommendation === "DO_NOT_SAIL" && warnings?.level === "HIGH") {
    if (lang === "te") {
      return `IMD నుండి HIGH స్థాయి సముద్ర హెచ్చరిక ఉంది. ప్రస్తుతం సముద్రంలోకి వేటకు వెళ్లడం సురక్షితం కాదు. హెచ్చరికలు: ${warnings.factors?.join(", ") || "అధిక ప్రమాద పరిస్థితులు"}.`;
    }

    return `IMD has issued a HIGH marine warning for the reported area. Do not venture into the sea at this time. Active warnings include: ${
      warnings.factors?.join(", ") || "high-risk marine conditions"
    }.`;
  }

  return answer;
}

/**
 * Deterministic fallback synthesizer.
 */
function fallbackSynthesizeResponse(
  intentResult,
  planResult,
  toolResults,
  userQuery,
  context,
) {
  const intent = intentResult.intent;
  const lang = intentResult.language || "en";
  const timestamp = new Date().toISOString();

  const sources = new Set();
  const parametersUsed = [];
  const riskFactors = [];

  Object.entries(toolResults || {}).forEach(([toolName, res]) => {
    if (res?.source) {
      sources.add(res.source);
    }

    if (res?.data?.source) {
      sources.add(res.data.source);
    }
  });

  const sourceStr =
    sources.size > 0
      ? Array.from(sources).join(" | ")
      : "[DEMO_MOCK] Marine Advisory Engine";

  let recommendation = "INFORMATIONAL";
  let answerText = "";

  // ==================================================
  // PFZ SEARCH
  // ==================================================

  if (intent === "PFZ_SEARCH") {
    const pfzData = toolResults.getNearbyPFZ?.data;
    const pfzs = pfzData?.pfzs || [];

    const bestPFZ = pfzs.length
      ? [...pfzs].sort((a, b) => (b.pfz_score || 0) - (a.pfz_score || 0))[0]
      : null;

    parametersUsed.push(
      "PFZ Score",
      "Sea Surface Temperature",
      "Chlorophyll",
      "Confidence",
    );

    recommendation = "INFORMATIONAL";

    if (bestPFZ) {
      if (lang === "te") {
        answerText = `ఉత్తమంగా గుర్తించిన చేపల వేట ప్రాంతం ${bestPFZ.name}. PFZ స్కోర్ ${bestPFZ.pfz_score}, సముద్ర ఉపరితల ఉష్ణోగ్రత ${bestPFZ.sst}°C, క్లోరోఫిల్ ${bestPFZ.chlorophyll} mg/m³ మరియు విశ్వసనీయత ${bestPFZ.confidence}%.`;
      } else {
        answerText = `The strongest available Potential Fishing Zone is ${bestPFZ.name}. PFZ score is ${bestPFZ.pfz_score}, sea surface temperature is ${bestPFZ.sst}°C, chlorophyll concentration is ${bestPFZ.chlorophyll} mg/m³, and confidence is ${bestPFZ.confidence}%.`;
      }
    } else {
      answerText =
        lang === "te"
          ? "ప్రస్తుతం PFZ సమాచారం అందుబాటులో లేదు."
          : "No PFZ information is currently available.";
    }
  }

  // ==================================================
  // MARINE SAFETY
  // ==================================================
  else if (intent === "MARINE_SAFETY") {
    const marine = toolResults.analyzeMarine?.data;

    const weather = marine?.weather ?? toolResults.getWeather?.data;
    const ocean = marine?.ocean ?? toolResults.getOceanConditions?.data;
    const warnings = marine?.warning ?? toolResults.getWarnings?.data;

    const risk = marine?.safety
      ? {
          level: marine.safety.riskLevel,
          score: marine.safety.riskScore,
          factors: marine.safety.factors || [],
        }
      : toolResults.calculateRisk?.data?.risk;

    const geofence = marine?.geofence ?? toolResults.checkGeofence?.data;

    const wind = weather?.windSpeed ?? 0;
    const waves = ocean?.waveHeight ?? 0;
    const rain = weather?.precipitationProbability ?? 0;

    parametersUsed.push(
      `Wind Speed: ${wind} km/h`,
      `Wave Height: ${waves} m`,
      `Rain Probability: ${rain}%`,
    );

    if (risk?.level) {
      parametersUsed.push(
        `Risk Score: ${risk.score}`,
        `Risk Level: ${risk.level}`,
      );
    }

    if (warnings?.factors?.length) {
      riskFactors.push(...warnings.factors);
    }

    if (risk?.factors?.length) {
      riskFactors.push(...risk.factors);
    }

    // IMPORTANT: IMD warning first.
    if (warnings?.level === "HIGH") {
      recommendation = "DO_NOT_SAIL";
    } else if (risk?.level === "EXTREME") {
      recommendation = "DO_NOT_SAIL";
    } else if (risk?.level === "HIGH") {
      recommendation = "PROCEED_WITH_CAUTION";
    } else if (risk?.level === "MODERATE") {
      recommendation = "PROCEED_WITH_CAUTION";
    } else {
      recommendation = "SAFE_TO_SAIL";
    }

    if (lang === "te") {
      if (recommendation === "DO_NOT_SAIL") {
        answerText = `ప్రస్తుతం సముద్రంలోకి వేటకు వెళ్లడం సిఫార్సు చేయబడదు. IMD హెచ్చరిక స్థాయి: ${
          warnings?.level || "HIGH"
        }. గాలి వేగం ${wind} km/h, అలల ఎత్తు ${waves} m, వర్షం సంభావ్యత ${rain}%.`;
      } else if (recommendation === "PROCEED_WITH_CAUTION") {
        answerText = `సముద్ర పరిస్థితుల్లో జాగ్రత్త అవసరం. గాలి వేగం ${wind} km/h, అలల ఎత్తు ${waves} m, వర్షం సంభావ్యత ${rain}%.`;
      } else {
        answerText = `ప్రస్తుత డేటా ఆధారంగా సముద్ర పరిస్థితులు తక్కువ ప్రమాదంగా కనిపిస్తున్నాయి. గాలి వేగం ${wind} km/h, అలల ఎత్తు ${waves} m, వర్షం సంభావ్యత ${rain}%.`;
      }
    } else {
      if (recommendation === "DO_NOT_SAIL") {
        answerText = `Do not venture into the sea at this time. IMD warning level is ${
          warnings?.level || "HIGH"
        }. Current wind speed is ${wind} km/h, wave height is ${waves} m, and precipitation probability is ${rain}%.`;
      } else if (recommendation === "PROCEED_WITH_CAUTION") {
        answerText = `Proceed only with caution. Current wind speed is ${wind} km/h, wave height is ${waves} m, and precipitation probability is ${rain}%.`;
      } else {
        answerText = `Current environmental conditions appear relatively low risk based on the available data. Wind speed is ${wind} km/h, wave height is ${waves} m, and precipitation probability is ${rain}%.`;
      }
    }
  }

  // ==================================================
  // SAFE ROUTE
  // ==================================================
  else if (intent === "SAFE_ROUTE") {
    const route = toolResults.findSafeRoute?.data;
    const warnings = route?.marineWarning;
    const risk = route?.risk;

    parametersUsed.push(
      "A* Route Optimization",
      "Marine Risk",
      "Restricted Cells",
      "Hazard Avoidance",
    );

    recommendation = "NAVIGATION_ADVISORY";

    if (warnings?.level === "HIGH") {
      recommendation = "DO_NOT_SAIL";
    }

    if (risk?.factors) {
      riskFactors.push(...risk.factors);
    }

    if (route?.avoidedHazards?.length) {
      riskFactors.push(`Avoided hazards: ${route.avoidedHazards.length}`);
    }

    const distance = route?.distance ?? "unavailable";

    if (lang === "te") {
      answerText =
        recommendation === "DO_NOT_SAIL"
          ? `IMD నుండి HIGH స్థాయి హెచ్చరిక ఉన్నందున మార్గం లెక్కించినప్పటికీ ప్రస్తుతం సముద్రంలోకి వెళ్లడం సిఫార్సు చేయబడదు. లెక్కించిన మార్గ దూరం ${distance}.`
          : `ప్రమాద కణాలను తప్పించుకునే సురక్షిత మార్గం లెక్కించబడింది. మార్గ దూరం ${distance}.`;
    } else {
      answerText =
        recommendation === "DO_NOT_SAIL"
          ? `A route was calculated, but an IMD HIGH warning is active. Do not venture into the sea at this time. Calculated route distance: ${distance}.`
          : `A risk-aware route was calculated while avoiding restricted and high-risk cells. Calculated route distance: ${distance}.`;
    }
  }

  // ==================================================
  // MARINE CONDITIONS
  // ==================================================
  else if (intent === "MARINE_CONDITIONS") {
    const weather = toolResults.getWeather?.data;
    const ocean = toolResults.getOceanConditions?.data;
    const warnings = toolResults.getWarnings?.data;

    recommendation = "INFORMATIONAL";

    parametersUsed.push(
      "Wind Speed",
      "Wave Height",
      "Sea Surface Temperature",
      "Wave Period",
    );

    if (warnings?.level === "HIGH") {
      riskFactors.push(...(warnings.factors || []));
    }

    if (lang === "te") {
      answerText = `ప్రస్తుత సముద్ర పరిస్థితులు: గాలి వేగం ${weather?.windSpeed ?? "N/A"} km/h, అలల ఎత్తు ${ocean?.waveHeight ?? "N/A"} m, అలల కాలం ${ocean?.wavePeriod ?? "N/A"} s, సముద్ర ఉపరితల ఉష్ణోగ్రత ${ocean?.sst ?? "N/A"}°C.`;
    } else {
      answerText = `Current sea conditions: wind speed ${weather?.windSpeed ?? "N/A"} km/h, wave height ${ocean?.waveHeight ?? "N/A"} m, wave period ${ocean?.wavePeriod ?? "N/A"} s, and sea surface temperature ${ocean?.sst ?? "N/A"}°C.`;
    }
  }

  // ==================================================
  // HAZARD ALERT
  // ==================================================
  else if (intent === "HAZARD_ALERT") {
    const warnings = toolResults.getWarnings?.data;
    const risk = toolResults.calculateRisk?.data?.risk;

    parametersUsed.push(
      "IMD Warning",
      "Risk Level",
      "Lightning Warning",
      "Strong Wind Warning",
      "Squall Warning",
    );

    if (warnings?.level === "HIGH") {
      recommendation = "DO_NOT_SAIL";
      riskFactors.push(...(warnings.factors || []));
    } else if (risk?.level === "HIGH" || risk?.level === "EXTREME") {
      recommendation = "DO_NOT_SAIL";
      riskFactors.push(...(risk.factors || []));
    } else {
      recommendation = "INFORMATIONAL";
    }

    if (lang === "te") {
      answerText = `ప్రమాద హెచ్చరిక స్థాయి: ${
        warnings?.level || "UNKNOWN"
      }. ${warnings?.warning ? "IMD హెచ్చరికలు సక్రియంగా ఉన్నాయి." : "ప్రస్తుతం గుర్తించిన IMD హెచ్చరిక లేదు."}`;
    } else {
      answerText = `Marine hazard status: ${warnings?.level || "UNKNOWN"}. ${
        warnings?.warning
          ? "Active IMD warnings are present."
          : "No active IMD warning was detected by the current parser."
      }`;
    }
  }

  // ==================================================
  // GEOFENCE
  // ==================================================
  else if (intent === "GEOFENCE_CHECK") {
    const geofence = toolResults.checkGeofence?.data;

    parametersUsed.push(
      "IMBL Proximity",
      "Restricted Zones",
      "Protected Zones",
      "Geofence Status",
    );

    // Geofence service unavailable
    if (!geofence || geofence.status === "NOT_CHECKED") {
      recommendation = "NAVIGATION_ADVISORY";

      answerText =
        lang === "te"
          ? "జియోఫెన్స్ తనిఖీ ప్రస్తుతం అందుబాటులో లేదు. కాబట్టి ప్రదేశం సురక్షితం అని నిర్ధారించలేము."
          : "The geofence check is currently unavailable. The vessel location cannot be confirmed as outside restricted or protected zones.";

      riskFactors.push("Geofence status unavailable");
    }

    // Vessel is inside one or more zones
    else if (
      geofence.insideRestrictedZone === true &&
      geofence.zonesInside?.length > 0
    ) {
      const zones = geofence.zonesInside;

      const zoneNames = zones
        .map((zone) => `${zone.name} (${zone.severity})`)
        .join(", ");

      const hasCriticalZone = zones.some(
        (zone) => zone.severity === "CRITICAL",
      );

      recommendation = hasCriticalZone ? "DO_NOT_ENTER" : "NAVIGATION_ADVISORY";

      riskFactors.push(
        ...zones.map(
          (zone) => `Inside ${zone.type}: ${zone.name} (${zone.severity})`,
        ),
      );

      if (lang === "te") {
        answerText = hasCriticalZone
          ? `⚠️ జియోఫెన్స్ హెచ్చరిక: ప్రస్తుత స్థానం ${zoneNames} ప్రాంతంలో ఉంది. ఇది పరిమిత ప్రాంతం. అనుమతి లేకుండా ఈ ప్రాంతంలోకి ప్రవేశించవద్దు.`
          : `⚠️ జియోఫెన్స్ హెచ్చరిక: ప్రస్తుత స్థానం ${zoneNames} ప్రాంతంలో ఉంది. ఇది రక్షిత లేదా పరిమిత ప్రాంతం. అనుమతి లేకుండా ఇక్కడ కార్యకలాపాలు నిర్వహించవద్దు.`;
      } else {
        answerText = hasCriticalZone
          ? `⚠️ Geofence alert: the current vessel location is inside ${zoneNames}. This is a restricted area. Do not enter without appropriate authorization.`
          : `⚠️ Geofence alert: the current vessel location is inside ${zoneNames}. This is a protected or restricted area. Avoid operating in this zone unless legally authorized.`;
      }
    }

    // Vessel is outside zones but close to one
    else if (geofence.nearestZone) {
      const nearest = geofence.nearestZone;

      if (geofence.status === "CAUTION") {
        recommendation = "NAVIGATION_ADVISORY";

        riskFactors.push(
          `Near ${nearest.name}`,
          `Distance: ${nearest.distanceKm} km`,
        );

        if (lang === "te") {
          answerText =
            `⚠️ జాగ్రత్త: సమీప జియోఫెన్స్ ప్రాంతం ${nearest.name}. ` +
            `దూరం సుమారు ${nearest.distanceKm} కి.మీ. ` +
            `ఈ ప్రాంతానికి దగ్గరగా ప్రయాణించేటప్పుడు జాగ్రత్త వహించండి.`;
        } else {
          answerText =
            `⚠️ Geofence caution: the nearest monitored zone is ${nearest.name}, ` +
            `approximately ${nearest.distanceKm} km away. ` +
            `Maintain caution while operating near this zone.`;
        }
      } else {
        recommendation = "INFORMATIONAL";

        if (lang === "te") {
          answerText =
            `జియోఫెన్స్ స్థితి CLEAR. సమీపంలోని పర్యవేక్షించబడిన ప్రాంతం ` +
            `${nearest.name}, దూరం సుమారు ${nearest.distanceKm} కి.మీ.`;
        } else {
          answerText =
            `Geofence status is CLEAR. The nearest monitored zone is ` +
            `${nearest.name}, approximately ${nearest.distanceKm} km away.`;
        }
      }
    }

    // No monitored zone information
    else {
      recommendation = "INFORMATIONAL";

      if (lang === "te") {
        answerText =
          "ప్రస్తుత స్థానానికి సమీపంలో పర్యవేక్షించబడిన పరిమిత లేదా రక్షిత జియోఫెన్స్ ప్రాంతం గుర్తించబడలేదు.";
      } else {
        answerText =
          "No monitored restricted or protected geofence was detected near the current vessel location.";
      }
    }
  }

  // ==================================================
  // GENERAL QUERY
  // ==================================================
  else {
    recommendation = "INFORMATIONAL";
    parametersUsed.push("General Inquiry");
    riskFactors.push("None");

    answerText =
      lang === "te"
        ? "నమస్కారం! నేను Marine Advisory AI. PFZ ప్రాంతాలు, సముద్ర పరిస్థితులు, భద్రతా ప్రమాదాలు, సురక్షిత మార్గాలు మరియు సముద్ర హెచ్చరికలను పరిశీలించడంలో సహాయపడగలను."
        : "Hello! I am your Marine Advisory AI. I can help you find Potential Fishing Zones, evaluate sea conditions and safety, generate risk-aware routes, and check marine warnings.";
  }

  // Final deterministic safety override.
  recommendation = applySafetyOverride(recommendation, toolResults);

  // Make sure the answer cannot contradict a HIGH IMD warning.
  answerText = enforceSafetyAnswer(
    answerText,
    recommendation,
    toolResults,
    lang,
  );

  return {
    answer: answerText,
    recommendation,
    evidence: {
      source: sourceStr,
      timestamp,
      parametersUsed,
      riskFactors,
    },
  };
}
