/**
 * Geofencing & Boundary Intersection Engine
 * Member 3 - GIS Module (SIH 2026 Problem ID: 26176)
 *
 * NOTE: Demo boundaries for SIH 2026 prototype visualization.
 * Not official maritime/legal boundaries.
 */

export const DEMO_DISCLAIMER = "⚠️ Demo boundaries for SIH 2026 prototype. Non-official / Not for real navigation.";

export const DEMO_GEOFENCE_ZONES = [
    {
        id: "IMBL_001",
        name: "International Maritime Boundary Line (IMBL - India/Sri Lanka)",
        type: "RESTRICTED",
        description: "Crossing this line enters Sri Lankan territorial waters.",
        severity: "CRITICAL",
        isDemoBoundary: true,
        // Polygon coordinates in [lat, lon] for GIS check
        polygonLatLon: [
            [9.85, 79.52],
            [9.50, 79.70],
            [9.15, 79.85],
            [8.80, 79.95],
            [8.80, 79.50],
            [9.85, 79.50]
        ]
    },
    {
        id: "MPA_001",
        name: "Coringa Wildlife Sanctuary (Marine Protected Area)",
        type: "PROTECTED_ZONE",
        description: "Ecologically sensitive mangrove & turtle sanctuary. Commercial fishing prohibited.",
        severity: "HIGH",
        isDemoBoundary: true,
        polygonLatLon: [
            [16.85, 82.30],
            [16.85, 82.42],
            [16.70, 82.42],
            [16.70, 82.30]
        ]
    },
    {
        id: "DANGER_ZONE_001",
        name: "Naval Firing & Defense Restricted Area",
        type: "DEFENSE_RESTRICTED",
        description: "Active naval defense exercise area. All civilian craft prohibited.",
        severity: "CRITICAL",
        isDemoBoundary: true,
        polygonLatLon: [
            [17.10, 83.40],
            [17.10, 83.60],
            [16.90, 83.60],
            [16.90, 83.40]
        ]
    }
];

/**
 * Point-in-Polygon check (Ray-Casting Algorithm)
 * Accepts lat, lon (or object {lat, lon})
 */
export function checkPointGeofence(lat, lon) {
    if (typeof lat === 'object' && lat !== null) {
        lon = lat.lon || lat.longitude;
        lat = lat.lat || lat.latitude;
    }

    for (const zone of DEMO_GEOFENCE_ZONES) {
        if (isPointInPolygon(lat, lon, zone.polygonLatLon)) {
            return {
                isInside: true,
                status: "BLOCKED",
                zone: zone,
                warningMessage: `⚠️ GEOFENCE BREACH: Inside ${zone.name} (${zone.type}). ${zone.description}`,
                isDemoBoundary: true,
                disclaimer: DEMO_DISCLAIMER
            };
        }
    }

    return {
        isInside: false,
        status: "ALLOWED",
        zone: null,
        warningMessage: null,
        isDemoBoundary: true,
        disclaimer: DEMO_DISCLAIMER
    };
}

/**
 * Checks if a proposed vessel route (array of [{lat, lon}]) intersects any restricted polygon
 */
export function checkRouteGeofence(waypoints) {
    if (!waypoints || waypoints.length < 2) {
        return { crossesRestricted: false, breachedZones: [], warningMessage: null };
    }

    const breachedMap = new Map();

    for (let i = 0; i < waypoints.length - 1; i++) {
        const p1 = waypoints[i];
        const p2 = waypoints[i + 1];

        for (const zone of DEMO_GEOFENCE_ZONES) {
            // Check if end points or segment intersects polygon
            const p1Inside = isPointInPolygon(p1.lat, p1.lon, zone.polygonLatLon);
            const p2Inside = isPointInPolygon(p2.lat, p2.lon, zone.polygonLatLon);
            const intersects = lineIntersectsPolygon(p1, p2, zone.polygonLatLon);

            if (p1Inside || p2Inside || intersects) {
                breachedMap.set(zone.id, zone);
            }
        }
    }

    const breachedZones = Array.from(breachedMap.values());
    const crossesRestricted = breachedZones.length > 0;

    return {
        crossesRestricted,
        status: crossesRestricted ? "ROUTE_HAZARD_WARNING" : "ROUTE_SAFE",
        breachedZones,
        warningMessage: crossesRestricted
            ? `⚠️ HAZARD ALERT: Proposed route crosses ${breachedZones.length} restricted demo zone(s): ${breachedZones.map(z => z.name).join(', ')}.`
            : "✅ ROUTE SAFE: Route is clear of all demo restricted boundaries.",
        isDemoBoundary: true,
        disclaimer: DEMO_DISCLAIMER
    };
}

// Ray-Casting Point-in-Polygon helper
function isPointInPolygon(lat, lon, polygon) {
    let inside = false;
    for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
        const xi = polygon[i][0], yi = polygon[i][1];
        const xj = polygon[j][0], yj = polygon[j][1];

        const intersect = ((yi > lon) !== (yj > lon)) &&
            (lat < (xj - xi) * (lon - yi) / (yj - yi) + xi);
        if (intersect) inside = !inside;
    }
    return inside;
}

// Line segment intersection helper
function lineIntersectsPolygon(p1, p2, polygon) {
    for (let i = 0; i < polygon.length; i++) {
        const q1 = { lat: polygon[i][0], lon: polygon[i][1] };
        const nextIdx = (i + 1) % polygon.length;
        const q2 = { lat: polygon[nextIdx][0], lon: polygon[nextIdx][1] };

        if (segmentsIntersect(p1, p2, q1, q2)) {
            return true;
        }
    }
    return false;
}

function segmentsIntersect(p1, p2, q1, q2) {
    function ccw(a, b, c) {
        return (c.lon - a.lon) * (b.lat - a.lat) > (b.lon - a.lon) * (c.lat - a.lat);
    }
    return (ccw(p1, q1, q2) !== ccw(p2, q1, q2)) && (ccw(p1, p2, q1) !== ccw(p1, p2, q2));
}
