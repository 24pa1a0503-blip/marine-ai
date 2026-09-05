/**
 * Context Manager for Marine AI Orchestrator (Member 1)
 * Remembers short conversation state:
 * - lastLocation
 * - destination
 * - selectedPFZ
 * - previousRiskResult
 */

export class ContextManager {
  constructor(initialState = {}) {
    this.state = {
      lastLocation: initialState.lastLocation || {
        name: "Visakhapatnam Coast",
        lat: 17.6868,
        lon: 83.2185,
      },
      destination: initialState.destination || null,
      selectedPFZ: initialState.selectedPFZ || null,
      previousRiskResult: initialState.previousRiskResult || null,
    };
  }

  updateFromQueryAndIntent(intentResult, toolResults = {}) {
    if (toolResults.getNearbyPFZ?.data) {
      const pfzData = toolResults.getNearbyPFZ.data;

      this.state.selectedPFZ = pfzData;

      // Backend /api/pfz returns a list of PFZs.
      // Select the strongest available PFZ for route planning.
      if (Array.isArray(pfzData.pfzs) && pfzData.pfzs.length > 0) {
        const nearestPFZ = [...pfzData.pfzs].sort(
          (a, b) =>
            Number(a.distanceKm ?? Infinity) - Number(b.distanceKm ?? Infinity),
        )[0];

        this.state.selectedPFZ = nearestPFZ;

        this.state.destination = {
          name: nearestPFZ.name,
          lat: Number(nearestPFZ.latitude),
          lon: Number(nearestPFZ.longitude),
        };
      }
    }

    if (toolResults.calculateRisk?.data) {
      this.state.previousRiskResult = toolResults.calculateRisk.data;
    }

    if (toolResults.findSafeRoute?.data) {
      this.state.lastRoute = toolResults.findSafeRoute.data;
    }

    return this.state;
  }

  getContext() {
    return { ...this.state };
  }
}
