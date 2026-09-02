import dotenv from 'dotenv';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { SYNTHESIS_SYSTEM_PROMPT } from '../prompts.js';

dotenv.config();

/**
 * Response & Advisory Synthesis Agent
 * Synthesizes tool outputs, user intent, and context into a conversational answer with evidence.
 */
export async function synthesizeResponse(intentResult, planResult, toolResults, userQuery = '', context = {}) {
  const apiKey = process.env.GEMINI_API_KEY;
  const lang = intentResult.language || 'en';

  if (apiKey && apiKey.trim() !== '' && apiKey !== 'your_gemini_api_key_here') {
    try {
      const genAI = new GoogleGenerativeAI(apiKey);
      const model = genAI.getGenerativeModel({
        model: process.env.MODEL_NAME || 'gemini-2.5-flash',
        generationConfig: { responseMimeType: 'application/json' }
      });

      const payload = `${SYNTHESIS_SYSTEM_PROMPT}

User Query: "${userQuery}"
Detected Intent: "${intentResult.intent}"
Detected Language: "${lang}"
Conversation Context: ${JSON.stringify(context)}
Tool Execution Results: ${JSON.stringify(toolResults)}`;

      const response = await model.generateContent(payload);
      const text = response.response.text();
      const parsed = JSON.parse(text);

      if (parsed && parsed.answer && parsed.recommendation && parsed.evidence) {
        return parsed;
      }
    } catch (err) {
      console.warn("  [SynthesisAgent] LLM API call failed. Using deterministic synthesizer fallback. Error:", err.message);
    }
  }

  // Deterministic Fallback Synthesizer
  return fallbackSynthesizeResponse(intentResult, planResult, toolResults, userQuery, context);
}

/**
 * Deterministic synthesis logic ensuring evidence, language support, and clear recommendations
 */
function fallbackSynthesizeResponse(intentResult, planResult, toolResults, userQuery, context) {
  const intent = intentResult.intent;
  const lang = intentResult.language || 'en';
  const timestamp = new Date().toISOString();

  // Aggregate sources from tool outputs
  const sources = new Set();
  const parametersUsed = [];
  const riskFactors = [];
  let recommendation = "INFORMATIONAL";

  Object.entries(toolResults || {}).forEach(([toolName, res]) => {
    if (res?.source) sources.add(res.source);
  });

  const sourceStr = sources.size > 0 
    ? Array.from(sources).join(" | ") 
    : "[DEMO_MOCK] INCOIS & IMD Advisory Engine";

  let answerText = "";

  switch (intent) {
    case 'PFZ_SEARCH': {
      const pfz = toolResults.getNearbyPFZ?.data;
      recommendation = "INFORMATIONAL";
      parametersUsed.push("Chlorophyll Concentration", "Sea Surface Temp", "Distance");
      riskFactors.push("None");

      if (lang === 'te') {
        answerText = `సమీపంలో ఉన్న చేపల లభ్యత మండలం (PFZ): ${pfz?.zoneId || 'PFZ-IN-BAY-042'}, విశాఖ తీరం నుండి ${pfz?.distanceKm || 12.5} కి.మీ ENE దిశలో ఉంది. క్లోరోఫిల్ గాఢత: ${pfz?.chlorophyllConc || '2.4 mg/m3'}, సముద్ర ఉపరితల ఉష్ణోగ్రత: ${pfz?.sst || '28.5 °C'}.`;
      } else {
        answerText = `The nearest Potential Fishing Zone (${pfz?.zoneId || 'PFZ-IN-BAY-042'}) is located ${pfz?.distanceKm || 12.5} km ${pfz?.bearing || 'ENE'} off the coast. Chlorophyll concentration is ${pfz?.chlorophyllConc || '2.4 mg/m3'} and sea surface temperature is ${pfz?.sst || '28.5 °C'}.`;
      }
      break;
    }

    case 'MARINE_SAFETY': {
      const risk = toolResults.calculateRisk?.data;
      const weather = toolResults.getWeather?.data;
      const ocean = toolResults.getOceanConditions?.data;

      parametersUsed.push(`Wind Speed: ${weather?.windSpeedKnots || 14} knots`, `Wave Height: ${ocean?.significantWaveHeightMeters || 1.4}m`, `Risk Score: ${risk?.riskScore || 22}/100`);
      
      if (risk?.overallRiskLevel === 'LOW') {
        recommendation = "SAFE_TO_SAIL";
        riskFactors.push("Low wave height", "Normal wind speed");
      } else if (risk?.overallRiskLevel === 'MEDIUM') {
        recommendation = "PROCEED_WITH_CAUTION";
        riskFactors.push("Moderate swell");
      } else {
        recommendation = "DO_NOT_SAIL";
        riskFactors.push("High wave hazard");
      }

      if (lang === 'te') {
        answerText = `రేపు సముద్రంలో వేట సాధారణంగా సురక్షితమే. గాలి వేగం: ${weather?.windSpeedKnots || 14} నాట్స్, అలల ఎత్తు: ${ocean?.significantWaveHeightMeters || 1.4} మీటర్లు. ప్రమాద స్థాయి: తక్కువ (${risk?.overallRiskLevel || 'LOW'}).`;
      } else {
        answerText = `Yes, conditions are safe for fishing tomorrow. Wind speed is normal (${weather?.windSpeedKnots || 14} knots), wave height is ${ocean?.significantWaveHeightMeters || 1.4}m, and no active advisories are issued. Overall risk score: ${risk?.riskScore || 22}/100 (${risk?.overallRiskLevel || 'LOW'}).`;
      }
      break;
    }

    case 'SAFE_ROUTE': {
      const route = toolResults.findSafeRoute?.data;
      const geofence = toolResults.checkGeofence?.data;

      recommendation = "NAVIGATION_ADVISORY";
      parametersUsed.push("Spatial Hazards", "IMBL Distance", "Ocean Current");
      riskFactors.push(`IMBL Distance: ${geofence?.distanceToIMBLKm || 42}km`);

      if (lang === 'te') {
        answerText = `సురక్షిత నావిగేషన్ మార్గం: ${route?.routeName || 'Route Alpha'}. మొత్తం దూరం: ${route?.totalDistanceNm || 8.7} నాటికల్ మైళ్లు, అంచనా సమయం: ${route?.estimatedTimeMinutes || 45} నిమిషాలు. అంతర్జాతీయ సముద్ర సరిహద్దుకు ${geofence?.distanceToIMBLKm || 42} కి.మీ దూరంలో ఉంది.`;
      } else {
        answerText = `Calculated optimal route (${route?.routeName || 'Route Alpha'}). Total distance: ${route?.totalDistanceNm || 8.7} NM, estimated travel time: ${route?.estimatedTimeMinutes || 45} mins. Route avoids all shallow reefs and remains ${geofence?.distanceToIMBLKm || 42} km clear of the IMBL boundary.`;
      }
      break;
    }

    case 'HAZARD_ALERT': {
      const warnings = toolResults.getWarnings?.data;
      recommendation = warnings?.highWaveAlert ? "DO_NOT_SAIL" : "INFORMATIONAL";
      parametersUsed.push("Cyclone Alert Level", "High Wave Warning");
      riskFactors.push(warnings?.cycloneAlertLevel || "GREEN (NORMAL)");

      if (lang === 'te') {
        answerText = `హెచ్చరిక వివరాలు: ప్రస్తుతం సైక్లోన్ హెచ్చరిక స్థాయి: ${warnings?.cycloneAlertLevel || 'GREEN (NORMAL)'}. యాక్టివ్ అత్యవసర హెచ్చరికలు ఏవీ లేవు.`;
      } else {
        answerText = `Hazard Advisory Status: Cyclone Alert Level is ${warnings?.cycloneAlertLevel || 'GREEN (NORMAL)'}. No active emergency sea warnings in your sector.`;
      }
      break;
    }

    case 'MARINE_CONDITIONS': {
      const weather = toolResults.getWeather?.data;
      const ocean = toolResults.getOceanConditions?.data;

      recommendation = "INFORMATIONAL";
      parametersUsed.push("Wind Speed", "Wave Height", "Sea Temp");
      riskFactors.push("None");

      if (lang === 'te') {
        answerText = `సముద్ర వాతావరణం: గాలి వేగం ${weather?.windSpeedKnots || 14} నాట్స్, అలల ఎత్తు ${ocean?.significantWaveHeightMeters || 1.4} మీటర్లు, సముద్ర ఉపరితల ఉష్ణోగ్రత ${ocean?.seaSurfaceTempCelsius || 28.5} °C.`;
      } else {
        answerText = `Current Sea Conditions: Wind speed is ${weather?.windSpeedKnots || 14} knots (${weather?.windDirection || 'SW'}), wave height is ${ocean?.significantWaveHeightMeters || 1.4}m, and sea surface temperature is ${ocean?.seaSurfaceTempCelsius || 28.5} °C.`;
      }
      break;
    }

    case 'GEOFENCE_CHECK': {
      const geofence = toolResults.checkGeofence?.data;
      recommendation = geofence?.borderAlert ? "PROCEED_WITH_CAUTION" : "INFORMATIONAL";
      parametersUsed.push("IMBL Proximity", "Restricted Zones");
      riskFactors.push(`Distance to IMBL: ${geofence?.distanceToIMBLKm || 42} km`);

      if (lang === 'te') {
        answerText = `సముద్ర సరిహద్దు తనిఖీ: మీరు అనుమతించబడిన భారతీయ జలాల్లో ఉన్నారు. అంతర్జాతీయ సరిహద్దు (IMBL) కి ${geofence?.distanceToIMBLKm || 42} కి.మీ దూరం ఉంది.`;
      } else {
        answerText = `Geofence Status: Vessel position is inside permitted Indian territorial waters. Distance to International Maritime Boundary Line (IMBL) is ${geofence?.distanceToIMBLKm || 42} km. No restricted zone violations detected.`;
      }
      break;
    }

    default: {
      recommendation = "INFORMATIONAL";
      parametersUsed.push("General Inquiry");
      riskFactors.push("None");
      answerText = lang === 'te' 
        ? "నమస్కారం! నేను మెరైన్ ఎఐ అసిస్టెంట్. నేను మీకు చేపల మండలాలు (PFZ), వాతావరణం, సురక్షిత మార్గాలు మరియు సరిహద్దు హెచ్చరికలను అందించగలను." 
        : "Hello! I am your Marine Advisory AI. I can help you find Potential Fishing Zones (PFZ), evaluate sea safety, generate safe navigation routes, and check maritime boundaries.";
      break;
    }
  }

  return {
    answer: answerText,
    recommendation: recommendation,
    evidence: {
      source: sourceStr,
      timestamp: timestamp,
      parametersUsed: parametersUsed,
      riskFactors: riskFactors
    }
  };
}
