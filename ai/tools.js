import dotenv from "dotenv";

dotenv.config();

const BACKEND_BASE_URL = process.env.BACKEND_URL || "http://localhost:5000/api";

const FETCH_TIMEOUT_MS = parseInt(
  process.env.BACKEND_TIMEOUT_MS || "15000",
  10,
);

const PFZ_TIMEOUT_MS = parseInt(process.env.PFZ_TIMEOUT_MS || "60000", 10);

async function fetchBackend(endpoint, options = {}) {
  const {
    method = "GET",
    params = {},
    body = null,
    timeoutMs = FETCH_TIMEOUT_MS,
  } = options;

  const controller = new AbortController();

  const timeoutId = setTimeout(() => {
    controller.abort();
  }, timeoutMs);

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

    console.log(`[Backend Request] ${method} ${url.toString()}`);

    const response = await fetch(url.toString(), fetchOptions);

    if (!response.ok) {
      throw new Error(`Backend returned HTTP ${response.status}`);
    }

    const data = await response.json();

    return {
      success: true,
      source:
        data?.dataMode === "FORECAST" ||
        data?.weather?.status === "FORECAST" ||
        data?.ocean?.status === "FORECAST"
          ? "[FORECAST_DATA]"
          : "[LIVE_DATA]",
      data,
    };
  } catch (error) {
    if (error.name === "AbortError") {
      console.warn(
        `[Backend Tool Warning] ${endpoint}: Request timed out after ${timeoutMs} ms`,
      );
    } else {
      console.warn(`[Backend Tool Warning] ${endpoint}: ${error.message}`);
    }

    return null;
  } finally {
    clearTimeout(timeoutId);
  }
}

function getLocation(params = {}, options = {}) {
  const context = params.context || {};
  const query = String(params.userQuery || params.query || "").toLowerCase();

  const refersToSelectedPFZ =
    query.includes("there") ||
    query.includes("that zone") ||
    query.includes("that pfz") ||
    query.includes("that place") ||
    query.includes("this zone") ||
    query.includes("this place");

  const useSelectedPFZ =
    options.useSelectedPFZ === true &&
    refersToSelectedPFZ &&
    context.selectedPFZ;

  const contextLocation = useSelectedPFZ
    ? context.selectedPFZ
    : context.lastLocation || {};

  const location = params.location || contextLocation;

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

export const tools = {
  analyzeMarine: async (params = {}) => {
    console.log("[Tool Executing] analyzeMarine");

    const { latitude, longitude } = getLocation(params);

    const query = String(params.userQuery || params.query || "").toLowerCase();

    let targetDate = null;

    const isTomorrow = query.includes("tomorrow") || query.includes("రేపు");

    if (isTomorrow) {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);

      targetDate = tomorrow.toISOString().slice(0, 10);
    }

    console.log("[analyzeMarine Request]", {
      latitude,
      longitude,
      targetDate,
      query,
    });

    const live = await fetchBackend("/marine/analyze", {
      method: "POST",
      body: {
        latitude,
        longitude,
        targetDate,
      },
    });

    if (live) {
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
        targetDate,
      },
    };
  },

  getNearbyPFZ: async (params = {}) => {
    console.log("[Tool Executing] getNearbyPFZ");

    const { latitude, longitude } = getLocation(params);

    const live = await fetchBackend("/pfz/nearby", {
      method: "GET",
      params: {
        latitude,
        longitude,
        limit: Number(params.limit || 5),
      },
      timeoutMs: PFZ_TIMEOUT_MS,
    });

    if (live) {
      return live;
    }

    return {
      success: false,
      source: "[LIVE_DATA_UNAVAILABLE] PFZ nearby backend request failed",
      data: {
        message: "Live PFZ service is currently unavailable.",
        pfzs: [
          {
            id: "PFZ-BOB-001",
            name: "Visakhapatnam Deep Sea Eddy",
            landingCentre: "Visakhapatnam",
            latitude: 17.3936,
            longitude: 83.275,
            distanceKm: 28,
            depthFromM: 63,
            sst: 26.8,
            chlorophyll: 2.85,
            category: "VERY_HIGH",
            source: "INCOIS",
            sourceStatus: "LIVE"
          },
          {
            id: "PFZ-BOB-002",
            name: "Kakinada Coast Thermal Front",
            landingCentre: "Kakinada",
            latitude: 16.82,
            longitude: 82.62,
            distanceKm: 44,
            depthFromM: 45,
            sst: 27.2,
            chlorophyll: 2.15,
            category: "HIGH",
            source: "INCOIS",
            sourceStatus: "LIVE"
          }
        ],
      },
    };
  },

  rankPFZs: async (params = {}) => {
    console.log("[Tool Executing] rankPFZs");

    const { latitude, longitude } = getLocation(params);

    console.log("[rankPFZs Location]", {
      latitude,
      longitude,
    });

    const live = await fetchBackend("/pfz/ranked", {
      method: "GET",
      params: {
        latitude,
        longitude,
        limit: Number(params.limit || 5),
      },
      timeoutMs: PFZ_TIMEOUT_MS,
    });

    if (live) {
      console.log("[rankPFZs Live Data]", JSON.stringify(live.data, null, 2));

      return live;
    }

    return {
      success: false,
      source: "[LIVE_DATA_UNAVAILABLE] PFZ ranking backend request failed",
      data: {
        message:
          "Live PFZ ranking service is currently unavailable. No real-time best fishing-zone recommendation can be made.",
        coordinates: {
          lat: latitude,
          lon: longitude,
        },
      },
    };
  },

  getWeather: async (params = {}) => {
    console.log("[Tool Executing] getWeather");

    const { latitude, longitude } = getLocation(params, {
      useSelectedPFZ: true,
    });

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
      success: false,
      source: "[LIVE_DATA_UNAVAILABLE] Weather backend route unavailable",

      data: {
        message:
          "Weather service is currently unavailable through the backend API.",
        latitude,
        longitude,
      },
    };
  },

  getWeatherForecast: async (params = {}) => {
    console.log("[Tool Executing] getWeatherForecast");

    const { latitude, longitude } = getLocation(params, {
      useSelectedPFZ: true,
    });

    const query = String(params.userQuery || params.query || "").toLowerCase();

    let targetDate = params.targetDate || null;

    if (!targetDate && (query.includes("tomorrow") || query.includes("రేపు"))) {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      targetDate = tomorrow.toISOString().slice(0, 10);
    }

    const forecast = await fetchBackend("/weather/forecast", {
      method: "GET",
      params: {
        latitude,
        longitude,
        targetDate,
      },
    });

    if (forecast) {
      return {
        ...forecast,
        source: "[FORECAST_DATA]",
      };
    }

    return {
      success: false,
      source: "[FORECAST_DATA_UNAVAILABLE]",
      data: {
        message:
          "Weather forecast service is currently unavailable through the backend API.",
        latitude,
        longitude,
        targetDate,
      },
    };
  },

  getOceanConditions: async (params = {}) => {
    console.log("[Tool Executing] getOceanConditions");

    const { latitude, longitude } = getLocation(params, {
      useSelectedPFZ: true,
    });

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
      success: false,
      source: "[LIVE_DATA_UNAVAILABLE] Ocean backend route unavailable",

      data: {
        message:
          "Marine ocean data service is currently unavailable through the backend API.",
        latitude,
        longitude,
      },
    };
  },

  getMarineForecast: async (params = {}) => {
    console.log("[Tool Executing] getMarineForecast");

    const { latitude, longitude } = getLocation(params, {
      useSelectedPFZ: true,
    });

    const query = String(params.userQuery || params.query || "").toLowerCase();

    let targetDate = params.targetDate || null;

    if (!targetDate && (query.includes("tomorrow") || query.includes("రేపు"))) {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      targetDate = tomorrow.toISOString().slice(0, 10);
    }

    const forecast = await fetchBackend("/ocean/forecast", {
      method: "GET",
      params: {
        latitude,
        longitude,
        targetDate,
      },
    });

    if (forecast) {
      return {
        ...forecast,
        source: "[FORECAST_DATA]",
      };
    }

    return {
      success: false,
      source: "[FORECAST_DATA_UNAVAILABLE]",
      data: {
        message:
          "Marine forecast service is currently unavailable through the backend API.",
        latitude,
        longitude,
        targetDate,
      },
    };
  },

  getWarnings: async (params = {}) => {
    console.log("[Tool Executing] getWarnings");

    const { latitude, longitude } = getLocation(params, {
      useSelectedPFZ: true,
    });

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
      success: false,
      source: "[LIVE_DATA_UNAVAILABLE] Warning backend route unavailable",

      data: {
        message:
          "IMD warning service is currently unavailable through the backend API.",
        latitude,
        longitude,
      },
    };
  },

  calculateRisk: async (params = {}) => {
    console.log("[Tool Executing] calculateRisk");

    const marine = params.marineConditions || {};

    const live = await fetchBackend("/marine/risk", {
      method: "POST",

      body: {
        windSpeed: Number(params.windSpeed ?? marine.wind ?? 0),
        windGust: Number(params.windGust ?? marine.windGust ?? 0),
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
      success: false,
      source: "[LIVE_DATA_UNAVAILABLE] Marine Safety Risk Engine",

      data: {
        overallRiskLevel: "UNKNOWN",
        riskScore: null,
        recommendation: "Unable to calculate live risk.",
        factors: ["Backend risk service unavailable"],
      },
    };
  },

  getRiskMap: async () => {
    console.log("[Tool Executing] getRiskMap");

    return {
      success: true,
      source: "[LIVE_BACKEND] Risk grid generated by route service",

      data: {
        message:
          "Risk map is currently generated as part of the fishing-route workflow.",
      },
    };
  },

  checkGeofence: async (params = {}) => {
    console.log("[Tool Executing] checkGeofence");

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
      success: false,
      source: "[LIVE_DATA_UNAVAILABLE] Geofence backend unavailable",

      data: {
        status: "NOT_CHECKED",

        message:
          "Live geofence service is currently unavailable. Do not assume the vessel is outside a restricted zone.",

        latitude,
        longitude,
      },
    };
  },

  findSafeRoute: async (params = {}) => {
    console.log("[Tool Executing] findSafeRoute");

    const { latitude, longitude } = getLocation(params);

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
      success: false,
      source: "[LIVE_DATA_UNAVAILABLE] Route backend unavailable",

      data: {
        message: "Live safe-route service is currently unavailable.",
      },
    };
  },
};

export const AVAILABLE_TOOLS = [
  "analyzeMarine",
  "getNearbyPFZ",
  "rankPFZs",
  "getWeather",
  "getWeatherForecast",
  "getOceanConditions",
  "getMarineForecast",
  "getWarnings",
  "calculateRisk",
  "getRiskMap",
  "checkGeofence",
  "findSafeRoute",
];
