/**
 * Marine AI — Phase 3 Geofencing & Boundary Intersection Engine (Frontend Export)
 * Smart India Hackathon 2026 - Problem Statement ID: 26176
 */

export const DEMO_DISCLAIMER = "⚠️ Demo boundaries for SIH 2026 prototype. Non-official / Not for real navigation.";

export const GEOFENCE_ZONES = [
    {
        id: "IMBL_SRI_LANKA",
        name: "International Maritime Boundary Line (India - Sri Lanka)",
        category: "IMBL_RESTRICTED",
        type: "RESTRICTED",
        severity: "CRITICAL",
        description: "Palk Strait & Gulf of Mannar International Border.",
        reason: "Prohibited: Entering Sri Lankan territorial waters. Fishing craft crossing this boundary are subject to detention by foreign coast guard authorities.",
        polygonLatLon: [
            [9.85, 79.52],
            [9.50, 79.70],
            [9.15, 79.85],
            [8.80, 79.95],
            [8.80, 79.40],
            [9.85, 79.40]
        ]
    },
    {
        id: "IMBL_PAKISTAN",
        name: "International Maritime Boundary Line (India - Pakistan)",
        category: "IMBL_RESTRICTED",
        type: "RESTRICTED",
        severity: "CRITICAL",
        description: "Sir Creek & Arabian Sea Maritime Border.",
        reason: "Prohibited: Border security zone. All civilian fishing craft prohibited from crossing IMBL.",
        polygonLatLon: [
            [23.60, 68.00],
            [23.50, 68.20],
            [23.00, 68.10],
            [22.80, 67.80],
            [23.60, 67.50]
        ]
    },
    {
        id: "MPA_CORINGA",
        name: "Coringa Wildlife Sanctuary (Marine Protected Area)",
        category: "PROTECTED_ZONE",
        type: "RESTRICTED",
        severity: "HIGH",
        description: "Ecologically sensitive mangrove & estuarine turtle sanctuary near Kakinada.",
        reason: "Prohibited: Protected mangrove ecosystem and Olive Ridley turtle breeding habitat. Commercial trawling and mechanized fishing strictly banned under Wildlife Protection Act.",
        polygonLatLon: [
            [16.85, 82.30],
            [16.85, 82.42],
            [16.70, 82.42],
            [16.70, 82.30]
        ]
    },
    {
        id: "MPA_GULF_OF_MANNAR",
        name: "Gulf of Mannar Biosphere Reserve & Marine National Park",
        category: "PROTECTED_ZONE",
        type: "RESTRICTED",
        severity: "HIGH",
        description: "Coral reef & Dugong marine national park sanctuary.",
        reason: "Prohibited: Coral reef protection zone. Commercial fishing and anchor dropping prohibited to protect endangered Dugong and marine flora.",
        polygonLatLon: [
            [9.25, 79.10],
            [9.25, 79.30],
            [9.00, 79.30],
            [9.00, 79.10]
        ]
    },
    {
        id: "NO_FISH_GAHIRMATHA",
        name: "Gahirmatha Turtle Sanctuary & No-Fishing Zone",
        category: "NO_FISHING_ZONE",
        type: "RESTRICTED",
        severity: "HIGH",
        description: "Odisha Coast Mass Olive Ridley Nesting Grounds.",
        reason: "Prohibited: Seasonal & permanent no-fishing zone declared to protect mass arribada nesting of Olive Ridley sea turtles.",
        polygonLatLon: [
            [20.75, 86.90],
            [20.75, 87.15],
            [20.40, 87.15],
            [20.40, 86.90]
        ]
    },
    {
        id: "SHIP_VISAKHAPATNAM",
        name: "Visakhapatnam Harbor Approach & Shipping Channel",
        category: "SHIPPING_CHANNEL",
        type: "CAUTION",
        severity: "MODERATE",
        description: "Active deep-water cargo & tanker vessel navigation channel.",
        reason: "Caution: High vessel collision risk. Fishing craft must maintain continuous watch and yield right-of-way to commercial cargo ships.",
        polygonLatLon: [
            [17.72, 83.28],
            [17.72, 83.42],
            [17.65, 83.42],
            [17.65, 83.28]
        ]
    },
    {
        id: "CYCLONE_HAZARD_BUFFER",
        name: "Active Storm / Cyclone High-Wave Hazard Zone",
        category: "CYCLONE_DANGER_ZONE",
        type: "RESTRICTED",
        severity: "CRITICAL",
        description: "IMD Severe Storm Warning Area with Wave Heights > 4.0m.",
        reason: "Prohibited: IMD severe storm alert active. High risk of vessel capsizing due to extreme wave height and storm surge.",
        polygonLatLon: [
            [18.20, 85.00],
            [18.20, 86.50],
            [16.80, 86.50],
            [16.80, 85.00]
        ]
    },
    {
        id: "NAVAL_DEFENSE_ZONE",
        name: "Eastern Naval Command Firing & Defense Exercise Zone",
        category: "TEMPORARY_HAZARD",
        type: "RESTRICTED",
        severity: "CRITICAL",
        description: "Active naval defense exercise and live firing zone.",
        reason: "Prohibited: Active naval defense exercise. All civilian fishing and transport vessels strictly prohibited from entering during exercise window.",
        polygonLatLon: [
            [17.10, 83.40],
            [17.10, 83.60],
            [16.90, 83.60],
            [16.90, 83.40]
        ]
    }
];

export const DEMO_GEOFENCE_ZONES = GEOFENCE_ZONES;

function calculateHaversineKm(lat1, lon1, lat2, lon2) {
    const R = 6371;
    const dLat = (lat2 - lat1) * (Math.PI / 180);
    const dLon = (lon2 - lon1) * (Math.PI / 180);
    const rLat1 = lat1 * (Math.PI / 180);
    const rLat2 = lat2 * (Math.PI / 180);

    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
              Math.cos(rLat1) * Math.cos(rLat2) *
              Math.sin(dLon / 2) * Math.sin(dLon / 2);

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return parseFloat((R * c).toFixed(2));
}

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

function getMinDistanceToPolygonKm(lat, lon, polygon) {
    let minDistance = Infinity;
    for (let i = 0; i < polygon.length; i++) {
        const pLat = polygon[i][0];
        const pLon = polygon[i][1];
        const dist = calculateHaversineKm(lat, lon, pLat, pLon);
        if (dist < minDistance) minDistance = dist;
    }
    return minDistance;
}

export function checkPointGeofence(lat, lon) {
    if (typeof lat === 'object' && lat !== null) {
        lon = lat.lon || lat.longitude;
        lat = lat.lat || lat.latitude;
    }

    lat = parseFloat(lat);
    lon = parseFloat(lon);

    let insideZones = [];
    let cautionZones = [];
    let minBoundaryDistanceKm = Infinity;
    let nearestZone = null;

    for (const zone of GEOFENCE_ZONES) {
        const inside = isPointInPolygon(lat, lon, zone.polygonLatLon);
        const distToBoundary = getMinDistanceToPolygonKm(lat, lon, zone.polygonLatLon);

        if (distToBoundary < minBoundaryDistanceKm) {
            minBoundaryDistanceKm = distToBoundary;
            nearestZone = zone;
        }

        if (inside) {
            insideZones.push(zone);
        } else if (distToBoundary <= 10.0 || zone.severity === "MODERATE") {
            cautionZones.push({ ...zone, distToBoundaryKm: distToBoundary });
        }
    }

    let classification = "SAFE";
    let severity = "NONE";
    let warningMessage = null;
    let explanation = "Point is in clear open waters, more than 10 km from restricted boundaries.";

    if (insideZones.length > 0) {
        classification = "RESTRICTED";
        const primaryBreach = insideZones[0];
        severity = primaryBreach.severity;
        warningMessage = `🛑 RESTRICTED: Inside ${primaryBreach.name}.`;
        explanation = primaryBreach.reason;
    } else if (cautionZones.length > 0) {
        classification = "CAUTION";
        const primaryCaution = cautionZones[0];
        severity = primaryCaution.severity;
        warningMessage = `⚠️ CAUTION: Within ${primaryCaution.distToBoundaryKm.toFixed(1)} km of ${primaryCaution.name}.`;
        explanation = `Caution advised: Point is ${primaryCaution.distToBoundaryKm.toFixed(1)} km from ${primaryCaution.name}. ${primaryCaution.description}`;
    }

    return {
        latitude: lat,
        longitude: lon,
        classification,
        status: classification === "RESTRICTED" ? "BLOCKED" : classification === "CAUTION" ? "CAUTION" : "ALLOWED",
        severity,
        isInside: insideZones.length > 0,
        breachedZones: insideZones,
        cautionZones,
        nearestZoneName: nearestZone ? nearestZone.name : "None",
        nearestBoundaryDistanceKm: minBoundaryDistanceKm === Infinity ? 0 : minBoundaryDistanceKm,
        warningMessage,
        explanation,
        disclaimer: DEMO_DISCLAIMER
    };
}

export function checkPFZsGeofence(pfzList) {
    if (!pfzList || !Array.isArray(pfzList)) return [];

    return pfzList.map(pfz => {
        const lat = pfz.latitude || pfz.lat;
        const lon = pfz.longitude || pfz.lon;
        const geoCheck = checkPointGeofence(lat, lon);

        return {
            ...pfz,
            geofenceClassification: geoCheck.classification,
            isRestricted: geoCheck.classification === "RESTRICTED",
            geofenceSeverity: geoCheck.severity,
            distanceToBoundaryKm: geoCheck.nearestBoundaryDistanceKm,
            geofenceExplanation: geoCheck.explanation,
            geofenceWarning: geoCheck.warningMessage
        };
    });
}

function segmentsIntersect(p1, p2, q1, q2) {
    function ccw(a, b, c) {
        return (c.lon - a.lon) * (b.lat - a.lat) > (b.lon - a.lon) * (c.lat - a.lat);
    }
    return (ccw(p1, q1, q2) !== ccw(p2, q1, q2)) && (ccw(p1, p2, q1) !== ccw(p1, p2, q2));
}

function lineIntersectsPolygon(p1, p2, polygon) {
    for (let i = 0; i < polygon.length; i++) {
        const q1 = { lat: polygon[i][0], lon: polygon[i][1] };
        const nextIdx = (i + 1) % polygon.length;
        const q2 = { lat: polygon[nextIdx][0], lon: polygon[nextIdx][1] };
        if (segmentsIntersect(p1, p2, q1, q2)) return true;
    }
    return false;
}

export function checkRouteGeofence(waypoints) {
    if (!waypoints || waypoints.length < 2) {
        return {
            classification: "SAFE",
            crossesRestricted: false,
            breachedZones: [],
            warningMessage: null,
            explanation: "Route contains fewer than 2 waypoints."
        };
    }

    const breachedMap = new Map();

    for (let i = 0; i < waypoints.length - 1; i++) {
        const p1 = waypoints[i];
        const p2 = waypoints[i + 1];

        for (const zone of GEOFENCE_ZONES) {
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
    const classification = crossesRestricted ? "RESTRICTED" : "SAFE";

    const explanation = crossesRestricted
        ? `Route Hazard Alert: Proposed route crosses ${breachedZones.length} restricted zone(s): ${breachedZones.map(z => z.name).join(', ')}. ${breachedZones[0].reason}`
        : "Route is 100% clear of all restricted marine zones.";

    return {
        classification,
        status: crossesRestricted ? "ROUTE_HAZARD_WARNING" : "ROUTE_SAFE",
        crossesRestricted,
        breachedZones,
        warningMessage: crossesRestricted ? `🛑 ROUTE HAZARD: Route enters ${breachedZones[0].name}.` : null,
        explanation,
        disclaimer: DEMO_DISCLAIMER
    };
}
