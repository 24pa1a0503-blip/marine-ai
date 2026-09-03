const { getPFZs } = require("./pfzService");
const { calculateDistance } = require("../../gis/distance");

function getBestFishingZones({ latitude, longitude, maxDistance = 150 }) {
  latitude = Number(latitude);
  longitude = Number(longitude);

  if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
    return {
      success: false,
      message: "Valid latitude and longitude are required",
    };
  }

  const pfzs = getPFZs("ALL");

  const ranked = pfzs
    .map((pfz) => {
      const distance = calculateDistance(
        latitude,
        longitude,
        pfz.latitude,
        pfz.longitude,
      );

      const distancePenalty = distance * 0.15;

      const recommendationScore = pfz.pfz_score - distancePenalty;

      return {
        ...pfz,
        distance: Number(distance.toFixed(2)),
        recommendationScore: Number(recommendationScore.toFixed(2)),
      };
    })
    .filter((pfz) => pfz.distance <= maxDistance)
    .sort((a, b) => b.recommendationScore - a.recommendationScore);

  if (ranked.length === 0) {
    return {
      success: false,
      message: "No suitable fishing zones found nearby",
    };
  }

  return {
    success: true,

    currentLocation: {
      latitude,
      longitude,
    },

    recommendedZone: ranked[0],

    alternatives: ranked.slice(1, 4),
  };
}

module.exports = {
  getBestFishingZones,
};
