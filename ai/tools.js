import dotenv from 'dotenv';
dotenv.config();

const BACKEND_BASE_URL = process.env.BACKEND_URL || 'http://localhost:5000/api';
const FETCH_TIMEOUT_MS = parseInt(process.env.BACKEND_TIMEOUT_MS || '500', 10);

/**
 * Helper to perform HTTP fetch with timeout to backend endpoints
 */
async function fetchBackend(endpoint, params = {}) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
  
  try {
    const url = new URL(`${BACKEND_BASE_URL}${endpoint}`);
    Object.keys(params).forEach(key => {
      if (params[key] !== undefined && params[key] !== null) {
        url.searchParams.append(key, typeof params[key] === 'object' ? JSON.stringify(params[key]) : params[key]);
      }
    });

    const res = await fetch(url.toString(), {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
      signal: controller.signal
    });

    clearTimeout(timeoutId);
    if (res.ok) {
      const data = await res.json();
      return { success: true, source: '[LIVE_DATA]', data };
    }
  } catch (err) {
    clearTimeout(timeoutId);
    // Silent fail over to DEMO_MOCK fallback
  }

  return null;
}

export const tools = {
  getNearbyPFZ: async (params = {}) => {
    console.log("  [Tool Executing] getNearbyPFZ:", params);
    const live = await fetchBackend('/pfz/nearby', params);
    if (live) return live;

    return {
      success: true,
      source: '[DEMO_MOCK] INCOIS PFZ Satellite Data',
      data: {
        zoneId: "PFZ-IN-BAY-042",
        coordinates: { lat: 17.6868, lon: 83.2185 },
        distanceKm: 12.5,
        bearing: "ENE",
        chlorophyllConc: "2.4 mg/m3",
        sst: "28.5 °C",
        depthMeters: 45,
        validUntil: "2026-09-02T18:00:00Z"
      }
    };
  },

  getWeather: async (params = {}) => {
    console.log("  [Tool Executing] getWeather:", params);
    const live = await fetchBackend('/weather', params);
    if (live) return live;

    return {
      success: true,
      source: '[DEMO_MOCK] IMD Maritime Weather Center',
      data: {
        location: params.location || "Coastal Bay of Bengal (Visakhapatnam)",
        windSpeedKnots: 14,
        windDirection: "SW",
        visibilityKm: 10,
        rainProbabilityPercent: 20,
        tempCelsius: 30
      }
    };
  },

  getOceanConditions: async (params = {}) => {
    console.log("  [Tool Executing] getOceanConditions:", params);
    const live = await fetchBackend('/ocean', params);
    if (live) return live;

    return {
      success: true,
      source: '[DEMO_MOCK] INCOIS High-Resolution Wave Forecast',
      data: {
        significantWaveHeightMeters: 1.4,
        currentSpeedKnots: 1.1,
        currentDirection: "NE",
        seaSurfaceTempCelsius: 28.5,
        seaState: "Slight to Moderate"
      }
    };
  },

  getWarnings: async (params = {}) => {
    console.log("  [Tool Executing] getWarnings:", params);
    const live = await fetchBackend('/warnings', params);
    if (live) return live;

    return {
      success: true,
      source: '[DEMO_MOCK] INCOIS Emergency Alert Network',
      data: {
        activeWarnings: [],
        cycloneAlertLevel: "GREEN (NORMAL)",
        highWaveAlert: false
      }
    };
  },

  calculateRisk: async (params = {}) => {
    console.log("  [Tool Executing] calculateRisk:", params);
    const live = await fetchBackend('/risk/calculate', params);
    if (live) return live;

    return {
      success: true,
      source: '[DEMO_MOCK] Marine Safety Risk Engine',
      data: {
        overallRiskLevel: "LOW",
        riskScore: 22, // 0 to 100
        recommendation: "Safe for small craft fishing till evening.",
        factors: [
          "Wind speed normal (14 knots)",
          "Wave height manageable (1.4m)",
          "No active weather warnings"
        ]
      }
    };
  },

  getRiskMap: async (params = {}) => {
    console.log("  [Tool Executing] getRiskMap:", params);
    const live = await fetchBackend('/risk/map', params);
    if (live) return live;

    return {
      success: true,
      source: '[DEMO_MOCK] GIS Spatial Risk Grid',
      data: {
        gridResolution: "0.01 deg",
        highRiskZonesCount: 0,
        shallowReefsCount: 2,
        navigationalHazards: ["Submerged rocks 3.2nm East"]
      }
    };
  },

  checkGeofence: async (params = {}) => {
    console.log("  [Tool Executing] checkGeofence:", params);
    const live = await fetchBackend('/geofence/check', params);
    if (live) return live;

    return {
      success: true,
      source: '[DEMO_MOCK] Coast Guard Geofence Engine',
      data: {
        isWithinPermittedWaters: true,
        distanceToIMBLKm: 42.0, // International Maritime Boundary Line
        borderAlert: false,
        restrictedZonesIntersected: []
      }
    };
  },

  findSafeRoute: async (params = {}) => {
    console.log("  [Tool Executing] findSafeRoute:", params);
    const live = await fetchBackend('/route/safe', params);
    if (live) return live;

    return {
      success: true,
      source: '[DEMO_MOCK] Marine Route Optimizer',
      data: {
        routeName: "Route Alpha - Coastal Direct",
        waypoints: [
          { lat: 17.6868, lon: 83.2185 },
          { lat: 17.7120, lon: 83.2850 },
          { lat: 17.7500, lon: 83.3400 }
        ],
        totalDistanceNm: 8.7,
        estimatedTimeMinutes: 45,
        safetyRating: "95/100"
      }
    };
  }
};

/**
 * Metadata list of available tools for Planner schema validation
 */
export const AVAILABLE_TOOLS = Object.keys(tools);

