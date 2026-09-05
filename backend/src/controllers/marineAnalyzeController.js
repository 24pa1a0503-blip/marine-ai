const { getPFZs, rankPFZs } = require("../../services/pfzService");
const {
  getWeatherConditions,
  getWeatherForecast,
} = require("../../services/weatherService");

const {
  getMarineConditions,
  getMarineForecast,
} = require("../../services/marineDataService");
const { getMarineWarnings } = require("../../services/marineWarningService");
const { checkGeofence } = require("../../services/geofenceService");
const { calculateRisk } = require("../../../risk-engine/riskCalculator");
const { getCycloneStatus } = require("../../services/cycloneService");
const { buildDataQuality } = require("../../services/dataQualityService");

const { detectHazards } = require("../hazardDetector");

const {
  evaluateAlerts,
  getActiveAlerts,
} = require("../alertEngine");

async function analyzeMarine(req, res) {
  try {
    const latitude = Number(req.body.latitude ?? 16.7);
    const longitude = Number(req.body.longitude ?? 82.3);
    const targetDate = req.body.targetDate || null;

    if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
      return res.status(400).json({
        success: false,
        error: "Valid latitude and longitude are required",
      });
    }

    console.log(`[Marine Analyze] ${latitude}, ${longitude}`);

    // Fetch independent data sources in parallel.
    const useForecast = Boolean(targetDate);

    console.log(
      `[Marine Analyze] Data mode: ${useForecast ? "FORECAST" : "LIVE"}`,
    );

    const [pfzResult, weather, ocean, warning, geofence, cyclone] =
      await Promise.all([
        rankPFZs(latitude, longitude, 5).catch(() => getPFZs("ALL")),

        useForecast
          ? getWeatherForecast(latitude, longitude, targetDate)
          : getWeatherConditions(latitude, longitude),

        useForecast
          ? getMarineForecast(latitude, longitude, targetDate)
          : getMarineConditions(latitude, longitude),

        // IMD warning is currently the latest official warning.
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
      cyclone: cyclone?.active ?? null,
    };

    const risk = calculateRisk(marineConditions);

    const dataQuality = buildDataQuality({
      weather,
      ocean,
      warning,
      cyclone,
      pfz: Array.isArray(pfzResult) && pfzResult[0] ? pfzResult[0] : null,
      geofence,
    });

    // Safety override.
    let safetyStatus = "PROCEED";

    if (
      warning?.level === "HIGH" ||
      risk.level === "EXTREME" ||
      geofence?.insideRestrictedZone === true
    ) {
      safetyStatus = "DO_NOT_SAIL";
    } else if (
      risk.level === "HIGH" ||
      geofence?.status === "CAUTION"
    ) {
      safetyStatus = "CAUTION";
    }

    // --------------------------------------------------
    // ALERT ENGINE
    // --------------------------------------------------

    const alertData = {
      location: {
        latitude,
        longitude,
      },
      weather,
      ocean,
      warning,
      cyclone,
      geofence,
      safety: {
        status: safetyStatus,
        riskLevel: risk.level,
        riskScore: risk.score,
        factors: risk.factors,
      },
    };

    // Detect hazards from the marine analysis.
    const hazards = detectHazards(alertData);

    const hasDoNotSailHazard = hazards.some(
      (hazard) => hazard.recommendation === "DO_NOT_SAIL"
    );

    if (hasDoNotSailHazard) {
      safetyStatus = "DO_NOT_SAIL";
    }

    const alerts = evaluateAlerts(
      hazards,
      {
        latitude,
        longitude,
      },
      {
        source: "Marine AI",
        sourceStatus: "LIVE_ANALYSIS",
      }
    );

    const activeAlerts = getActiveAlerts();

    const topPFZ = Array.isArray(pfzResult) && pfzResult.length > 0 ? pfzResult[0] : null;

    // Top-level explainability & evidence aggregation
    const explainability = {
      confidenceScore: dataQuality.overallConfidenceScore,
      safetyDecision: {
        status: safetyStatus,
        riskLevel: risk.level,
        riskScore: risk.score,
        primaryFactors: risk.factors,
        perFactorRiskBreakdown: risk.perFactorBreakdown,
      },
      pfzSelection: topPFZ ? {
        topZoneId: topPFZ.id,
        topZoneName: topPFZ.name,
        whySelected: topPFZ.selectionExplanation || [
          `✓ Close distance: ${topPFZ.distanceKm} km`,
          `✓ Source: ${topPFZ.source || "INCOIS"}`,
        ],
        overallSuitability: `${topPFZ.aiSuitabilityScore || 85}/100`,
        perFactorBreakdown: topPFZ.perFactorBreakdown || {},
        missingDataDisclosure: topPFZ.missingDataDisclosure || null,
        rejectedAlternatives: Array.isArray(pfzResult)
          ? pfzResult.slice(1).map((alt) => ({
              id: alt.id,
              name: alt.name,
              rejectionReason: alt.rejectionReason || "Lower suitability score",
            }))
          : [],
      } : null,
      alertsTriggered: hazards.map((h) => ({
        id: h.id,
        title: h.title,
        severity: h.severity,
        triggerExplanation: h.triggerExplanation,
      })),
      missingDataDisclosures: dataQuality.missingDataDisclosures,
    };

    // --------------------------------------------------
    // RESPONSE
    // --------------------------------------------------

    res.json({
      success: true,
      dataMode: useForecast ? "FORECAST" : "LIVE",
      targetDate: targetDate,

      location: {
        latitude,
        longitude,
      },

      confidenceScore: dataQuality.overallConfidenceScore,

      dataQuality,

      explainability,

      safety: {
        status: safetyStatus,
        riskLevel: risk.level,
        riskScore: risk.score,
        factors: risk.factors,
        perFactorBreakdown: risk.perFactorBreakdown,
      },

      // Alert intelligence
      alerts: {
        hazardCount: hazards.length,
        alertCount: alerts.length,
        hazards,
        active: activeAlerts,
      },

      pfz: {
        count: Array.isArray(pfzResult) ? pfzResult.length : 0,
        zones: Array.isArray(pfzResult) ? pfzResult : [],
        recommendedZone: topPFZ,
        source: topPFZ?.source || "INCOIS PFZ Dataset",
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
        pfz: topPFZ?.source || "INCOIS PFZ Dataset",
        geofence: "Maritime Safety Administration Geofence Registry",
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