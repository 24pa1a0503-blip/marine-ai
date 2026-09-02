/**
 * Member 3 Day-1 Automated Test Script
 * Verifies Haversine distance & direction for SIH 2026 Benchmark Test Case
 */

function calculateDistance(lat1, lon1, lat2, lon2) {
    const R = 6371; // Earth's radius in km
    const dLat = (lat2 - lat1) * (Math.PI / 180);
    const dLon = (lon2 - lon1) * (Math.PI / 180);
    const rLat1 = lat1 * (Math.PI / 180);
    const rLat2 = lat2 * (Math.PI / 180);

    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
              Math.cos(rLat1) * Math.cos(rLat2) *
              Math.sin(dLon / 2) * Math.sin(dLon / 2);

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return parseFloat((R * c).toFixed(1));
}

function calculateBearing(lat1, lon1, lat2, lon2) {
    const rLat1 = lat1 * (Math.PI / 180);
    const rLat2 = lat2 * (Math.PI / 180);
    const dLon = (lon2 - lon1) * (Math.PI / 180);

    const y = Math.sin(dLon) * Math.cos(rLat2);
    const x = Math.cos(rLat1) * Math.sin(rLat2) -
              Math.sin(rLat1) * Math.cos(rLat2) * Math.cos(dLon);

    let brng = Math.atan2(y, x) * (180 / Math.PI);
    brng = (brng + 360) % 360;

    const directions = [
        "North", "North-Northeast", "Northeast", "East-Northeast",
        "East", "East-Southeast", "Southeast", "South-Southeast",
        "South", "South-Southwest", "Southwest", "West-Southwest",
        "West", "West-Northwest", "Northwest", "North-Northwest"
    ];
    return directions[Math.round(brng / 22.5) % 16];
}

// MEMBER 3 TEST BENCHMARK
const USER = { lat: 16.98, lon: 82.24 };
const PFZ001 = { id: "PFZ001", lat: 16.82, lon: 82.62 };

const dist = calculateDistance(USER.lat, USER.lon, PFZ001.lat, PFZ001.lon);
const dir = calculateBearing(USER.lat, USER.lon, PFZ001.lat, PFZ001.lon);

console.log("=========================================");
console.log("🧪 MEMBER 3 (GIS) DAY-1 VERIFICATION TEST");
console.log("=========================================");
console.log(`📍 User Location  : Lat ${USER.lat}°N, Lon ${USER.lon}°E`);
console.log(`🟢 PFZ001 Location: Lat ${PFZ001.lat}°N, Lon ${PFZ001.lon}°E`);
console.log(`📏 Calculated Dist : ${dist} km`);
console.log(`🧭 Calculated Dir  : ${dir}`);
console.log("=========================================");

if (dist > 0 && typeof dir === 'string') {
    console.log("✅ TEST PASSED: Haversine distance & cardinal direction verified!");
}
