/**
 * Tools and Function Registry for Marine AI Orchestrator (Member 1 - Day 1)
 * These contain placeholder/mock logic for Day 1.
 */

export const tools = {
  getNearbyPFZ: async (params = {}) => {
    console.log("  [Tool Executing] getNearbyPFZ:", params);
    return {
      success: true,
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
    return {
      success: true,
      data: {
        location: params.location || "Coastal Bay of Bengal",
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
    return {
      success: true,
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
    return {
      success: true,
      data: {
        activeWarnings: [],
        cycloneAlertLevel: "GREEN (NORMAL)",
        highWaveAlert: false
      }
    };
  },

  calculateRisk: async (params = {}) => {
    console.log("  [Tool Executing] calculateRisk:", params);
    return {
      success: true,
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
    return {
      success: true,
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
    return {
      success: true,
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
    return {
      success: true,
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
