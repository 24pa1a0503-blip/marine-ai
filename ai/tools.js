import dotenv from "dotenv";

dotenv.config();

const BACKEND_BASE_URL = process.env.BACKEND_URL || "http://localhost:5000/api";

const FETCH_TIMEOUT_MS = parseInt(process.env.BACKEND_TIMEOUT_MS || "8000", 10);

async function fetchBackend(endpoint, options = {}) {
  const { method = "GET", params = {}, body = null } = options;

  const controller = new AbortController();

  const timeoutId = setTimeout(() => {
    controller.abort();
  }, FETCH_TIMEOUT_MS);

  try {
    const url = new URL(`${BACKEND_BASE_URL}${endpoint}`);

    if (method === "GET") {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          url.searchParams.append(key, String(value));
        }
      });
    }

    const fetchOptions = {
      method,
      headers: {
        "Content-Type": "application/json",
      },
      signal: controller.signal,
    };

    if (method !== "GET" && body !== null) {
      fetchOptions.body = JSON.stringify(body);
    }

    const response = await fetch(url.toString(), fetchOptions);

    if (!response.ok) {
      throw new Error(`Backend returned HTTP ${response.status}`);
    }

    const data = await response.json();

    return {
      success: true,
      source: "[LIVE_DATA]",
      data,
    };
  } catch (error) {
    console.warn(`[Backend Tool Warning] ${endpoint}: ${error.message}`);

    return null;
  } finally {
    clearTimeout(timeoutId);
  }
}

// ----------------------------------------------------
// HELPER: extract location from query/context
// ----------------------------------------------------

function getLocation(params = {}) {
  const context = params.context || {};

  const location = params.location || context.lastLocation || {};

  const latitude = Number(
    params.latitude ?? params.lat ?? location.latitude ?? location.lat ?? 16.7,
  );

  const longitude = Number(
    params.longitude ??
      params.lon ??
      location.longitude ??
      location.lon ??
      82.3,
  );

  return {
    latitude,
    longitude,
  };
}

// ----------------------------------------------------
// TOOLS
// ----------------------------------------------------

export const tools = {
  // ==================================================
  // UNIFIED MARINE ANALYSIS
  // ==================================================
  analyzeMarine: async (params = {}) => {
    console.log("  [Tool Executing] analyzeMarine");

    const { latitude, longitude } = getLocation(params);

    console.log("  [analyzeMarine Location]", { latitude, longitude });

    const live = await fetchBackend("/marine/analyze", {
      method: "POST",
      body: {
        latitude,
        longitude,
      },
    });

    if (live) {
      console.log(
        "  [analyzeMarine Backend Data]",
        JSON.stringify(live.data, null, 2),
      );
      return live;
    }

    return {
      success: false,
      source: "[LIVE_DATA_UNAVAILABLE]",
      data: {
        status: "UNKNOWN",
        message:
          "Unified marine analysis is currently unavailable. Do not assume the vessel is safe.",
        latitude,
        longitude,
      },
    };
  },

  // ==================================================
  // PFZ
  // ==================================================

  getNearbyPFZ: async (params = {}) => {
    console.log("  [Tool Executing] getNearbyPFZ");

    const { latitude, longitude } = getLocation(params);

    /*
     * Existing backend PFZ endpoint:
     * GET /api/pfz
     *
     * The current PFZ controller/service returns
     * the available PFZ information.
     */

    const live = await fetchBackend("/pfz", {
      method: "GET",
      params: {
        latitude,
        longitude,
      },
    });

    if (live) {
      return live;
    }

    return {
      success: true,
      source: "[DEMO_MOCK] PFZ fallback — backend unavailable",
      data: {
        message: "PFZ live service unavailable. Demo fallback only.",
        coordinates: {
          lat: latitude,
          lon: longitude,
        },
      },
    };
  },

  // ==================================================
  // WEATHER
  // ==================================================

  getWeather: async (params = {}) => {
    console.log("  [Tool Executing] getWeather");

    const { latitude, longitude } = getLocation(params);

    /*
     * IMPORTANT:
     * There is currently no weather route in server.js.
     *
     * Therefore this tool will temporarily return a
     * clearly labelled fallback until we expose the
     * existing weatherService through a backend route.
     */

    const live = await fetchBackend("/weather", {
      method: "GET",
      params: {
        latitude,
        longitude,
      },
    });

    if (live) {
      return live;
    }

    return {
      success: true,
      source: "[DEMO_MOCK] Weather fallback — API route not exposed",
      data: {
        message:
          "Weather service exists internally but is not yet exposed through the backend API.",
        latitude,
        longitude,
      },
    };
  },

  // ==================================================
  // OCEAN
  // ==================================================

  getOceanConditions: async (params = {}) => {
    console.log("  [Tool Executing] getOceanConditions");

    const { latitude, longitude } = getLocation(params);

    /*
     * Existing marineDataService is live, but currently
     * there is no /api/ocean route in server.js.
     */

    const live = await fetchBackend("/ocean", {
      method: "GET",
      params: {
        latitude,
        longitude,
      },
    });

    if (live) {
      return live;
    }

    return {
      success: true,
      source: "[DEMO_MOCK] Ocean fallback — API route not exposed",
      data: {
        message:
          "Marine data service exists internally but is not yet exposed through the backend API.",
        latitude,
        longitude,
      },
    };
  },

  // ==================================================
  // WARNINGS
  // ==================================================

  getWarnings: async (params = {}) => {
    console.log("  [Tool Executing] getWarnings");

    const { latitude, longitude } = getLocation(params);

    /*
     * Existing marineWarningService is live, but currently
     * there is no /api/warnings route in server.js.
     */

    const live = await fetchBackend("/warnings", {
      method: "GET",
      params: {
        latitude,
        longitude,
      },
    });

    if (live) {
      return live;
    }

    return {
      success: true,
      source: "[DEMO_MOCK] Warning fallback — API route not exposed",
      data: {
        message:
          "IMD warning service exists internally but is not yet exposed through the backend API.",
        latitude,
        longitude,
      },
    };
  },

  // ==================================================
  // RISK
  // ==================================================

  calculateRisk: async (params = {}) => {
    console.log("  [Tool Executing] calculateRisk");

    const marine = params.marineConditions || {};

    const live = await fetchBackend("/marine/risk", {
      method: "POST",
      body: {
        windSpeed: Number(params.windSpeed ?? marine.wind ?? 0),

        waveHeight: Number(params.waveHeight ?? marine.waveHeight ?? 0),

        rainProbability: Number(
          params.rainProbability ?? marine.rainProbability ?? 0,
        ),

        lightning: Number(params.lightning ?? marine.lightning ?? 0),

        cyclone: Boolean(params.cyclone ?? marine.cyclone ?? false),
      },
    });

    if (live) {
      return live;
    }

    return {
      success: true,
      source: "[DEMO_MOCK] Marine Safety Risk Engine",
      data: {
        overallRiskLevel: "UNKNOWN",
        riskScore: null,
        recommendation: "Unable to calculate live risk.",
        factors: ["Backend risk service unavailable"],
      },
    };
  },

  // ==================================================
  // RISK MAP
  // ==================================================

  getRiskMap: async (params = {}) => {
    console.log("  [Tool Executing] getRiskMap");

    /*
     * There is currently no dedicated /api/risk/map
     * endpoint in server.js.
     *
     * Geographic risk grid is currently generated
     * inside the fishing route workflow.
     */

    return {
      success: true,
      source: "[LIVE_BACKEND] Risk grid generated by route service",
      data: {
        message:
          "Risk map is currently generated as part of the fishing-route workflow.",
      },
    };
  },

  // ==================================================
  // GEOFENCE
  // ==================================================

  checkGeofence: async (params = {}) => {
    console.log("  [Tool Executing] checkGeofence");

    const { latitude, longitude } = getLocation(params);

    const live = await fetchBackend("/geofence", {
      method: "GET",
      params: {
        latitude,
        longitude,
      },
    });

    if (live) {
      return live;
    }

    return {
      success: true,
      source: "[DEMO_MOCK] Geofence fallback — backend unavailable",
      data: {
        status: "NOT_CHECKED",
        message:
          "Live geofence service is currently unavailable. Do not assume the vessel is outside a restricted zone.",
        latitude,
        longitude,
      },
    };
  },

  // ==================================================
  // SAFE ROUTE
  // ==================================================

  findSafeRoute: async (params = {}) => {
    console.log("  [Tool Executing] findSafeRoute");
    console.log(
      "  [Route Context]",
      JSON.stringify(params.context?.destination, null, 2),
    );

    const { latitude, longitude } = getLocation(params);

    /*
     * Existing live endpoint:
     *
     * POST /api/fishing-route/find
     *
     * This endpoint already combines:
     * PFZ + Marine Data + Weather + IMD + Risk + A*
     */

    const live = await fetchBackend("/fishing-route/find", {
      method: "POST",
      body: {
        latitude,
        longitude,

        rows: Number(params.rows || 5),
        cols: Number(params.cols || 5),

        hazardCells: params.hazardCells || [],

        restrictedCells: params.restrictedCells || [],
      },
    });

    if (live) {
      return live;
    }

    return {
      success: true,
      source: "[DEMO_MOCK] Route fallback — backend unavailable",
      data: {
        message: "Live safe-route service unavailable.",
      },
    };
  },
};

// ----------------------------------------------------
// AVAILABLE TOOLS
// ----------------------------------------------------

export const AVAILABLE_TOOLS = Object.keys(tools);
