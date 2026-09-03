const { createGeographicRoute } = require("./geoRoute");
const { getMarineWarnings } = require("./marineWarningService");
const { getBestFishingZones } = require("./pfzRecommendationService");
const { getWeatherConditions } = require("./weatherService");
const { getMarineConditions } = require("./marineDataService");
const { getCycloneStatus } = require("./cycloneService");
const { planMarineRoute } = require("./marineRouteService");
const { createGeographicRiskGrid } = require("./geographicRiskGrid");
async function findBestFishingRoute({
  latitude,
  longitude,
  rows = 5,
  cols = 5,
  hazardCells = [],
  restrictedCells = [],
}) {
  // 1. Find the best fishing zone
  const pfzResult = getBestFishingZones({
    latitude,
    longitude,
  });

  if (!pfzResult.success) {
    return {
      success: false,
      message: pfzResult.message,
    };
  }

  const destination = pfzResult.recommendedZone;

  // 2. Get live marine conditions
  const marineData = await getMarineConditions(latitude, longitude);

  // 3. Get live weather conditions
  const weatherData = await getWeatherConditions(latitude, longitude);

  // 4. Get official IMD marine warnings
  const marineWarnings = await getMarineWarnings(latitude, longitude);

  const cycloneStatus = await getCycloneStatus(latitude, longitude);

  // 5. Combine live data for the existing risk engine
  const marineConditions = {
    wind: weatherData.windSpeed ?? 0,
    waveHeight: marineData.waveHeight ?? 0,
    rainProbability: weatherData.precipitationProbability ?? 0,

    lightning: marineWarnings.lightningWarning ? 1 : 0,

    cyclone: cycloneStatus?.active ?? null,

    currentSpeed: marineData.currentSpeed ?? 0,
  };

  // 6. Determine final safety status
  //
  // Official IMD warnings take priority over
  // normal AI risk recommendations.
  let finalSafetyStatus = "SAFE";

  if (marineWarnings.level === "HIGH") {
    finalSafetyStatus = "DO_NOT_SAIL";
  } else if (marineWarnings.level === "MODERATE") {
    finalSafetyStatus = "CAUTION";
  }

  // 7. Convert geographic start/destination
  // into prototype grid positions.
  //
  // This will be replaced by a true geographic
  // risk grid in the next phase.
  const start = {
    row: 0,
    col: 0,
  };

  const goal = {
    row: rows - 1,
    col: cols - 1,
  };

  // 8. Generate risk-aware route
  // 8. Create geographic risk grid
  const geographicRiskGrid = createGeographicRiskGrid({
    rows,
    cols,
    start: {
      latitude,
      longitude,
    },
    destination: {
      latitude: destination.latitude,
      longitude: destination.longitude,
    },
    marineConditions,
    hazardCells,
  });

  // 9. Generate risk-aware route using the geographic risk grid
  const routeResult = planMarineRoute({
    rows,
    cols,
    start,
    goal,
    marineConditions,
    hazardCells,
    restrictedCells,
    customRiskGrid: geographicRiskGrid.grid,
  });

  // 10. Geographic route
  const geographicRoute = routeResult.success
    ? createGeographicRoute({
        route: routeResult.route,
        start: {
          latitude,
          longitude,
        },
        destination: {
          latitude: destination.latitude,
          longitude: destination.longitude,
        },
      })
    : [];

  // 9. Convert grid route into geographic coordinates

  // 10. Final response
  return {
    success: routeResult.success,

    fishermanLocation: {
      latitude,
      longitude,
    },

    recommendedFishingZone: {
      id: destination.id,
      name: destination.name,
      latitude: destination.latitude,
      longitude: destination.longitude,
      pfzScore: destination.pfz_score,
      confidence: destination.confidence,
      distance: destination.distance,
    },

    // LIVE marine data
    liveMarineData: marineData,

    // LIVE weather data
    liveWeatherData: weatherData,

    // OFFICIAL IMD warning
    marineWarning: marineWarnings,

    cyclone: cycloneStatus,

    // Final safety decision
    safetyStatus: finalSafetyStatus,
    geographicRiskGrid: geographicRiskGrid.grid,

    geographicRiskCoordinates: geographicRiskGrid.coordinates,

    // A* route
    route: routeResult.route || [],

    // Geographic route
    geographicRoute,

    // Route metrics
    distance: routeResult.distance ?? null,

    risk: routeResult.risk || geographicRiskGrid.risk,

    totalRiskCost: routeResult.totalRiskCost ?? null,

    totalCost: routeResult.totalCost ?? null,

    explanation: routeResult.explanation || routeResult.message,

    avoidedHazards: routeResult.avoidedHazards || [],

    restrictedCells,

    // Data provenance
    dataQuality: {
      marineData: "LIVE",
      weatherData: "LIVE",
      wind: "LIVE",
      rainProbability: "LIVE",

      // Lightning is now obtained from IMD
      lightning: "LIVE_IMD",

      // Cyclone integration is still pending
      cyclone: cycloneStatus?.status ?? "NOT_AVAILABLE",

      marineWarning: "LIVE_IMD",
    },
  };
}

module.exports = {
  findBestFishingRoute,
};
