function createHazard({
  id,
  type,
  severity,
  priority,
  title,
  message,
  value = null,
  unit = null,
  evidence = [],
  recommendation = "CAUTION",
}) {
  return {
    id,
    type,
    severity,
    priority,
    title,
    message,
    value,
    unit,
    evidence,
    recommendation,
  };
}

function detectHazards(data = {}) {
  const hazards = [];

  const weather = data.weather || {};
  const ocean = data.ocean || {};
  const warning = data.warning || {};
  const cyclone = data.cyclone || {};
  const geofence = data.geofence || {};
  const safety = data.safety || {};

  // Lightning
  if (
    warning.lightningWarning === true ||
    [95, 96, 99].includes(Number(weather.weatherCode))
  ) {
    hazards.push(
      createHazard({
        id: "LIGHTNING",
        type: "LIGHTNING",
        severity: "HIGH",
        priority: 1,
        title: "Lightning Risk",
        message:
          "Thunderstorm or lightning conditions have been detected in the marine area.",
        evidence:
          warning.lightningWarning === true
            ? ["IMD thunderstorm/lightning warning"]
            : ["Weather data indicates thunderstorm conditions"],
        recommendation: "DO_NOT_SAIL",
      })
    );
  }

  // Heavy rain
  const rainProbability = Number(weather.precipitationProbability);

  if (Number.isFinite(rainProbability) && rainProbability >= 70) {
    hazards.push(
      createHazard({
        id: "HEAVY_RAIN",
        type: "HEAVY_RAIN",
        severity: rainProbability >= 90 ? "HIGH" : "MEDIUM",
        priority: rainProbability >= 90 ? 1 : 2,
        title: "Heavy Rain Risk",
        message:
          "High precipitation probability may reduce visibility and make marine operations hazardous.",
        value: rainProbability,
        unit: "%",
        evidence: [`Precipitation probability: ${rainProbability}%`],
        recommendation: "CAUTION",
      })
    );
  }

  // Strong wind
  const windSpeed = Number(weather.windSpeed);

  if (Number.isFinite(windSpeed) && windSpeed >= 30) {
    hazards.push(
      createHazard({
        id: "STRONG_WIND",
        type: "STRONG_WIND",
        severity: windSpeed >= 40 ? "HIGH" : "MEDIUM",
        priority: windSpeed >= 40 ? 1 : 2,
        title: "Strong Wind",
        message:
          "Strong winds may make fishing and navigation hazardous.",
        value: windSpeed,
        unit: "km/h",
        evidence: [`Wind speed: ${windSpeed} km/h`],
        recommendation:
          windSpeed >= 40 ? "DO_NOT_SAIL" : "CAUTION",
      })
    );
  }

  // Dangerous wind gust
  const windGust = Number(weather.windGust);

  if (Number.isFinite(windGust) && windGust >= 40) {
    hazards.push(
      createHazard({
        id: "DANGEROUS_WIND_GUST",
        type: "DANGEROUS_WIND_GUST",
        severity: windGust >= 50 ? "CRITICAL" : "HIGH",
        priority: windGust >= 50 ? 0 : 1,
        title: "Dangerous Wind Gust",
        message:
          "Dangerous wind gusts may cause unstable and unsafe marine conditions.",
        value: windGust,
        unit: "km/h",
        evidence: [`Wind gust: ${windGust} km/h`],
        recommendation:
          windGust >= 50 ? "DO_NOT_SAIL" : "CAUTION",
      })
    );
  }

  // High waves
  const waveHeight = Number(ocean.waveHeight);

  if (Number.isFinite(waveHeight) && waveHeight >= 2.5) {
    hazards.push(
      createHazard({
        id: "HIGH_WAVES",
        type: "HIGH_WAVES",
        severity: waveHeight >= 3.5 ? "HIGH" : "MEDIUM",
        priority: waveHeight >= 3.5 ? 1 : 2,
        title: "High Wave Conditions",
        message:
          "Elevated wave height may make fishing and navigation hazardous.",
        value: waveHeight,
        unit: "m",
        evidence: [`Wave height: ${waveHeight} m`],
        recommendation:
          waveHeight >= 3.5 ? "DO_NOT_SAIL" : "CAUTION",
      })
    );
  }

  // IMD high warning
  if (warning.level === "HIGH") {
    hazards.push(
      createHazard({
        id: "IMD_HIGH_WARNING",
        type: "IMD_WARNING",
        severity: "HIGH",
        priority: 0,
        title: "High IMD Marine Warning",
        message:
          "The India Meteorological Department has issued a high-level marine warning.",
        evidence:
          warning.factors?.length > 0
            ? warning.factors
            : ["IMD warning level: HIGH"],
        recommendation: "DO_NOT_SAIL",
      })
    );
  }

  // IMD moderate warning
  if (warning.level === "MODERATE") {
    hazards.push(
      createHazard({
        id: "IMD_MODERATE_WARNING",
        type: "IMD_WARNING",
        severity: "MEDIUM",
        priority: 2,
        title: "IMD Marine Warning",
        message:
          "The India Meteorological Department has issued a marine warning.",
        evidence:
          warning.factors?.length > 0
            ? warning.factors
            : ["IMD warning level: MODERATE"],
        recommendation: "CAUTION",
      })
    );
  }

  // Squall
  if (warning.squallWarning === true) {
    hazards.push(
      createHazard({
        id: "SQUALL",
        type: "STORM",
        severity: "HIGH",
        priority: 0,
        title: "Squall Warning",
        message:
          "IMD has indicated squall conditions that may rapidly make the sea unsafe.",
        evidence: ["IMD squall warning"],
        recommendation: "DO_NOT_SAIL",
      })
    );
  }

  // Cyclone
  if (cyclone.active === true) {
    hazards.push(
      createHazard({
        id: "CYCLONE",
        type: "CYCLONE",
        severity: "CRITICAL",
        priority: 0,
        title: "Cyclone Hazard",
        message:
          "Cyclone activity may create extremely dangerous marine conditions.",
        evidence: ["Cyclone service reports an active cyclone"],
        recommendation: "DO_NOT_SAIL",
      })
    );
  }

  // Extreme/high marine risk
  if (safety.riskLevel === "EXTREME") {
    hazards.push(
      createHazard({
        id: "EXTREME_MARINE_RISK",
        type: "HIGH_RISK_MARINE",
        severity: "CRITICAL",
        priority: 0,
        title: "Extreme Marine Risk",
        message:
          "The Marine AI risk engine has classified the current conditions as extreme risk.",
        evidence: safety.factors || [],
        recommendation: "DO_NOT_SAIL",
      })
    );
  } else if (safety.riskLevel === "HIGH") {
    hazards.push(
      createHazard({
        id: "HIGH_MARINE_RISK",
        type: "HIGH_RISK_MARINE",
        severity: "HIGH",
        priority: 1,
        title: "High Marine Risk",
        message:
          "The Marine AI risk engine has classified the current conditions as high risk.",
        evidence: safety.factors || [],
        recommendation: "DO_NOT_SAIL",
      })
    );
  }

  // Restricted marine area
  if (geofence.insideRestrictedZone === true) {
    hazards.push(
      createHazard({
        id: "RESTRICTED_MARINE_AREA",
        type: "RESTRICTED_MARINE_AREA",
        severity: "CRITICAL",
        priority: 0,
        title: "Restricted Marine Area",
        message:
          "The selected location is inside a restricted marine area.",
        evidence: [
          "Geofence service reports that the location is inside a restricted zone",
        ],
        recommendation: "DO_NOT_SAIL",
      })
    );
  }

  return hazards;
}

module.exports = {
  detectHazards,
};