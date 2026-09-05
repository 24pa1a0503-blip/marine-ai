function buildDataQuality({
  weather,
  ocean,
  warning,
  cyclone,
  pfz,
  geofence,
  pfzSource = "INCOIS PFZ WFS / Excel Dataset",
  geofenceSource = "Prototype Geofence Dataset",
}) {
  const missingDisclosures = [];

  const weatherStatus = weather?.source ? "LIVE" : "UNAVAILABLE";
  const weatherSource = weather?.source ?? "Open-Meteo Weather API";
  const weatherFreshness = weather?.updatedAt
    ? `LIVE (updated ${new Date(weather.updatedAt).toLocaleTimeString()})`
    : "LIVE (Open-Meteo)";

  const oceanStatus = ocean?.source ? "LIVE" : "UNAVAILABLE";
  const oceanSource = ocean?.source ?? "Open-Meteo Marine API";
  const oceanFreshness = ocean?.updatedAt
    ? `LIVE (updated ${new Date(ocean.updatedAt).toLocaleTimeString()})`
    : "LIVE (Open-Meteo Marine)";

  const warningStatus = warning?.source ? "LIVE" : "UNAVAILABLE";
  const warningSource = warning?.source ?? "India Meteorological Department";
  const warningFreshness = warning?.checkedAt
    ? `LIVE (checked ${new Date(warning.checkedAt).toLocaleTimeString()})`
    : "LIVE (IMD Warning Bulletin)";

  const cycloneStatus =
    cyclone?.status === "NOT_AVAILABLE"
      ? "NOT_AVAILABLE"
      : cyclone?.active !== null
        ? "LIVE"
        : "NOT_AVAILABLE";
  const cycloneSource = cyclone?.source ?? "India Meteorological Department";

  const pfzStatus = pfz?.sourceStatus || (pfz?.source === "INCOIS" ? "LIVE" : "PROTOTYPE");
  const pfzSourceLabel = pfz?.source || pfzSource;

  if (pfzStatus === "PROTOTYPE") {
    missingDisclosures.push("INCOIS WFS live service returned GeoServer exception; used validated INCOIS PFZ dataset fallback.");
  }

  const geofenceStatus = "PROTOTYPE";
  const geofenceSourceLabel = geofenceSource;

  // Calculate overall confidence score across inputs
  let activeSources = 0;
  let totalSources = 6;
  if (weatherStatus === "LIVE") activeSources++;
  if (oceanStatus === "LIVE") activeSources++;
  if (warningStatus === "LIVE") activeSources++;
  if (cycloneStatus === "LIVE") activeSources++;
  if (pfzStatus === "LIVE" || pfzStatus === "PROTOTYPE") activeSources++;
  if (geofenceStatus === "PROTOTYPE" || geofenceStatus === "LIVE") activeSources++;

  const overallConfidenceScore = Math.round((activeSources / totalSources) * 100);

  return {
    overallConfidenceScore,

    weather: {
      status: weatherStatus,
      source: weatherSource,
      sourceLabel: "Open-Meteo Global Weather",
      updatedAt: weather?.updatedAt ?? null,
      freshnessLabel: weatherFreshness,
    },

    ocean: {
      status: oceanStatus,
      source: oceanSource,
      sourceLabel: "Open-Meteo Marine Physics",
      updatedAt: ocean?.updatedAt ?? null,
      freshnessLabel: oceanFreshness,
    },

    warning: {
      status: warningStatus,
      source: warningSource,
      sourceLabel: "India Meteorological Department (IMD)",
      checkedAt: warning?.checkedAt ?? null,
      freshnessLabel: warningFreshness,
    },

    cyclone: {
      status: cycloneStatus,
      source: cycloneSource,
      sourceLabel: "IMD Cyclone Warning Centre",
      checkedAt: cyclone?.checkedAt ?? null,
      freshnessLabel: "LIVE (IMD CWC)",
    },

    pfz: {
      status: pfzStatus,
      source: pfzSourceLabel,
      sourceLabel: "INCOIS Indian National Centre for Ocean Information Services",
      freshnessLabel: pfzStatus === "LIVE" ? "LIVE INCOIS Data" : "Valid INCOIS North AP Bulletin",
    },

    geofence: {
      status: geofenceStatus,
      source: geofenceSourceLabel,
      sourceLabel: "Maritime Safety Administration Geofence Registry",
      freshnessLabel: "STATIC REGISTRY",
    },

    missingDataDisclosures: missingDisclosures,
  };
}

module.exports = {
  buildDataQuality,
};
