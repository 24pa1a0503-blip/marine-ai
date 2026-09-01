const thresholds = require("./thresholds");

function calculateRisk(data) {
  let score = 0;
  const factors = [];

  // Wind
  if (data.windSpeed >= thresholds.wind.high) {
    score += 35;
    factors.push("High wind speed");
  } else if (data.windSpeed >= thresholds.wind.moderate) {
    score += 20;
    factors.push("Moderate wind speed");
  } else if (data.windSpeed >= thresholds.wind.low) {
    score += 10;
    factors.push("Low to moderate wind");
  }

  // Wave
  if (data.waveHeight >= thresholds.wave.high) {
    score += 35;
    factors.push("High wave height");
  } else if (data.waveHeight >= thresholds.wave.moderate) {
    score += 20;
    factors.push("Moderate wave height");
  } else if (data.waveHeight >= thresholds.wave.low) {
    score += 10;
    factors.push("Slight wave activity");
  }

  // Rain
  if (data.rainProbability >= thresholds.rainProbability.high) {
    score += 20;
    factors.push("High probability of rain");
  } else if (data.rainProbability >= thresholds.rainProbability.moderate) {
    score += 10;
    factors.push("Moderate probability of rain");
  } else if (data.rainProbability >= thresholds.rainProbability.low) {
    score += 5;
    factors.push("Some probability of rain");
  }

  // Lightning
  if (data.lightning === true) {
    score += 30;
    factors.push("Lightning detected");
  }

  // Cyclone
  if (data.cyclone === true) {
    score += 50;
    factors.push("Cyclone warning/condition detected");
  }

  let level;

  if (score <= 30) {
    level = "LOW";
  } else if (score <= 60) {
    level = "MODERATE";
  } else if (score <= 80) {
    level = "HIGH";
  } else {
    level = "EXTREME";
  }

  return {
    score,
    level,
    factors,
  };
}

module.exports = calculateRisk;
