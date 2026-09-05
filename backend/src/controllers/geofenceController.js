/**
 * Express Controller for Geofencing Services
 * Base URL: http://localhost:5000
 */
const {
    GEOFENCE_ZONES,
    checkPointGeofence,
    checkPFZsGeofence,
    checkRouteGeofence,
    DEMO_DISCLAIMER
} = require("../../../gis/geofence");

const { createGeofenceGeoJSON } = require("../../../gis/layers/geofenceLayer");

/**
 * GET /api/geofence
 * Returns all defined restricted marine zones, metadata & GeoJSON
 */
function getAllGeofences(req, res) {
    try {
        const geoJson = createGeofenceGeoJSON();
        res.json({
            status: "ok",
            count: GEOFENCE_ZONES.length,
            zones: GEOFENCE_ZONES,
            geoJson,
            disclaimer: DEMO_DISCLAIMER
        });
    } catch (error) {
        console.error("Geofence fetch error:", error);
        res.status(500).json({ error: "Failed to fetch geofence zones" });
    }
}

/**
 * POST /api/geofence/check
 * Performs point-in-polygon, distance-to-boundary, PFZ safety enrichment, or route intersection checks.
 *
 * Payload:
 * {
 *   "latitude": 17.6868,
 *   "longitude": 83.2185,
 *   "waypoints": [ { "lat": 16.98, "lon": 82.24 }, { "lat": 16.82, "lon": 82.62 } ],
 *   "pfzs": [ ... ]
 * }
 */
function checkGeofenceService(req, res) {
    try {
        const { latitude, longitude, waypoints, pfzs } = req.body;

        const lat = latitude !== undefined ? parseFloat(latitude) : 17.6868;
        const lon = longitude !== undefined ? parseFloat(longitude) : 83.2185;

        // 1. Point Geofence Check
        const pointAnalysis = checkPointGeofence(lat, lon);

        // 2. Route Intersect Check if waypoints provided
        let routeAnalysis = null;
        if (waypoints && Array.isArray(waypoints) && waypoints.length >= 2) {
            routeAnalysis = checkRouteGeofence(waypoints);
        }

        // 3. PFZ Geofence Enrichment if PFZs provided
        let pfzAnalysis = null;
        if (pfzs && Array.isArray(pfzs)) {
            pfzAnalysis = checkPFZsGeofence(pfzs);
        }

        // Overall classification
        let finalClassification = pointAnalysis.classification;
        if (routeAnalysis && routeAnalysis.crossesRestricted) {
            finalClassification = "RESTRICTED";
        }

        res.json({
            status: "ok",
            dataMode: "LIVE_GEOFENCE_ENGINE",
            classification: finalClassification, // SAFE | CAUTION | RESTRICTED
            pointCheck: pointAnalysis,
            routeCheck: routeAnalysis,
            pfzSafetyEnrichment: pfzAnalysis,
            explanation: pointAnalysis.explanation,
            disclaimer: DEMO_DISCLAIMER,
            generatedAt: new Date().toISOString()
        });
    } catch (error) {
        console.error("Geofence check error:", error);
        res.status(500).json({ error: "Failed to evaluate geofence safety" });
    }
}

module.exports = {
    getAllGeofences,
    checkGeofenceService
};
