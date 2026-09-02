/**
 * Geofencing & Restricted Zone Data Structures
 * Smart India Hackathon 2026 - Problem Statement 26176
 */

export const GEOFENCE_ZONES = [
    {
        id: "IMBL_001",
        name: "International Maritime Boundary Line (IMBL - India/Sri Lanka)",
        type: "RESTRICTED",
        description: "Crossing this line enters Sri Lankan territorial waters.",
        polygon: [
            [9.85, 79.52],
            [9.50, 79.70],
            [9.15, 79.85],
            [8.80, 79.95]
        ],
        severity: "CRITICAL"
    },
    {
        id: "MPA_001",
        name: "Coringa Wildlife Sanctuary (Marine Protected Area)",
        type: "PROTECTED_ZONE",
        description: "Ecologically sensitive mangrove forest and estuarine turtle habitat.",
        polygon: [
            [16.85, 82.30],
            [16.85, 82.42],
            [16.70, 82.42],
            [16.70, 82.30]
        ],
        severity: "HIGH"
    },
    {
        id: "DANGER_ZONE_001",
        name: "Naval Firing & Defense Restricted Area",
        type: "RESTRICTED",
        description: "Active naval defense exercise area. All civilian fishing craft prohibited.",
        polygon: [
            [17.10, 83.40],
            [17.10, 83.60],
            [16.90, 83.60],
            [16.90, 83.40]
        ],
        severity: "HIGH"
    }
];

/**
 * Basic Point-in-Polygon check (Ray-Casting algorithm)
 * Can be extended for PostGIS / Turf.js integration on Day-2+
 */
export function isPointInPolygon(pointLat, pointLon, polygon) {
    let isInside = false;
    for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
        const xi = polygon[i][0], yi = polygon[i][1];
        const xj = polygon[j][0], yj = polygon[j][1];

        const intersect = ((yi > pointLon) !== (yj > pointLon)) &&
            (pointLat < (xj - xi) * (pointLon - yi) / (yj - yi) + xi);
        if (intersect) isInside = !isInside;
    }
    return isInside;
}
