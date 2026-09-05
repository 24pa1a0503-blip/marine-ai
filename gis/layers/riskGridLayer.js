/**
 * Risk-Grid Layer Generator (For Member 4 Integration)
 * Generates a 0.25° x 0.25° spatial grid over coastal waters with risk scores (0-100).
 */

export function createRiskGridGeoJSON(minLat = 15.5, maxLat = 18.0, minLon = 81.5, maxLon = 84.0, step = 0.25) {
    const features = [];

    for (let lat = minLat; lat < maxLat; lat += step) {
        for (let lon = minLon; lon < maxLon; lon += step) {
            const cellLatMax = lat + step;
            const cellLonMax = lon + step;

            // Generate deterministic risk score based on coordinate math (mock ocean wave/wind model)
            const pseudoScore = Math.floor(
                (Math.sin(lat * 3.5) * 40 + Math.cos(lon * 2.8) * 40 + 50) % 100
            );

            let riskCategory = "LOW";
            let color = "#10b981"; // Green
            if (pseudoScore > 80) {
                riskCategory = "CRITICAL";
                color = "#ef4444"; // Red
            } else if (pseudoScore > 60) {
                riskCategory = "HIGH";
                color = "#f97316"; // Orange
            } else if (pseudoScore > 35) {
                riskCategory = "MODERATE";
                color = "#f59e0b"; // Yellow
            }

            // Polygon in GeoJSON order: [longitude, latitude]
            const polygonCoords = [
                [lon, lat],
                [cellLonMax, lat],
                [cellLonMax, cellLatMax],
                [lon, cellLatMax],
                [lon, lat]
            ];

            features.push({
                type: "Feature",
                geometry: {
                    type: "Polygon",
                    coordinates: [polygonCoords]
                },
                properties: {
                    gridId: `GRID_${lat.toFixed(2)}_${lon.toFixed(2)}`,
                    centerLat: lat + step / 2,
                    centerLon: lon + step / 2,
                    riskScore: pseudoScore,
                    riskCategory,
                    waveHeightM: (1.0 + (pseudoScore / 30)).toFixed(1),
                    windSpeedKnots: Math.floor(10 + (pseudoScore / 2)),
                    color
                }
            });
        }
    }

    return {
        type: "FeatureCollection",
        module: "Member 4 Risk-Engine Integration",
        features
    };
}
