/**
 * Marine AI — Phase 3 Geofencing Automated Test Runner
 */
const {
    GEOFENCE_ZONES,
    checkPointGeofence,
    checkPFZsGeofence,
    checkRouteGeofence
} = require('./geofence');

console.log("=========================================");
console.log("🧪 PHASE 3 GEOFENCING AUTOMATED TEST RUNNER");
console.log("=========================================");

// 1. Verify Zone Categories Count
console.log(`\n1. Restricted Zones Defined: ${GEOFENCE_ZONES.length} zones`);
const categories = Array.from(new Set(GEOFENCE_ZONES.map(z => z.category)));
console.log(`   Categories: ${categories.join(', ')}`);

// 2. Test Point inside Coringa MPA (16.80, 82.35)
const t2 = checkPointGeofence(16.80, 82.35);
console.log(`\n2. Point Inside Coringa MPA Check:`);
console.log(`   Classification : ${t2.classification} (Expected: RESTRICTED)`);
console.log(`   Explanation    : ${t2.explanation}`);
const t2Passed = t2.classification === "RESTRICTED" && t2.isInside === true;

// 3. Test Point in Open Water (17.6868, 83.2185)
const t3 = checkPointGeofence(17.6868, 83.2185);
console.log(`\n3. Point in Open Water Check:`);
console.log(`   Classification : ${t3.classification}`);
console.log(`   Dist to Boundary: ${t3.nearestBoundaryDistanceKm.toFixed(1)} km to ${t3.nearestZoneName}`);
const t3Passed = t3.classification === "SAFE" || t3.classification === "CAUTION";

// 4. Test Route Intersect Check
const waypoints = [
    { lat: 16.98, lon: 82.24 },
    { lat: 16.80, lon: 82.35 }, // Crosses Coringa MPA
    { lat: 16.82, lon: 82.62 }
];
const t4 = checkRouteGeofence(waypoints);
console.log(`\n4. Route Crossing Restricted Zone Check:`);
console.log(`   Classification : ${t4.classification} (Expected: RESTRICTED)`);
console.log(`   Explanation    : ${t4.explanation}`);
const t4Passed = t4.classification === "RESTRICTED" && t4.crossesRestricted === true;

// 5. Test PFZ Safety Enrichment
const pfzList = [
    { id: "PFZ1", latitude: 16.80, longitude: 82.35 }, // Inside Coringa MPA
    { id: "PFZ2", latitude: 17.25, longitude: 83.45 }  // Safe Open Water
];
const enrichedPFZs = checkPFZsGeofence(pfzList);
console.log(`\n5. PFZ Geofence Safety Enrichment:`);
console.log(`   PFZ1 (Inside) : Classification=${enrichedPFZs[0].geofenceClassification}, isRestricted=${enrichedPFZs[0].isRestricted}`);
console.log(`   PFZ2 (Open)   : Classification=${enrichedPFZs[1].geofenceClassification}, isRestricted=${enrichedPFZs[1].isRestricted}`);
const t5Passed = enrichedPFZs[0].isRestricted === true && enrichedPFZs[1].isRestricted === false;

console.log("\n=========================================");
if (t2Passed && t3Passed && t4Passed && t5Passed) {
    console.log("🏆 ALL PHASE 3 GEOFENCING TESTS PASSED 100%!");
} else {
    console.log("⚠️ SOME TESTS FAILED.");
}
console.log("=========================================");
