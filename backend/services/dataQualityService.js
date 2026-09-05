function buildDataQuality({
  weather,
  ocean,
  warning,
  cyclone,
  pfzSource = "Prototype PFZ Dataset",
  geofenceSource = "Prototype Geofence Dataset",
}) {
  return {
    weather: {
      status: weather?.source ? "LIVE" : "UNAVAILABLE",
      source: weather?.source ?? null,
      updatedAt: weather?.updatedAt ?? null,
    },

    ocean: {
      status: ocean?.source ? "LIVE" : "UNAVAILABLE",
      source: ocean?.source ?? null,
      updatedAt: ocean?.updatedAt ?? null,
    },

    warning: {
      status: warning?.source ? "LIVE" : "UNAVAILABLE",
      source: warning?.source ?? null,
      checkedAt: warning?.checkedAt ?? null,
    },

    cyclone: {
      status:
        cyclone?.status === "NOT_AVAILABLE"
          ? "NOT_AVAILABLE"
          : cyclone?.active !== null
            ? "LIVE"
            : "NOT_AVAILABLE",
      source: cyclone?.source ?? null,
      checkedAt: cyclone?.checkedAt ?? null,
    },

    pfz: {
      status: "PROTOTYPE",
      source: pfzSource,
    },

    geofence: {
      status: "PROTOTYPE",
      source: geofenceSource,
    },
  };
}

module.exports = {
  buildDataQuality,
};
