const THRESHOLDS = require("./thresholds");

function calculateRisk(data) {
  let score = 0;
  const factors = [];

  // Wind
  if (data.wind > THRESHOLDS.wind.high) {
    score += 40;
    factors.push("Strong wind");
  } else if (data.wind > THRESHOLDS.wind.moderate) {
    score += 25;
    factors.push("Moderate-high wind");
  } else if (data.wind > THRESHOLDS.wind.low) {
    score += 10;
    factors.push("Moderate wind");
  }

  // Wave height
  if (data.waveHeight > THRESHOLDS.waveHeight.high) {
    score += 40;
    factors.push("High waves");
  } else if (data.waveHeight > THRESHOLDS.waveHeight.moderate) {
    score += 25;
    factors.push("Moderately high waves");
  } else if (data.waveHeight > THRESHOLDS.waveHeight.low) {
    score += 10;
    factors.push("Moderate waves");
  }

  // Rain
  if (data.rainProbability > THRESHOLDS.rainProbability.high) {
    score += 15;
    factors.push("Heavy rain probability");
  } else if (data.rainProbability > THRESHOLDS.rainProbability.moderate) {
    score += 10;
    factors.push("High rain probability");
  }

  // Lightning
  if (data.lightning >= 3) {
    score += 20;
    factors.push("Frequent lightning");
  } else if (data.lightning >= 1) {
    score += 10;
    factors.push("Lightning detected");
  }

  // Cyclone
  if (data.cyclone === true) {
    score += 100;
    factors.push("Cyclone hazard");
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

  return {
    score,
    level,
    factors,
  };
}

module.exports = { calculateRisk };
