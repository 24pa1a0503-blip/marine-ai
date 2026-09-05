import React, { useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, Polygon, Circle, GeoJSON, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { DEMO_GEOFENCE_ZONES, DEMO_DISCLAIMER } from '../gis/geofence';
import MapLegend from './MapLegend';

// Fix standard Leaflet default icon URL issues
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
    iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
    shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

const CATEGORY_STYLES = {
    VERY_HIGH: { color: '#10b981', heatRadius: 45000, emoji: '🟢', badgeBg: 'bg-emerald-500/20 text-emerald-300' },
    HIGH: { color: '#f97316', heatRadius: 35000, emoji: '🟧', badgeBg: 'bg-orange-500/20 text-orange-300' },
    MODERATE: { color: '#f59e0b', heatRadius: 25000, emoji: '🟡', badgeBg: 'bg-amber-500/20 text-amber-300' },
    LOW: { color: '#84cc16', heatRadius: 18000, emoji: '🟢', badgeBg: 'bg-lime-500/20 text-lime-300' }
};

// Custom User Pin Icon (📍)
const userIcon = L.divIcon({
    className: 'custom-user-pin',
    html: `<div style="background-color: #ef4444; width: 30px; height: 30px; border-radius: 50%; border: 3px solid white; display: flex; align-items: center; justify-content: center; box-shadow: 0 0 15px rgba(239,68,68,0.8); font-size: 15px;">📍</div>`,
    iconSize: [30, 30],
    iconAnchor: [15, 15]
});

// Category-based Marker Icon
const createPfzIcon = (category, isNearest) => {
    const style = CATEGORY_STYLES[category] || CATEGORY_STYLES.MODERATE;
    return L.divIcon({
        className: 'custom-pfz-pin',
        html: `<div style="background-color: ${style.color}; width: ${isNearest ? '34px' : '26px'}; height: ${isNearest ? '34px' : '26px'}; border-radius: 50%; border: 3px solid white; display: flex; align-items: center; justify-content: center; box-shadow: 0 0 ${isNearest ? '22px ' + style.color : '12px ' + style.color}; font-size: ${isNearest ? '16px' : '12px'}; color: white; font-weight: bold;">${isNearest ? '⭐' : style.emoji}</div>`,
        iconSize: isNearest ? [34, 34] : [26, 26],
        iconAnchor: isNearest ? [17, 17] : [13, 13]
    });
};

// Fit Map View to Bounding Box
function MapFitBounds({ bounds }) {
    const map = useMap();
    useEffect(() => {
        if (bounds && bounds.length === 2) {
            map.fitBounds(bounds, { padding: [50, 50], maxZoom: 12 });
        }
    }, [bounds, map]);
    return null;
}

export default function MarineMap({
    userLocation,
    pfzList,
    nearestPfz,
    activeCategory,
    onSelectCategory,
    onSelectPfz,
    routeObj,
    riskGridGeoJSON,
    showRiskGrid,
    showGeofences,
    showRoute
}) {
    const center = [userLocation.lat, userLocation.lon];

    // Route coordinates for Polyline
    const polylineCoords = routeObj?.geoJson?.features?.[0]?.geometry?.coordinates?.map(
        ([lon, lat]) => [lat, lon]
    ) || (nearestPfz ? [[userLocation.lat, userLocation.lon], [nearestPfz.latitude, nearestPfz.longitude]] : []);

    const isRouteHazardous = routeObj?.geofenceCheck?.crossesRestricted;

    return (
        <div className="w-full h-full relative rounded-2xl overflow-hidden shadow-2xl border border-slate-700">
            {/* FLOATING DISCLAIMER BANNER */}
            <div className="absolute top-3 left-1/2 transform -translate-x-1/2 z-[1000] bg-slate-900/90 backdrop-blur-md px-4 py-1.5 rounded-full border border-amber-500/40 text-[11px] text-amber-300 shadow-xl flex items-center gap-2">
                <span>⚠️</span>
                <span>Demo boundaries for SIH 2026 prototype. Non-official / Not for real navigation.</span>
            </div>

            <MapContainer
                center={center}
                zoom={8}
                style={{ width: '100%', height: '100%', minHeight: '550px', backgroundColor: '#020617' }}
                scrollWheelZoom={true}
            >
                <TileLayer
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors & Dynamic Ocean Sat'
                    url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
                />

                {/* Auto Fit Bounds when Route updates */}
                {routeObj?.bounds && <MapFitBounds bounds={routeObj.bounds} />}

                {/* USER LOCATION MARKER */}
                <Marker position={center} icon={userIcon}>
                    <Popup>
                        <div className="text-slate-900 font-sans p-1">
                            <h4 className="font-bold text-red-600 text-sm mb-1">📍 YOUR FISHING VESSEL</h4>
                            <p className="text-xs text-slate-600 m-0">Lat: {userLocation.lat.toFixed(4)}°N</p>
                            <p className="text-xs text-slate-600 m-0">Lon: {userLocation.lon.toFixed(4)}°E</p>
                        </div>
                    </Popup>
                </Marker>

                {/* RISK-GRID GEOJSON LAYER (Member 4 Integration) */}
                {showRiskGrid && riskGridGeoJSON && (
                    <GeoJSON
                        data={riskGridGeoJSON}
                        style={(feature) => ({
                            color: feature.properties.color || '#10b981',
                            fillColor: feature.properties.color || '#10b981',
                            fillOpacity: 0.12,
                            weight: 1,
                            dashArray: '3, 3'
                        })}
                        onEachFeature={(feature, layer) => {
                            layer.bindPopup(`
                                <div class="p-1 text-slate-900">
                                    <h4 class="font-bold text-xs text-slate-800">📊 Risk Grid Cell (Member 4)</h4>
                                    <p class="text-xs text-slate-600 m-0"><strong>Grid ID:</strong> ${feature.properties.gridId}</p>
                                    <p class="text-xs text-slate-600 m-0"><strong>Risk Score:</strong> ${feature.properties.riskScore}/100 (${feature.properties.riskCategory})</p>
                                    <p class="text-xs text-slate-600 m-0"><strong>Wave Height:</strong> ${feature.properties.waveHeightM} m</p>
                                    <p class="text-xs text-slate-600 m-0"><strong>Wind Speed:</strong> ${feature.properties.windSpeedKnots} knots</p>
                                </div>
                            `);
                        }}
                    />
                )}

                {/* PFZ HEATMAP CIRCLES & MARKERS */}
                {pfzList.map((pfz) => {
                    const isNearest = nearestPfz && nearestPfz.id === pfz.id;
                    const style = CATEGORY_STYLES[pfz.category] || CATEGORY_STYLES.MODERATE;

                    return (
                        <React.Fragment key={pfz.id}>
                            <Circle
                                center={[pfz.latitude, pfz.longitude]}
                                radius={style.heatRadius}
                                pathOptions={{
                                    color: style.color,
                                    fillColor: style.color,
                                    fillOpacity: isNearest ? 0.25 : 0.15,
                                    weight: isNearest ? 2 : 1,
                                    dashArray: isNearest ? '6, 6' : undefined
                                }}
                            />

                            <Marker
                                position={[pfz.latitude, pfz.longitude]}
                                icon={createPfzIcon(pfz.category, isNearest)}
                                eventHandlers={{
                                    click: () => onSelectPfz && onSelectPfz(pfz)
                                }}
                            >
                                <Popup>
                                    <div className="text-slate-900 font-sans p-1.5 max-w-xs">
                                        <div className="flex items-center justify-between gap-2 mb-2 pb-1 border-b border-slate-200">
                                            <span className="font-extrabold text-slate-800 text-sm">{pfz.name || pfz.id}</span>
                                            {isNearest && (
                                                <span className="bg-emerald-100 text-emerald-800 text-[10px] px-2 py-0.5 rounded-full font-bold">
                                                    ⭐ NEAREST
                                                </span>
                                            )}
                                        </div>

                                        <div className="grid grid-cols-2 gap-2 text-xs bg-slate-100 p-2 rounded-lg mb-2">
                                            <div><span className="text-slate-500 text-[10px] block">Distance</span><span className="font-bold text-teal-700">{pfz.distanceKm || '--'} km</span></div>
                                            <div><span className="text-slate-500 text-[10px] block">Heading</span><span className="font-bold text-amber-700">{pfz.direction || '--'}</span></div>
                                            <div><span className="text-slate-500 text-[10px] block">SST</span><span className="font-bold text-rose-600">{pfz.sst}°C</span></div>
                                            <div><span className="text-slate-500 text-[10px] block">Chlorophyll</span><span className="font-bold text-emerald-600">{pfz.chlorophyll} mg/m³</span></div>
                                            <div><span className="text-slate-500 text-[10px] block">Ocean Depth</span><span className="font-bold text-blue-700">{pfz.depth || 35} m</span></div>
                                            <div><span className="text-slate-500 text-[10px] block">Confidence</span><span className="font-bold text-purple-700">{pfz.confidence}%</span></div>
                                        </div>

                                        {pfz.advisory && (
                                            <p className="text-[11px] text-slate-600 italic bg-amber-50 p-1.5 rounded border border-amber-200 m-0">
                                                💡 {pfz.advisory}
                                            </p>
                                        )}
                                    </div>
                                </Popup>
                            </Marker>
                        </React.Fragment>
                    );
                })}

                {/* ROUTE POLYLINE (GREEN IF SAFE, RED IF HAZARD) */}
                {showRoute && polylineCoords.length > 0 && (
                    <Polyline
                        positions={polylineCoords}
                        pathOptions={{
                            color: isRouteHazardous ? '#ef4444' : '#10b981',
                            weight: 4,
                            dashArray: isRouteHazardous ? '8, 8' : undefined,
                            opacity: 0.95
                        }}
                    />
                )}

                {/* DEMO GEOFENCE POLYGONS */}
                {showGeofences && DEMO_GEOFENCE_ZONES.map(zone => (
                    <Polygon
                        key={zone.id}
                        positions={zone.polygonLatLon}
                        pathOptions={{
                            color: zone.severity === 'CRITICAL' ? '#ef4444' : '#f59e0b',
                            fillColor: zone.severity === 'CRITICAL' ? '#ef4444' : '#f59e0b',
                            fillOpacity: 0.18,
                            weight: 2,
                            dashArray: '6, 6'
                        }}
                    >
                        <Popup>
                            <div className="p-1 max-w-xs text-slate-900">
                                <h4 className="font-bold text-xs text-amber-600 mb-1">🛡️ {zone.name}</h4>
                                <p className="text-[11px] text-slate-600 m-0 mb-1">{zone.description}</p>
                                <p className="text-[10px] text-amber-700 italic m-0 border-t pt-1">{DEMO_DISCLAIMER}</p>
                            </div>
                        </Popup>
                    </Polygon>
                ))}

                {/* FLOATING MAP LEGEND */}
                <MapLegend
                    activeCategory={activeCategory}
                    onSelectCategory={onSelectCategory}
                />
            </MapContainer>
        </div>
    );
}
