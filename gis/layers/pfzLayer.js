/**
 * PFZ Layer GeoJSON Generator
 * Standardizes API objects {lat, lon} into valid GeoJSON FeatureCollection with [lon, lat] order.
 */

export function createPFZGeoJSON(pfzList) {
    if (!pfzList || !Array.isArray(pfzList)) {
        return { type: "FeatureCollection", features: [] };
    }

    const features = pfzList.map(pfz => {
        const lon = pfz.longitude || pfz.lon;
        const lat = pfz.latitude || pfz.lat;

        return {
            type: "Feature",
            geometry: {
                type: "Point",
                coordinates: [lon, lat] // Strict GeoJSON format: [longitude, latitude]
            },
            properties: {
                id: pfz.id,
                name: pfz.name || `PFZ Zone ${pfz.id}`,
                score: pfz.pfz_score || 85,
                category: pfz.category || "MODERATE",
                sst: pfz.sst,
                chlorophyll: pfz.chlorophyll,
                depth: pfz.depth || 35,
                confidence: pfz.confidence || 85,
                advisory: pfz.advisory,
                distanceKm: pfz.distanceKm,
                direction: pfz.direction
            }
        };
    });

    return {
        type: "FeatureCollection",
        features
    };
}
