const GEOFENCE_ZONES = [
  {
    id: "IMBL_001",
    name: "International Maritime Boundary Line (India/Sri Lanka)",
    type: "RESTRICTED",
    description:
      "Crossing this boundary may enter Sri Lankan territorial waters.",
    severity: "CRITICAL",
    polygon: [
      [9.85, 79.52],
      [9.5, 79.7],
      [9.15, 79.85],
      [8.8, 79.95],
    ],
  },

  {
    id: "MPA_001",
    name: "Coringa Wildlife Sanctuary",
    type: "PROTECTED_ZONE",
    description: "Ecologically sensitive protected coastal and marine area.",
    severity: "HIGH",
    polygon: [
      [16.85, 82.3],
      [16.85, 82.42],
      [16.7, 82.42],
      [16.7, 82.3],
    ],
  },

  {
    id: "DANGER_ZONE_001",
    name: "Naval Firing & Defense Restricted Area",
    type: "RESTRICTED",
    description:
      "Active naval defense exercise area. Civilian fishing craft may be prohibited.",
    severity: "HIGH",
    polygon: [
      [17.1, 83.4],
      [17.1, 83.6],
      [16.9, 83.6],
      [16.9, 83.4],
    ],
  },
];

function isPointInsidePolygon(latitude, longitude, polygon) {
  let inside = false;

  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const latI = polygon[i][0];
    const lonI = polygon[i][1];

    const latJ = polygon[j][0];
    const lonJ = polygon[j][1];

    const intersects =
      lonI > longitude !== lonJ > longitude &&
      latitude < ((latJ - latI) * (longitude - lonI)) / (lonJ - lonI) + latI;

    if (intersects) {
      inside = !inside;
    }
  }

  return inside;
}

function calculateDistanceKm(lat1, lon1, lat2, lon2) {
  const R = 6371;

  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) ** 2;

  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function getNearestZone(latitude, longitude, zone) {
  let minDistance = Infinity;

  for (const point of zone.polygon) {
    const distance = calculateDistanceKm(
      latitude,
      longitude,
      point[0],
      point[1],
    );

    if (distance < minDistance) {
      minDistance = distance;
    }
  }

  return minDistance;
}

function checkGeofence(latitude, longitude) {
  latitude = Number(latitude);
  longitude = Number(longitude);

  if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
    return {
      success: false,
      message: "Valid latitude and longitude are required",
    };
  }

  const checkedZones = GEOFENCE_ZONES.map((zone) => {
    const inside = isPointInsidePolygon(latitude, longitude, zone.polygon);

    const distanceKm = getNearestZone(latitude, longitude, zone);

    return {
      id: zone.id,
      name: zone.name,
      type: zone.type,
      severity: zone.severity,
      description: zone.description,
      inside,
      distanceKm: Number(distanceKm.toFixed(2)),
    };
  });

  const zonesInside = checkedZones.filter((zone) => zone.inside);

  const nearestZone = [...checkedZones].sort(
    (a, b) => a.distanceKm - b.distanceKm,
  )[0];

  let status = "CLEAR";

  if (zonesInside.length > 0) {
    status = zonesInside.some((zone) => zone.severity === "CRITICAL")
      ? "RESTRICTED"
      : "CAUTION";
  } else if (nearestZone.distanceKm <= 10) {
    status = "CAUTION";
  }

  return {
    success: true,

    location: {
      latitude,
      longitude,
    },

    status,

    insideRestrictedZone: zonesInside.length > 0,

    zonesInside,

    nearestZone,

    checkedZones,

    source: "Prototype Geofence Dataset",

    checkedAt: new Date().toISOString(),
  };
}

module.exports = {
  checkGeofence,
  GEOFENCE_ZONES,
};
