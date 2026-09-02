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
      lastLocation: initialState.lastLocation || { name: "Visakhapatnam Coast", lat: 17.6868, lon: 83.2185 },
      destination: initialState.destination || null,
      selectedPFZ: initialState.selectedPFZ || null,
      previousRiskResult: initialState.previousRiskResult || null
    };
  }

  updateFromQueryAndIntent(intentResult, toolResults = {}) {
    if (toolResults.getNearbyPFZ?.data) {
      this.state.selectedPFZ = toolResults.getNearbyPFZ.data;
      if (toolResults.getNearbyPFZ.data.coordinates) {
        this.state.destination = {
          name: toolResults.getNearbyPFZ.data.zoneId,
          lat: toolResults.getNearbyPFZ.data.coordinates.lat,
          lon: toolResults.getNearbyPFZ.data.coordinates.lon
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
