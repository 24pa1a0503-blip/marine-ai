/**
 * Spatial Queries Module
 * Smart India Hackathon 2026 - Problem Statement 26176
 */
import { calculateDistance, calculateBearing } from './distance.js';

/**
 * Finds the nearest Potential Fishing Zone (PFZ) from a user's location.
 *
 * @param {number} userLat 
 * @param {number} userLon 
 * @param {Array<Object>} pfzList 
 * @returns {Object|null} Object containing nearest PFZ details, distance, and direction
 */
export function findNearestPFZ(userLat, userLon, pfzList) {
    if (!pfzList || pfzList.length === 0) return null;

    let nearest = null;
    let minDistance = Infinity;

    const enrichedList = pfzList.map(pfz => {
        const dist = calculateDistance(userLat, userLon, pfz.latitude, pfz.longitude);
        const dir = calculateBearing(userLat, userLon, pfz.latitude, pfz.longitude);
        
        const pfzWithDist = {
            ...pfz,
            distanceKm: dist,
            direction: dir
        };

        if (dist < minDistance) {
            minDistance = dist;
            nearest = pfzWithDist;
        }

        return pfzWithDist;
    });

    return {
        nearest,
        allSorted: enrichedList.sort((a, b) => a.distanceKm - b.distanceKm)
    };
}

/**
 * Helper query to filter PFZs within a maximum radius (in kilometers).
 */
export function getPFZsWithinRadius(userLat, userLon, pfzList, maxRadiusKm) {
    const { allSorted } = findNearestPFZ(userLat, userLon, pfzList);
    return allSorted.filter(pfz => pfz.distanceKm <= maxRadiusKm);
}
