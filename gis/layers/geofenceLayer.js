/**
 * Geofence Layer GeoJSON Generator
 * Converts demo restricted zones into GeoJSON FeatureCollection with [lon, lat] order.
 */
import { DEMO_GEOFENCE_ZONES, DEMO_DISCLAIMER } from '../geofence';

export function createGeofenceGeoJSON() {
    const features = DEMO_GEOFENCE_ZONES.map(zone => {
        // Convert [lat, lon] polygon to [lon, lat] for GeoJSON spec
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
                coordinates: [geoJsonCoords] // GeoJSON format: [[ [lon, lat], [lon, lat], ... ]]
            },
            properties: {
                id: zone.id,
                name: zone.name,
                type: zone.type,
                description: zone.description,
                severity: zone.severity,
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
