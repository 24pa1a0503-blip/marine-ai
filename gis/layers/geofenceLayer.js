/**
 * Geofence Layer GeoJSON Generator
 * Converts restricted marine zones into GeoJSON FeatureCollection with [lon, lat] order.
 */

const { GEOFENCE_ZONES, DEMO_DISCLAIMER } = require('../geofence');

function createGeofenceGeoJSON() {
    const features = GEOFENCE_ZONES.map(zone => {
        // Convert [lat, lon] to [lon, lat] for GeoJSON standard
        const geoJsonCoords = zone.polygonLatLon.map(([lat, lon]) => [lon, lat]);

        // Ensure closed ring in GeoJSON polygon
        const first = geoJsonCoords[0];
        const last = geoJsonCoords[geoJsonCoords.length - 1];
        if (first[0] !== last[0] || first[1] !== last[1]) {
            geoJsonCoords.push([first[0], first[1]]);
        }

        return {
            type: "Feature",
            geometry: {
                type: "Polygon",
                coordinates: [geoJsonCoords]
            },
            properties: {
                id: zone.id,
                name: zone.name,
                category: zone.category,
                type: zone.type,
                severity: zone.severity,
                description: zone.description,
                reason: zone.reason,
                isDemoBoundary: true,
                disclaimer: DEMO_DISCLAIMER
            }
        };
    });

    return {
        type: "FeatureCollection",
        disclaimer: DEMO_DISCLAIMER,
        features
    };
}

module.exports = {
    createGeofenceGeoJSON
};
