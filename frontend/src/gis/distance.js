/**
 * Distance & Bearing Calculation Utilities
 * Member 3 - GIS Module (SIH 2026 Problem ID: 26176)
 *
 * Standardizes API inputs as {lat, lon} and returns distance in kilometers.
 */

/**
 * Calculates Great-Circle distance using Haversine formula
 * @param {number} lat1 
 * @param {number} lon1 
 * @param {number} lat2 
 * @param {number} lon2 
 * @returns {number} Distance in km (rounded to 1 decimal)
 */
export function calculateDistance(lat1, lon1, lat2, lon2) {
    const R = 6371; // Earth radius in km
    const dLat = toRadians(lat2 - lat1);
    const dLon = toRadians(lon2 - lon1);

    const rLat1 = toRadians(lat1);
    const rLat2 = toRadians(lat2);

    const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(rLat1) * Math.cos(rLat2) *
        Math.sin(dLon / 2) * Math.sin(dLon / 2);

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return parseFloat((R * c).toFixed(1));
}

/**
 * Calculates navigational compass bearing from Point A to Point B
 */
export function calculateBearing(lat1, lon1, lat2, lon2) {
    const rLat1 = toRadians(lat1);
    const rLat2 = toRadians(lat2);
    const dLon = toRadians(lon2 - lon1);

    const y = Math.sin(dLon) * Math.cos(rLat2);
    const x = Math.cos(rLat1) * Math.sin(rLat2) -
              Math.sin(rLat1) * Math.cos(rLat2) * Math.cos(dLon);

    let brng = toDegrees(Math.atan2(y, x));
    brng = (brng + 360) % 360;

    const directions = [
        "North", "North-Northeast", "Northeast", "East-Northeast",
        "East", "East-Southeast", "Southeast", "South-Southeast",
        "South", "South-Southwest", "Southwest", "West-Southwest",
        "West", "West-Northwest", "Northwest", "North-Northwest"
    ];

    const index = Math.round(brng / 22.5) % 16;
    return directions[index];
}

/**
 * Calculates total route distance for an array of waypoint objects [{lat, lon}]
 */
export function calculateRouteTotalDistance(waypoints) {
    if (!waypoints || waypoints.length < 2) return 0;
    let total = 0;
    for (let i = 0; i < waypoints.length - 1; i++) {
        total += calculateDistance(
            waypoints[i].lat, waypoints[i].lon,
            waypoints[i+1].lat, waypoints[i+1].lon
        );
    }
    return parseFloat(total.toFixed(1));
}

function toRadians(degrees) {
    return degrees * (Math.PI / 180);
}

function toDegrees(radians) {
    return radians * (180 / Math.PI);
}
