/**
 * Haversine Distance & Bearing Calculation Module
 * Smart India Hackathon 2026 - Problem Statement 26176
 */

/**
 * Calculates the great-circle distance between two points on the Earth's surface
 * using the Haversine formula.
 *
 * @param {number} lat1 - User Latitude in degrees
 * @param {number} lon1 - User Longitude in degrees
 * @param {number} lat2 - Target (PFZ) Latitude in degrees
 * @param {number} lon2 - Target (PFZ) Longitude in degrees
 * @returns {number} Distance in kilometers (rounded to 1 decimal place)
 */
export function calculateDistance(lat1, lon1, lat2, lon2) {
    const R = 6371; // Earth's mean radius in kilometers

    const dLat = toRadians(lat2 - lat1);
    const dLon = toRadians(lon2 - lon1);

    const radLat1 = toRadians(lat1);
    const radLat2 = toRadians(lat2);

    const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(radLat1) * Math.cos(radLat2) *
        Math.sin(dLon / 2) * Math.sin(dLon / 2);

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    const distance = R * c;
    return parseFloat(distance.toFixed(1));
}

/**
 * Calculates compass bearing/direction from point 1 to point 2.
 *
 * @param {number} lat1 
 * @param {number} lon1 
 * @param {number} lat2 
 * @param {number} lon2 
 * @returns {string} Direction string (e.g. "N", "NE", "East", "Southeast", etc.)
 */
export function calculateBearing(lat1, lon1, lat2, lon2) {
    const radLat1 = toRadians(lat1);
    const radLat2 = toRadians(lat2);
    const dLon = toRadians(lon2 - lon1);

    const y = Math.sin(dLon) * Math.cos(radLat2);
    const x = Math.cos(radLat1) * Math.sin(radLat2) -
              Math.sin(radLat1) * Math.cos(radLat2) * Math.cos(dLon);

    let brng = Math.atan2(y, x);
    brng = toDegrees(brng);
    brng = (brng + 360) % 360; // Normalize to 0 - 360

    const compassDirections = [
        "North", "North-Northeast", "Northeast", "East-Northeast",
        "East", "East-Southeast", "Southeast", "South-Southeast",
        "South", "South-Southwest", "Southwest", "West-Southwest",
        "West", "West-Northwest", "Northwest", "North-Northwest"
    ];

    const index = Math.round(brng / 22.5) % 16;
    return compassDirections[index];
}

function toRadians(degrees) {
    return degrees * (Math.PI / 180);
}

function toDegrees(radians) {
    return radians * (180 / Math.PI);
}
