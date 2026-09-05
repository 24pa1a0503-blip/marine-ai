const THRESHOLDS = require("./thresholds");

/**
 * Enhanced Multi-Source Risk Calculator
 * Combines Weather, Ocean, IMD Warnings, Cyclone Hazards, and Geofence Boundaries
 */
function calculateRisk(data = {}) {
  let score = 0;
  const factors = [];

  // Official IMD Warning
  if (data.officialWarning === "HIGH" || data.officialWarning === "CRITICAL") {
    score += 60;
    factors.push("Official high marine warning");
  } else if (data.officialWarning === "MODERATE") {
    score += 30;
    factors.push("Official marine warning");
  }

  // Wind Speed (knots / km/h)
  const wind = Number(data.wind ?? data.windSpeed ?? 0);
  if (wind > THRESHOLDS.wind.high) {
    score += 40;
    factors.push(`Strong wind (${wind} knots)`);
  } else if (wind > THRESHOLDS.wind.moderate) {
    score += 25;
    factors.push(`Moderate-high wind (${wind} knots)`);
  } else if (wind > THRESHOLDS.wind.low) {
    score += 10;
    factors.push(`Moderate wind (${wind} knots)`);
  }

  // Wind Gusts
  const windGust = Number(data.windGust ?? 0);
  if (windGust > THRESHOLDS.windGust.high) {
    score += 40;
    factors.push(`Dangerous wind gusts (${windGust} knots)`);
  } else if (windGust > THRESHOLDS.windGust.moderate) {
    score += 25;
    factors.push(`Strong wind gusts (${windGust} knots)`);
  } else if (windGust > THRESHOLDS.windGust.low) {
    score += 10;
    factors.push(`Moderate wind gusts (${windGust} knots)`);
  }

  // Wave Height (meters)
  const waveHeight = Number(data.waveHeight ?? 0);
  if (waveHeight > THRESHOLDS.waveHeight.high) {
    score += 40;
    factors.push(`High swell/waves (${waveHeight} m)`);
  } else if (waveHeight > THRESHOLDS.waveHeight.moderate) {
    score += 25;
    factors.push(`Moderately high waves (${waveHeight} m)`);
  } else if (waveHeight > THRESHOLDS.waveHeight.low) {
    score += 10;
    factors.push(`Moderate waves (${waveHeight} m)`);
  }

  // Rain Probability (%)
  const rainProb = Number(data.rainProbability ?? 0);
  if (rainProb > THRESHOLDS.rainProbability.high) {
    score += 15;
    factors.push(`Heavy rain probability (${rainProb}%)`);
  } else if (rainProb > THRESHOLDS.rainProbability.moderate) {
    score += 10;
    factors.push(`High rain probability (${rainProb}%)`);
  }

  // Lightning
  const lightning = Number(data.lightning ?? 0);
  if (lightning >= 3) {
    score += 20;
    factors.push("Frequent lightning detected");
  } else if (lightning >= 1) {
    score += 10;
    factors.push("Lightning detected");
  }

  // Cyclone Hazard
  if (data.cyclone === true) {
    score += 100;
    factors.push("Active cyclone hazard zone");
  }

  // Geofence Proximity / Intersection
  if (data.geofence) {
    if (data.geofence.insideRestrictedZone === true || data.geofence.classification === "RESTRICTED") {
      score += 100;
      factors.push(`Restricted zone violation: ${data.geofence.warningMessage || "Inside prohibited boundary"}`);
    } else if (data.geofence.classification === "CAUTION" || (data.geofence.distToBoundaryKm !== undefined && data.geofence.distToBoundaryKm < 10)) {
      score += 35;
      const dist = data.geofence.distToBoundaryKm ? `${data.geofence.distToBoundaryKm} km` : "<10 km";
      factors.push(`Near restricted boundary (${dist})`);
    }
  }

  let level;
  if (score >= 100) {
    level = "EXTREME";
  } else if (score >= 60) {
    level = "HIGH";
  } else if (score >= 30) {
    level = "MODERATE";
  } else {
    level = "LOW";
  }

  let recommendation = "PROCEED";
  if (level === "EXTREME" || level === "HIGH") {
    recommendation = "DO_NOT_SAIL";
  } else if (level === "MODERATE") {
    recommendation = "CAUTION";
  }

  return {
    score,
    level,
    factors,
    recommendation,
  };
}

/**
 * Calculates per-PFZ multi-source risk
 */
function calculatePFZRisk(pfz, marineConditions = {}, geofenceResult = null) {
  const combined = {
    ...marineConditions,
    latitude: pfz.latitude,
    longitude: pfz.longitude,
    geofence: geofenceResult,
  };

  const risk = calculateRisk(combined);
  const safetyScore = Math.max(0, 100 - risk.score);

  return {
    pfzId: pfz.id || pfz.name,
    pfzName: pfz.name,
    riskScore: risk.score,
    riskLevel: risk.level,
    safetyScore,
    riskFactors: risk.factors,
    recommendation: risk.recommendation,
    suitability: pfz.category || "HIGH",
  };
}

/**
 * Computes Risk Trend: IMPROVING | STABLE | WORSENING
 */
function calculateRiskTrend(currentMarine = {}, forecastMarine = {}) {
  const currentRisk = calculateRisk(currentMarine);
  const forecastRisk = calculateRisk(forecastMarine);

  const diff = forecastRisk.score - currentRisk.score;

  let trend = "STABLE";
  let explanation = "Weather and ocean conditions remain stable.";

  if (diff >= 15) {
    trend = "WORSENING";
    explanation = "Conditions deteriorating with rising winds/waves forecast.";
  } else if (diff <= -15) {
    trend = "IMPROVING";
    explanation = "Weather improving with subsiding wind and waves.";
  }

  return {
    currentRiskLevel: currentRisk.level,
    forecastRiskLevel: forecastRisk.level,
    trend,
    explanation,
  };
}

module.exports = {
  calculateRisk,
  calculatePFZRisk,
  calculateRiskTrend,
};
