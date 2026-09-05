const https = require("https");
const { fetchSST } = require("./sstService");
const { fetchChlorophyll } = require("./chlorophyllService");
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
    sourceStatus: "PROTOTYPE",
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
    sourceStatus: "PROTOTYPE",
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
    sourceStatus: "PROTOTYPE",
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
    sourceStatus: "PROTOTYPE",
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
    sourceStatus: "PROTOTYPE",
  },
];

function fetchINCOISPFZ() {
  return new Promise((resolve, reject) => {
    const request = https.get(
      INCOIS_PFZ_URL,
      {
        headers: {
          Accept: "application/json",
          "User-Agent": "Marine-AI-PFZ-Integration/1.0",
        },
        timeout: 15000,
      },
      (res) => {
        let body = "";

        res.on("data", (chunk) => {
          body += chunk;
        });

        res.on("end", () => {
          if (res.statusCode !== 200) {
            reject(new Error(`INCOIS returned HTTP ${res.statusCode}`));
            return;
          }

          try {
            const data = JSON.parse(body);
            resolve(data);
          } catch (error) {
            reject(new Error("Invalid JSON received from INCOIS"));
          }
        });
      },
    );

    request.on("timeout", () => {
      request.destroy(new Error("INCOIS request timed out"));
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
        coordinates.push([Number(point[0]), Number(point[1])]);
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

  const midpointIndex = Math.floor(coordinates.length / 2);

  const [longitude, latitude] = coordinates[midpointIndex];

  return {
    latitude,
    longitude,
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

        latitude: Number(point.latitude.toFixed(6)),

        longitude: Number(point.longitude.toFixed(6)),

        // The pfzlines WFS layer does not provide
        // these scientific values.
        // Do NOT invent them.
        pfz_score: null,
        category: "INCOIS_PFZ",
        sst: null,
        chlorophyll: null,
        depth: null,
        confidence: null,

        advisory: "Potential Fishing Zone identified by INCOIS.",

        source: "INCOIS",
        sourceStatus: "LIVE",

        geometryType: feature.geometry?.type || null,

        uid: properties.UID || null,
        year: properties.Year || null,
        julianDay: properties.Julian_day || null,
        serialNumber: properties.Sno || null,
        sector: properties.SECTORBOUN || null,
        length: properties.Length || null,
      };
    })
    .filter(Boolean);
}

async function getLivePFZData() {
  const data = await fetchINCOISPFZ();

  if (!data || !Array.isArray(data.features)) {
    throw new Error(
      "INCOIS response does not contain a valid FeatureCollection",
    );
  }

  const zones = normalizePFZData(data.features);

  if (zones.length === 0) {
    throw new Error("INCOIS returned no valid PFZ zones");
  }

  return {
    source: "INCOIS",
    status: "LIVE",
    updatedAt: new Date().toISOString(),
    featureCount: zones.length,
    zones,
  };
}

async function getPFZs(category = "ALL") {
  try {
    const liveData = await getLivePFZData();

    if (!category || category.toUpperCase() === "ALL") {
      return liveData.zones;
    }

    return liveData.zones.filter(
      (pfz) => pfz.category === category.toUpperCase(),
    );
  } catch (error) {
    console.warn(
      "INCOIS PFZ unavailable. Using prototype fallback:",
      error.message,
    );

    if (!category || category.toUpperCase() === "ALL") {
      return PFZ_DATA;
    }

    return PFZ_DATA.filter((pfz) => pfz.category === category.toUpperCase());
  }
}

async function getPFZSourceStatus() {
  try {
    const liveData = await getLivePFZData();

    return {
      source: "INCOIS",
      status: "LIVE",
      updatedAt: liveData.updatedAt,
      featureCount: liveData.featureCount,
    };
  } catch (error) {
    return {
      source: "INCOIS",
      status: "FALLBACK",
      updatedAt: null,
      featureCount: PFZ_DATA.length,
      message: error.message,
    };
  }
}

function calculateDistanceKm(latitude1, longitude1, latitude2, longitude2) {
  const earthRadiusKm = 6371;

  const lat1 = (Number(latitude1) * Math.PI) / 180;
  const lat2 = (Number(latitude2) * Math.PI) / 180;

  const deltaLat = ((Number(latitude2) - Number(latitude1)) * Math.PI) / 180;

  const deltaLon = ((Number(longitude2) - Number(longitude1)) * Math.PI) / 180;

  const a =
    Math.sin(deltaLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(deltaLon / 2) ** 2;

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return earthRadiusKm * c;
}

async function getNearbyPFZs(latitude, longitude, limit = 5) {
  const userLatitude = Number(latitude);
  const userLongitude = Number(longitude);

  if (!Number.isFinite(userLatitude) || !Number.isFinite(userLongitude)) {
    throw new Error("Valid latitude and longitude are required");
  }

  const pfzs = await getPFZs("ALL");

  const nearbyPFZs = pfzs
    .map((pfz) => ({
      ...pfz,
      distanceKm: Number(
        calculateDistanceKm(
          userLatitude,
          userLongitude,
          pfz.latitude,
          pfz.longitude,
        ).toFixed(2),
      ),
    }))
    .sort((a, b) => a.distanceKm - b.distanceKm)
    .slice(0, Number(limit));

  // Enrich nearby PFZs in parallel.
  // Failure of SST/chlorophyll must NOT block the PFZ response.
  const pfzsWithLiveData = await Promise.all(
    nearbyPFZs.map(async (pfz) => {
      const [sstResult, chlorophyllResult] = await Promise.allSettled([
        fetchSST(pfz.latitude, pfz.longitude),
        fetchChlorophyll(pfz.latitude, pfz.longitude),
      ]);

      let sstData = null;
      let chlorophyllData = null;

      if (sstResult.status === "fulfilled") {
        sstData = sstResult.value;
      } else {
        console.warn(
          `SST unavailable for ${pfz.name}:`,
          sstResult.reason?.message || sstResult.reason,
        );
      }

      if (chlorophyllResult.status === "fulfilled") {
        chlorophyllData = chlorophyllResult.value;
      } else {
        console.warn(
          `Chlorophyll unavailable for ${pfz.name}:`,
          chlorophyllResult.reason?.message || chlorophyllResult.reason,
        );
      }

      return {
        ...pfz,

        // Live SST
        sst: sstData?.sst ?? null,
        sstSource: sstData?.source ?? "NASA JPL MUR SST",
        sstStatus: sstData?.status ?? "UNAVAILABLE",
        sstTimestamp: sstData?.timestamp ?? null,

        // Live chlorophyll
        chlorophyll: chlorophyllData?.chlorophyll ?? null,
        chlorophyllUnit: chlorophyllData?.unit ?? "mg/m³",
        chlorophyllSource: chlorophyllData?.source ?? "INCOIS PFZ CHL WCS",
        chlorophyllStatus: chlorophyllData?.status ?? "UNAVAILABLE",
        chlorophyllTimestamp: chlorophyllData?.timestamp ?? null,
        chlorophyllLatitude: chlorophyllData?.latitude ?? null,
        chlorophyllLongitude: chlorophyllData?.longitude ?? null,
      };
    }),
  );

  return pfzsWithLiveData;
}
async function rankPFZs(latitude, longitude, limit = 5) {
  const userLatitude = Number(latitude);
  const userLongitude = Number(longitude);

  if (!Number.isFinite(userLatitude) || !Number.isFinite(userLongitude)) {
    throw new Error("Valid latitude and longitude are required");
  }

  /*
   * Get live INCOIS PFZ data.
   *
   * We first select a reasonable candidate pool by distance.
   * This prevents hundreds of external SST/chlorophyll requests.
   */
  const pfzs = await getPFZs("ALL");

  const candidateLimit = Math.max(Number(limit) * 3, 10);

  const candidates = pfzs
    .map((pfz) => ({
      ...pfz,
      distanceKm: Number(
        calculateDistanceKm(
          userLatitude,
          userLongitude,
          pfz.latitude,
          pfz.longitude,
        ).toFixed(2),
      ),
    }))
    .sort((a, b) => a.distanceKm - b.distanceKm)
    .slice(0, candidateLimit);

  /*
   * Enrich only the candidate PFZs.
   *
   * SST/chlorophyll failures are tolerated because live
   * INCOIS PFZ geometry itself remains valid.
   */
  const enrichedPFZs = await Promise.all(
    candidates.map(async (pfz) => {
      const [sstResult, chlorophyllResult] = await Promise.allSettled([
        fetchSST(pfz.latitude, pfz.longitude),
        fetchChlorophyll(pfz.latitude, pfz.longitude),
      ]);

      const sstData = sstResult.status === "fulfilled" ? sstResult.value : null;

      const chlorophyllData =
        chlorophyllResult.status === "fulfilled"
          ? chlorophyllResult.value
          : null;

      return {
        ...pfz,

        sst: sstData?.sst ?? null,
        sstSource: sstData?.source ?? "NASA JPL MUR SST",
        sstStatus: sstData?.status ?? "UNAVAILABLE",
        sstTimestamp: sstData?.timestamp ?? null,

        chlorophyll: chlorophyllData?.chlorophyll ?? null,
        chlorophyllUnit: chlorophyllData?.unit ?? "mg/m³",
        chlorophyllSource: chlorophyllData?.source ?? "INCOIS PFZ CHL WCS",
        chlorophyllStatus: chlorophyllData?.status ?? "UNAVAILABLE",
        chlorophyllTimestamp: chlorophyllData?.timestamp ?? null,
      };
    }),
  );

  /*
   * Calculate normalization values.
   *
   * We normalize only using factors that are actually available.
   * Missing data is NEVER replaced with a fabricated value.
   */
  const validChlorophyll = enrichedPFZs
    .map((pfz) => Number(pfz.chlorophyll))
    .filter(Number.isFinite);

  const maxChlorophyll =
    validChlorophyll.length > 0 ? Math.max(...validChlorophyll) : null;

  const minDistance = Math.min(...enrichedPFZs.map((pfz) => pfz.distanceKm));

  const maxDistance = Math.max(...enrichedPFZs.map((pfz) => pfz.distanceKm));

  /*
   * Calculate AI Suitability Score.
   *
   * IMPORTANT:
   * This is our derived score.
   * It is NOT an official INCOIS score.
   *
   * Base weights:
   *   Chlorophyll      : 45
   *   Distance         : 25
   *   SST              : 20
   *   Official PFZ     : 10
   *
   * If a factor is unavailable, its weight is removed
   * from the denominator and the remaining available
   * factors are normalized to 100.
   */
  const rankedPFZs = enrichedPFZs.map((pfz) => {
    let rawScore = 0;
    let availableWeight = 0;

    const availableFactors = [];
    const unavailableFactors = [];

    /*
     * --------------------------------------------------
     * 1. Chlorophyll — 45 points
     * --------------------------------------------------
     */
    const chlorophyll = Number(pfz.chlorophyll);

    if (
      pfz.chlorophyll !== null &&
      pfz.chlorophyll !== undefined &&
      Number.isFinite(chlorophyll) &&
      maxChlorophyll !== null &&
      maxChlorophyll > 0
    ) {
      rawScore += (chlorophyll / maxChlorophyll) * 45;

      availableWeight += 45;
      availableFactors.push("Chlorophyll");
    } else {
      unavailableFactors.push("Chlorophyll");
    }

    /*
     * --------------------------------------------------
     * 2. Distance — 25 points
     * --------------------------------------------------
     */
    const distance = Number(pfz.distanceKm);

    if (Number.isFinite(distance)) {
      let distanceScore;

      if (maxDistance > minDistance) {
        distanceScore =
          ((maxDistance - distance) / (maxDistance - minDistance)) * 25;
      } else {
        distanceScore = 25;
      }

      rawScore += distanceScore;
      availableWeight += 25;
      availableFactors.push("Distance");
    } else {
      unavailableFactors.push("Distance");
    }

    /*
     * --------------------------------------------------
     * 3. SST — 20 points
     * --------------------------------------------------
     */
    const sst = Number(pfz.sst);

    if (pfz.sst !== null && pfz.sst !== undefined && Number.isFinite(sst)) {
      let sstScore;

      if (sst >= 26 && sst <= 30) {
        sstScore = 20;
      } else if ((sst >= 24 && sst < 26) || (sst > 30 && sst <= 32)) {
        sstScore = 12;
      } else {
        sstScore = 5;
      }

      rawScore += sstScore;
      availableWeight += 20;
      availableFactors.push("SST");
    } else {
      unavailableFactors.push("SST");
    }

    /*
     * --------------------------------------------------
     * 4. Official INCOIS PFZ score — 10 points
     * --------------------------------------------------
     *
     * We only use this when it actually exists.
     * Current INCOIS WFS normally returns null.
     */
    const officialPFZScore = Number(pfz.pfz_score);

    if (
      pfz.pfz_score !== null &&
      pfz.pfz_score !== undefined &&
      Number.isFinite(officialPFZScore)
    ) {
      const normalizedOfficialScore = Math.max(
        0,
        Math.min(100, officialPFZScore),
      );

      rawScore += (normalizedOfficialScore / 100) * 10;

      availableWeight += 10;
      availableFactors.push("Official PFZ score");
    } else {
      unavailableFactors.push("Official PFZ score");
    }

    /*
     * --------------------------------------------------
     * Normalize available factors to 100.
     * --------------------------------------------------
     *
     * Example:
     *
     * Available:
     *   Distance = 25
     *   SST      = 20
     *
     * Available weight = 45
     *
     * Final score =
     *   rawScore / 45 * 100
     */
    const aiSuitabilityScore =
      availableWeight > 0
        ? Number(((rawScore / availableWeight) * 100).toFixed(2))
        : null;

    /*
     * Data completeness tells the user how much
     * of the scoring model was actually available.
     */
    const dataCompleteness = Number(((availableWeight / 100) * 100).toFixed(0));

    return {
      ...pfz,

      aiSuitabilityScore,

      scoreDataCompleteness: dataCompleteness,

      scoringFactors: {
        available: availableFactors,
        unavailable: unavailableFactors,
      },

      rankingMethod:
        "AI-derived suitability using live chlorophyll, SST, distance, and official PFZ score when available; missing factors are excluded and remaining factors are normalized",

      rankingNote:
        unavailableFactors.length > 0
          ? `Score calculated using available factors only. Unavailable factors: ${unavailableFactors.join(", ")}`
          : "All ranking factors were available",
    };
  });

  /*
   * Highest AI suitability first.
   *
   * If two PFZs have the same score, prefer the
   * closer PFZ.
   */
  return rankedPFZs
    .sort((a, b) => {
      const scoreA = Number(a.aiSuitabilityScore ?? -Infinity);

      const scoreB = Number(b.aiSuitabilityScore ?? -Infinity);

      if (scoreB !== scoreA) {
        return scoreB - scoreA;
      }

      return (
        Number(a.distanceKm ?? Infinity) - Number(b.distanceKm ?? Infinity)
      );
    })
    .slice(0, Number(limit));
}

module.exports = {
  getPFZs,
  getPFZSourceStatus,
  getLivePFZData,
  getNearbyPFZs,
  rankPFZs,
  calculateDistanceKm,
  PFZ_DATA,
};
