/**
 * Route Layer GeoJSON Generator
 * Converts vessel navigation route waypoints into standard GeoJSON LineString [lon, lat]
 * and provides bounding box calculation for map fitBounds().
 */
import { checkRouteGeofence } from '../geofence';
import { calculateRouteTotalDistance } from '../distance';

export function createRouteGeoJSON(waypoints) {
    if (!waypoints || waypoints.length < 2) {
        return {
            geoJson: { type: "FeatureCollection", features: [] },
            bounds: null,
            geofenceCheck: { crossesRestricted: false, breachedZones: [], warningMessage: null }
        };
    }

    // Convert waypoints [{lat, lon}] to GeoJSON [lon, lat]
    const lineCoordinates = waypoints.map(p => [p.lon || p.longitude, p.lat || p.latitude]);

    // Check if route crosses demo restricted zones
    const geofenceCheck = checkRouteGeofence(waypoints);

    const routeFeature = {
        type: "Feature",
        geometry: {
            type: "LineString",
            coordinates: lineCoordinates
        },
        properties: {
            id: "PRIMARY_VESSEL_ROUTE",
            totalDistanceKm: calculateRouteTotalDistance(waypoints),
            crossesRestricted: geofenceCheck.crossesRestricted,
            status: geofenceCheck.status,
            warningMessage: geofenceCheck.warningMessage,
            color: geofenceCheck.crossesRestricted ? "#ef4444" : "#10b981" // Red if hazard breach, Green if safe
        }
    };

    // Calculate Bounding Box [[minLat, minLon], [maxLat, maxLon]] for map fitBounds()
    let minLat = Infinity, maxLat = -Infinity;
    let minLon = Infinity, maxLon = -Infinity;

    waypoints.forEach(p => {
        const lat = p.lat || p.latitude;
        const lon = p.lon || p.longitude;
        if (lat < minLat) minLat = lat;
        if (lat > maxLat) maxLat = lat;
        if (lon < minLon) minLon = lon;
        if (lon > maxLon) maxLon = lon;
    });

    const bounds = [
        [minLat, minLon],
        [maxLat, maxLon]
    ];

    return {
        geoJson: {
            type: "FeatureCollection",
            features: [routeFeature]
        },
        bounds,
        geofenceCheck
    };
}
