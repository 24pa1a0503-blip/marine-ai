const { getPFZs } = require("../../services/pfzService");
const { getWeatherConditions } = require("../../services/weatherService");
const { getMarineConditions } = require("../../services/marineDataService");
const { getMarineWarnings } = require("../../services/marineWarningService");
const { checkGeofence } = require("../../services/geofenceService");
const { calculateRisk } = require("../../../risk-engine/riskCalculator");
const { getCycloneStatus } = require("../../services/cycloneService");
const { buildDataQuality } = require("../../services/dataQualityService");

async function analyzeMarine(req, res) {
  try {
    const latitude = Number(req.body.latitude ?? 16.7);
    const longitude = Number(req.body.longitude ?? 82.3);

    if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
      return res.status(400).json({
        success: false,
        error: "Valid latitude and longitude are required",
      });
    }

    console.log(`[Marine Analyze] ${latitude}, ${longitude}`);

    // Fetch independent data sources in parallel.
    const [pfzResult, weather, ocean, warning, geofence, cyclone] =
      await Promise.all([
        Promise.resolve(getPFZs("ALL")),
        getWeatherConditions(latitude, longitude),
        getMarineConditions(latitude, longitude),
        getMarineWarnings(latitude, longitude),
        Promise.resolve(checkGeofence(latitude, longitude)),
        getCycloneStatus(latitude, longitude),
      ]);

    // Convert live observations into the existing risk-engine format.
    const marineConditions = {
      wind: Number(weather?.windSpeed ?? 0),
      waveHeight: Number(ocean?.waveHeight ?? 0),
      rainProbability: Number(weather?.precipitationProbability ?? 0),
      lightning: warning?.lightningWarning ? 1 : 0,
      officialWarning: warning?.level ?? null,
      // Cyclone integration is not available yet.
      cyclone: cyclone?.active ?? null,
    };

    const risk = calculateRisk(marineConditions);
    const dataQuality = buildDataQuality({
      weather,
      ocean,
      warning,
      cyclone,
    });

    // Safety override.
    let safetyStatus = "PROCEED";

    if (
      warning?.level === "HIGH" ||
      risk.level === "EXTREME" ||
      geofence?.insideRestrictedZone === true
    ) {
      safetyStatus = "DO_NOT_SAIL";
    } else if (risk.level === "HIGH" || geofence?.status === "CAUTION") {
      safetyStatus = "CAUTION";
    }

    res.json({
      success: true,

      location: {
        latitude,
        longitude,
      },
      dataQuality,

      safety: {
        status: safetyStatus,
        riskLevel: risk.level,
        riskScore: risk.score,
        factors: risk.factors,
      },

      pfz: {
        count: Array.isArray(pfzResult) ? pfzResult.length : 0,
        zones: Array.isArray(pfzResult) ? pfzResult : [],
        source: "Prototype PFZ Dataset",
      },

      weather,

      ocean,

      warning,

      cyclone,

      geofence,

      marineConditions,

      sources: {
        weather: "Open-Meteo Weather API",
        ocean: "Open-Meteo Marine API",
        warning: "India Meteorological Department",
        cyclone: "India Meteorological Department",
        pfz: "Prototype PFZ Dataset",
        geofence: "Prototype Geofence Dataset",
      },

      generatedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Marine Analyze API error:", error);

    res.status(500).json({
      success: false,
      error: "Failed to analyze marine conditions",
      message: error.message,
    });
  }
}

module.exports = {
  analyzeMarine,
};
