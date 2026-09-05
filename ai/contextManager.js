/**
 * Marine AI — Phase 7 Context Manager (Multi-Turn & Reference Resolution)
 * Smart India Hackathon 2026 - Problem Statement ID: 26176
 *
 * Maintains persistent conversation state:
 * - lastLocation: { name, lat, lon }
 * - selectedPFZ: Last discussed/selected PFZ object
 * - pfzList: Array of PFZ zones from previous queries
 * - lastRoute: Last calculated safe navigation route
 * - targetDate: Target forecast date (e.g. YYYY-MM-DD)
 * - conversationHistory: Multi-turn message history array
 * - language: Preferred user language ('en' | 'te' | 'hi')
 */

export class ContextManager {
  constructor(initialState = {}) {
    this.state = {
      session_id: initialState.session_id || `session_${Date.now()}`,
      lastLocation: initialState.lastLocation || {
        name: "Visakhapatnam Coast",
        lat: 17.6868,
        lon: 83.2185,
      },
      destination: initialState.destination || null,
      selectedPFZ: initialState.selectedPFZ || null,
      pfzList: initialState.pfzList || [],
      lastRoute: initialState.lastRoute || null,
      targetDate: initialState.targetDate || this.getTodayDateString(),
      previousRiskResult: initialState.previousRiskResult || null,
      language: initialState.language || "en",
      conversationHistory: initialState.conversationHistory || [],
    };
  }

  getTodayDateString() {
    return new Date().toISOString().split("T")[0];
  }

  getTomorrowDateString() {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return tomorrow.toISOString().split("T")[0];
  }

  /**
   * Resolves references such as "closest", "second one", "that zone", "there", "tomorrow"
   */
  resolveReference(userQuery = "") {
    const query = String(userQuery).toLowerCase().trim();

    // 1. Ordinal resolution: "second one", "2nd zone", "2nd"
    if (
      query.includes("second") ||
      query.includes("2nd") ||
      query.includes("రెండోది") ||
      query.includes("రెండవది")
    ) {
      if (Array.isArray(this.state.pfzList) && this.state.pfzList.length >= 2) {
        this.state.selectedPFZ = this.state.pfzList[1];
        return { type: "PFZ_ORDINAL", resolvedPFZ: this.state.pfzList[1] };
      }
    }

    // 2. Ordinal resolution: "third one", "3rd zone", "3rd"
    if (
      query.includes("third") ||
      query.includes("3rd") ||
      query.includes("మూడోది")
    ) {
      if (Array.isArray(this.state.pfzList) && this.state.pfzList.length >= 3) {
        this.state.selectedPFZ = this.state.pfzList[2];
        return { type: "PFZ_ORDINAL", resolvedPFZ: this.state.pfzList[2] };
      }
    }

    // 3. Proximity resolution: "closest", "nearest", "సమీపంలోని"
    if (
      query.includes("closest") ||
      query.includes("nearest") ||
      query.includes("సమీప")
    ) {
      if (Array.isArray(this.state.pfzList) && this.state.pfzList.length > 0) {
        const sorted = [...this.state.pfzList].sort(
          (a, b) =>
            Number(a.distanceKm ?? Infinity) - Number(b.distanceKm ?? Infinity),
        );
        this.state.selectedPFZ = sorted[0];
        return { type: "PFZ_CLOSEST", resolvedPFZ: sorted[0] };
      }
    }

    // 4. Pronoun resolution: "that zone", "there", "that place", "this zone"
    if (
      query.includes("there") ||
      query.includes("that zone") ||
      query.includes("that place") ||
      query.includes("this zone") ||
      query.includes("ఆ ప్రాంతం") ||
      query.includes("అక్కడ")
    ) {
      if (this.state.selectedPFZ) {
        return { type: "PFZ_PRONOUN", resolvedPFZ: this.state.selectedPFZ };
      }
    }

    // 5. Date resolution: "tomorrow", "రేపు"
    if (
      query.includes("tomorrow") ||
      query.includes("morning") ||
      query.includes("రేపు")
    ) {
      this.state.targetDate = this.getTomorrowDateString();
      return { type: "DATE_SHIFT", targetDate: this.state.targetDate };
    }

    return null;
  }

  /**
   * Updates state from executed tools and intent result
   */
  updateFromQueryAndIntent(intentResult, toolResults = {}) {
    if (intentResult.language) {
      this.state.language = intentResult.language;
    }

    // Capture location if detected
    if (intentResult.detectedLocation) {
      this.state.lastLocation = intentResult.detectedLocation;
    }

    // Capture PFZ list from getNearbyPFZ or rankPFZs
    const pfzData =
      toolResults.getNearbyPFZ?.data ||
      toolResults.rankPFZs?.data ||
      toolResults.getNearbyPFZ ||
      toolResults.rankPFZs;

    if (pfzData && Array.isArray(pfzData.pfzs) && pfzData.pfzs.length > 0) {
      this.state.pfzList = pfzData.pfzs;

      // Automatically select nearest PFZ if none selected
      if (!this.state.selectedPFZ) {
        const nearest = [...pfzData.pfzs].sort(
          (a, b) =>
            Number(a.distanceKm ?? Infinity) - Number(b.distanceKm ?? Infinity),
        )[0];

        this.state.selectedPFZ = nearest;
        this.state.destination = {
          name: nearest.name || nearest.landingCentre || nearest.id,
          lat: Number(nearest.latitude || nearest.lat),
          lon: Number(nearest.longitude || nearest.lon),
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

  /**
   * Appends a turn to conversation history
   */
  recordTurn(userQuery, responseObj) {
    this.state.conversationHistory.push({
      timestamp: new Date().toISOString(),
      userQuery,
      intent: responseObj.intent,
      recommendation: responseObj.recommendation,
      answer: responseObj.answer,
      selectedPFZ: this.state.selectedPFZ ? this.state.selectedPFZ.id : null,
    });
  }

  getContext() {
    return { ...this.state };
  }
}
