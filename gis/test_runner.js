/**
 * Member 3 Must-Pass Test Runner
 * Automated testing suite for 5 Must-Pass Benchmark Tests
 */
import { checkPointGeofence, checkRouteGeofence } from './geofence.js';
import { createPFZGeoJSON } from './layers/pfzLayer.js';
import { createRouteGeoJSON } from './layers/routeLayer.js';

export function runMustPassTests() {
    const results = [];

    // TEST 1: Inside Restricted Polygon -> Blocked/Warning
    // Point inside Coringa MPA (16.80, 82.35)
    const insideTest = checkPointGeofence(16.80, 82.35);
    const test1Passed = insideTest.isInside === true && insideTest.status === "BLOCKED";
    results.push({
        id: 1,
        name: "Inside Restricted Polygon -> Blocked",
        passed: test1Passed,
        detail: test1Passed ? "PASSED: Point (16.80, 82.35) correctly blocked." : `FAILED: ${insideTest.warningMessage}`
    });

    // TEST 2: Outside Polygon -> Allowed
    // Point outside all demo zones (16.98, 82.24)
    const outsideTest = checkPointGeofence(16.98, 82.24);
    const test2Passed = outsideTest.isInside === false && outsideTest.status === "ALLOWED";
    results.push({
        id: 2,
        name: "Outside Polygon -> Allowed",
        passed: test2Passed,
        detail: test2Passed ? "PASSED: Point (16.98, 82.24) correctly allowed." : "FAILED: Point falsely flagged as inside."
    });

    // TEST 3: Route Line Renders Correctly
    const sampleWaypoints = [{ lat: 16.98, lon: 82.24 }, { lat: 16.82, lon: 82.62 }];
    const routeObj = createRouteGeoJSON(sampleWaypoints);
    const test3Passed = routeObj.geoJson.features[0].geometry.type === "LineString";
    results.push({
        id: 3,
        name: "Route Line Renders Correctly",
        passed: test3Passed,
        detail: test3Passed ? "PASSED: GeoJSON LineString created successfully." : "FAILED: Route geometry invalid."
    });

    // TEST 4: PFZ Marker Appears at Correct Coordinate
    const samplePFZ = [{ id: "PFZ001", latitude: 16.82, longitude: 82.62 }];
    const pfzGeoJSON = createPFZGeoJSON(samplePFZ);
    const coord = pfzGeoJSON.features[0].geometry.coordinates;
    const test4Passed = coord[0] === 82.62 && coord[1] === 16.82;
    results.push({
        id: 4,
        name: "PFZ Marker Appears at Correct Coordinate",
        passed: test4Passed,
        detail: test4Passed ? "PASSED: Coordinates match (Lon 82.62, Lat 16.82)." : `FAILED: Got ${coord}`
    });

    // TEST 5: GeoJSON Coordinates are NOT Reversed
    // GeoJSON specification requires [longitude, latitude]
    const test5Passed = coord[0] === 82.62 && coord[1] === 16.82; // lon first!
    results.push({
        id: 5,
        name: "GeoJSON Coordinates Order [lon, lat]",
        passed: test5Passed,
        detail: test5Passed ? "PASSED: Longitude is first element in GeoJSON array." : "FAILED: Lat/Lon reversed!"
    });

    return results;
}
