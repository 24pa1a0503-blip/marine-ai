# 🤝 Member 3 to Member 6 Handoff Documentation
### GIS / Map Developer — Day 2 PFZ Visualization Deliverable

This document details the GIS Map Component, API contracts, dependencies, and configuration required by **Member 6 (Integration Lead)** to integrate the PFZ GIS visualization into the main SamudraDrishti platform.

---

## 1. Components Provided

| Component Name | File Path | Description | Props Required |
| :--- | :--- | :--- | :--- |
| **`MarineMap`** | `frontend/src/components/MarineMap.jsx` | Full interactive Leaflet map canvas rendering user vessel pin, PFZ heat circles, category markers, connecting polyline, geofence polygons, and map legend. | `userLocation`, `pfzList`, `nearestPfz`, `activeCategory`, `onSelectCategory`, `onSelectPfz` |
| **`MapLegend`** | `frontend/src/components/MapLegend.jsx` | Floating map legend component displaying PFZ categories (Very High, High, Moderate, Low) & color swatches. | `activeCategory`, `onSelectCategory` |
| **`PFZInfoCard`** | `frontend/src/components/PFZInfoCard.jsx` | Sidebar badge card rendering selected/nearest PFZ score, depth, SST, chlorophyll, confidence, and heading. | `nearestPfz`, `userLocation`, `onResetLocation` |

---

## 2. GIS Utilities Provided

| Module | File Path | Main Exported Functions |
| :--- | :--- | :--- |
| **Distance Engine** | `frontend/src/gis/distance.js` | `calculateDistance(lat1, lon1, lat2, lon2)`, `calculateBearing(lat1, lon1, lat2, lon2)` |
| **Spatial Queries** | `frontend/src/gis/spatialQueries.js` | `findNearestPFZ(userLat, userLon, pfzList)`, `getPFZsWithinRadius(...)` |
| **Geofence Engine** | `frontend/src/gis/geofence.js` | `GEOFENCE_ZONES`, `isPointInPolygon(lat, lon, polygon)` |

---

## 3. Backend API Contract

### Endpoint: `GET /api/pfz`
Returns active PFZ zones. Supports optional category filtering.

**Query Parameters**:
- `category`: `ALL`, `VERY_HIGH`, `HIGH`, `MODERATE`, `LOW` (Optional)

**Sample JSON Response**:
```json
{
  "count": 5,
  "pfzs": [
    {
      "id": "PFZ-BOB-001",
      "name": "Kakinada Deep Sea Eddy",
      "latitude": 16.82,
      "longitude": 82.62,
      "pfz_score": 96,
      "category": "VERY_HIGH",
      "sst": 26.8,
      "chlorophyll": 2.85,
      "depth": 45,
      "confidence": 95,
      "advisory": "Prime pelagic aggregation zone along thermal front."
    }
  ]
}
```

---

## 4. Dependencies & Setup

Ensure the following NPM packages are installed in the `frontend` project:

```json
{
  "dependencies": {
    "leaflet": "^1.9.4",
    "react-leaflet": "^4.2.1"
  }
}
```

---

## 5. Definition of Done Verification Checklist

- [x] **PFZ areas visible on map**: Circle heatmaps and category markers rendered correctly.
- [x] **Clicking a zone shows details**: Popups render Score, Category, Depth, SST, Chlorophyll, Distance, and Direction.
- [x] **Map uses backend data**: Connects to `GET /api/pfz` with static fallback.
- [x] **Legend and loading/error states work**: Interactive `MapLegend` widget embedded on map; loading pulse & error banner supported.
