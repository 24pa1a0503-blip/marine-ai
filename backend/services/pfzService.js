const https = require("https");

const INCOIS_PFZ_URL =
  "https://incois.gov.in/geoserver/PFZ_Automation/ows" +
  "?service=WFS" +
  "&version=1.1.0" +
  "&request=GetFeature" +
  "&typeName=PFZ_Automation:pfzlines" +
  "&outputFormat=application/json";

// Existing prototype data.
// This remains as a fallback if INCOIS is temporarily unavailable.
const PFZ_DATA = [
  {
    id: "PFZ-BOB-001",
    name: "Kakinada Deep Sea Eddy",
    latitude: 16.82,
    longitude: 82.62,
    pfz_score: 96,
    category: "VERY_HIGH",
    sst: 26.8,
    chlorophyll: 2.85,
    depth: 45,
    confidence: 95,
    advisory: "Prototype PFZ dataset",
    source: "PROTOTYPE",
    sourceStatus: "PROTOTYPE"
  },
  {
    id: "PFZ-BOB-002",
    name: "Kakinada Coastal Front",
    latitude: 16.95,
    longitude: 82.48,
    pfz_score: 88,
    category: "HIGH",
    sst: 27.2,
    chlorophyll: 2.35,
    depth: 38,
    confidence: 89,
    advisory: "Prototype PFZ dataset",
    source: "PROTOTYPE",
    sourceStatus: "PROTOTYPE"
  },
  {
    id: "PFZ-BOB-003",
    name: "Visakhapatnam Offshore Zone",
    latitude: 17.52,
    longitude: 83.35,
    pfz_score: 79,
    category: "HIGH",
    sst: 27.6,
    chlorophyll: 1.95,
    depth: 52,
    confidence: 84,
    advisory: "Prototype PFZ dataset",
    source: "PROTOTYPE",
    sourceStatus: "PROTOTYPE"
  },
  {
    id: "PFZ-BOB-004",
    name: "Machilipatnam Fishing Zone",
    latitude: 15.95,
    longitude: 81.35,
    pfz_score: 67,
    category: "MODERATE",
    sst: 28.1,
    chlorophyll: 1.55,
    depth: 32,
    confidence: 76,
    advisory: "Prototype PFZ dataset",
    source: "PROTOTYPE",
    sourceStatus: "PROTOTYPE"
  },
  {
    id: "PFZ-BOB-005",
    name: "Amalapuram Offshore Zone",
    latitude: 16.62,
    longitude: 82.15,
    pfz_score: 48,
    category: "LOW",
    sst: 28.7,
    chlorophyll: 0.95,
    depth: 28,
    confidence: 61,
    advisory: "Prototype PFZ dataset",
    source: "PROTOTYPE",
    sourceStatus: "PROTOTYPE"
  }
];

function fetchINCOISPFZ() {
  return new Promise((resolve, reject) => {
    const request = https.get(
      INCOIS_PFZ_URL,
      {
        headers: {
          Accept: "application/json",
          "User-Agent": "Marine-AI-PFZ-Integration/1.0"
        },
        timeout: 15000
      },
      (res) => {
        let body = "";

        res.on("data", (chunk) => {
          body += chunk;
        });

        res.on("end", () => {
          if (res.statusCode !== 200) {
            reject(
              new Error(`INCOIS returned HTTP ${res.statusCode}`)
            );
            return;
          }

          try {
            const data = JSON.parse(body);
            resolve(data);
          } catch (error) {
            reject(
              new Error("Invalid JSON received from INCOIS")
            );
          }
        });
      }
    );

    request.on("timeout", () => {
      request.destroy(
        new Error("INCOIS request timed out")
      );
    });

    request.on("error", reject);
  });
}

function getAllCoordinates(feature) {
  const coordinates = [];

  if (!feature?.geometry?.coordinates) {
    return coordinates;
  }

  for (const line of feature.geometry.coordinates) {
    if (!Array.isArray(line)) {
      continue;
    }

    for (const point of line) {
      if (
        Array.isArray(point) &&
        point.length >= 2 &&
        Number.isFinite(Number(point[0])) &&
        Number.isFinite(Number(point[1]))
      ) {
        coordinates.push([
          Number(point[0]),
          Number(point[1])
        ]);
      }
    }
  }

  return coordinates;
}

function getRepresentativePoint(feature) {
  const coordinates = getAllCoordinates(feature);

  if (coordinates.length === 0) {
    return null;
  }

  const midpointIndex = Math.floor(
    coordinates.length / 2
  );

  const [longitude, latitude] =
    coordinates[midpointIndex];

  return {
    latitude,
    longitude
  };
}

function normalizePFZData(features) {
  return features
    .map((feature) => {
      const point = getRepresentativePoint(feature);

      if (!point) {
        return null;
      }

      const properties = feature.properties || {};

      return {
        id: `INCOIS-${properties.UID || feature.id}`,

        name: `INCOIS PFZ ${properties.Sno || feature.id}`,

        latitude: Number(
          point.latitude.toFixed(6)
        ),

        longitude: Number(
          point.longitude.toFixed(6)
        ),

        // The pfzlines WFS layer does not provide
        // these scientific values.
        // Do NOT invent them.
        pfz_score: null,
        category: "INCOIS_PFZ",
        sst: null,
        chlorophyll: null,
        depth: null,
        confidence: null,

        advisory:
          "Potential Fishing Zone identified by INCOIS.",

        source: "INCOIS",
        sourceStatus: "LIVE",

        geometryType:
          feature.geometry?.type || null,

        uid: properties.UID || null,
        year: properties.Year || null,
        julianDay: properties.Julian_day || null,
        serialNumber: properties.Sno || null,
        sector: properties.SECTORBOUN || null,
        length: properties.Length || null
      };
    })
    .filter(Boolean);
}

async function getLivePFZData() {
  const data = await fetchINCOISPFZ();

  if (
    !data ||
    !Array.isArray(data.features)
  ) {
    throw new Error(
      "INCOIS response does not contain a valid FeatureCollection"
    );
  }

  const zones = normalizePFZData(
    data.features
  );

  if (zones.length === 0) {
    throw new Error(
      "INCOIS returned no valid PFZ zones"
    );
  }

  return {
    source: "INCOIS",
    status: "LIVE",
    updatedAt: new Date().toISOString(),
    featureCount: zones.length,
    zones
  };
}

async function getPFZs(category = "ALL") {
  try {
    const liveData = await getLivePFZData();

    if (
      !category ||
      category.toUpperCase() === "ALL"
    ) {
      return liveData.zones;
    }

    return liveData.zones.filter(
      (pfz) =>
        pfz.category === category.toUpperCase()
    );
  } catch (error) {
    console.warn(
      "INCOIS PFZ unavailable. Using prototype fallback:",
      error.message
    );

    if (
      !category ||
      category.toUpperCase() === "ALL"
    ) {
      return PFZ_DATA;
    }

    return PFZ_DATA.filter(
      (pfz) =>
        pfz.category === category.toUpperCase()
    );
  }
}

async function getPFZSourceStatus() {
  try {
    const liveData = await getLivePFZData();

    return {
      source: "INCOIS",
      status: "LIVE",
      updatedAt: liveData.updatedAt,
      featureCount: liveData.featureCount
    };
  } catch (error) {
    return {
      source: "INCOIS",
      status: "FALLBACK",
      updatedAt: null,
      featureCount: PFZ_DATA.length,
      message: error.message
    };
  }
}

module.exports = {
  getPFZs,
  getPFZSourceStatus,
  getLivePFZData,
  PFZ_DATA
};