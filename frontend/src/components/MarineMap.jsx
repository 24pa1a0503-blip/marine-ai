import React, { useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, Polygon, Circle, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { GEOFENCE_ZONES } from '../gis/geofence';
import MapLegend from './MapLegend';

// Fix standard Leaflet default icon URL issues in Webpack/Vite
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
    iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
    shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

// Category Color Scheme Mapping
const CATEGORY_STYLES = {
    VERY_HIGH: {
        color: '#10b981', // Emerald Green
        fillColor: '#10b981',
        badgeBg: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40',
        badgeIcon: '🔥 VERY HIGH',
        heatRadiusMeters: 45000,
        emoji: '🟢'
    },
    HIGH: {
        color: '#f97316', // Orange / Coral
        fillColor: '#f97316',
        badgeBg: 'bg-orange-500/20 text-orange-300 border-orange-500/40',
        badgeIcon: '🟧 HIGH',
        heatRadiusMeters: 35000,
        emoji: '🟧'
    },
    MODERATE: {
        color: '#f59e0b', // Amber / Gold
        fillColor: '#f59e0b',
        badgeBg: 'bg-amber-500/20 text-amber-300 border-amber-500/40',
        badgeIcon: '🟡 MODERATE',
        heatRadiusMeters: 25000,
        emoji: '🟡'
    },
    LOW: {
        color: '#84cc16', // Lime Green
        fillColor: '#84cc16',
        badgeBg: 'bg-lime-500/20 text-lime-300 border-lime-500/40',
        badgeIcon: '🟢 LOW',
        heatRadiusMeters: 18000,
        emoji: '🟢'
    }
};

// Custom User Location Pin Icon (📍)
const userIcon = L.divIcon({
    className: 'custom-user-pin',
    html: `<div style="background-color: #ef4444; width: 30px; height: 30px; border-radius: 50%; border: 3px solid white; display: flex; align-items: center; justify-content: center; box-shadow: 0 0 15px rgba(239,68,68,0.8); font-size: 15px;">📍</div>`,
    iconSize: [30, 30],
    iconAnchor: [15, 15]
});

// Category-based Marker Icon Factory
const createPfzIcon = (category, isNearest) => {
    const style = CATEGORY_STYLES[category] || CATEGORY_STYLES.MODERATE;
    return L.divIcon({
        className: 'custom-pfz-pin',
        html: `<div style="background-color: ${style.color}; width: ${isNearest ? '34px' : '26px'}; height: ${isNearest ? '34px' : '26px'}; border-radius: 50%; border: 3px solid white; display: flex; align-items: center; justify-content: center; box-shadow: 0 0 ${isNearest ? '22px ' + style.color : '12px ' + style.color}; font-size: ${isNearest ? '16px' : '12px'}; color: white; font-weight: bold; transition: all 0.3s ease;">${isNearest ? '⭐' : style.emoji}</div>`,
        iconSize: isNearest ? [34, 34] : [26, 26],
        iconAnchor: isNearest ? [17, 17] : [13, 13]
    });
};

function MapRecenter({ center }) {
    const map = useMap();
    useEffect(() => {
        map.setView(center, map.getZoom());
    }, [center, map]);
    return null;
}

export default function MarineMap({
    userLocation,
    pfzList,
    nearestPfz,
    activeCategory,
    onSelectCategory,
    onSelectPfz
}) {
    const center = [userLocation.lat, userLocation.lon];

    // Polyline coordinates from User to Nearest PFZ
    const polylineCoords = nearestPfz ? [
        [userLocation.lat, userLocation.lon],
        [nearestPfz.latitude, nearestPfz.longitude]
    ] : [];

    return (
        <div className="w-full h-full relative rounded-2xl overflow-hidden shadow-2xl border border-slate-700">
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

                <MapRecenter center={center} />

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

                {/* PFZ HEATMAP CIRCLES & MARKERS */}
                {pfzList.map((pfz) => {
                    const isNearest = nearestPfz && nearestPfz.id === pfz.id;
                    const style = CATEGORY_STYLES[pfz.category] || CATEGORY_STYLES.MODERATE;

                    return (
                        <React.Fragment key={pfz.id}>
                            {/* Heatmap Intensity Circle Overlay */}
                            <Circle
                                center={[pfz.latitude, pfz.longitude]}
                                radius={style.heatRadiusMeters}
                                pathOptions={{
                                    color: style.color,
                                    fillColor: style.fillColor,
                                    fillOpacity: isNearest ? 0.25 : 0.15,
                                    weight: isNearest ? 2 : 1,
                                    dashArray: isNearest ? '6, 6' : undefined
                                }}
                            />

                            {/* Clickable Marker Pin */}
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

                                        <div className="flex items-center justify-between mb-2">
                                            <span className="text-xs text-slate-500 font-mono">ID: {pfz.id}</span>
                                            <span className={`text-[11px] font-bold px-2 py-0.5 rounded ${style.badgeBg}`}>
                                                {style.badgeIcon} ({pfz.pfz_score || 85}/100)
                                            </span>
                                        </div>

                                        <div className="grid grid-cols-2 gap-2 text-xs bg-slate-100 p-2 rounded-lg mb-2">
                                            <div>
                                                <span className="text-slate-500 text-[10px] block">Distance</span>
                                                <span className="font-bold text-teal-700">{pfz.distanceKm || '--'} km</span>
                                            </div>
                                            <div>
                                                <span className="text-slate-500 text-[10px] block">Heading</span>
                                                <span className="font-bold text-amber-700">{pfz.direction || '--'}</span>
                                            </div>
                                            <div>
                                                <span className="text-slate-500 text-[10px] block">SST</span>
                                                <span className="font-bold text-rose-600">{pfz.sst}°C</span>
                                            </div>
                                            <div>
                                                <span className="text-slate-500 text-[10px] block">Chlorophyll</span>
                                                <span className="font-bold text-emerald-600">{pfz.chlorophyll} mg/m³</span>
                                            </div>
                                            <div>
                                                <span className="text-slate-500 text-[10px] block">Ocean Depth</span>
                                                <span className="font-bold text-blue-700">{pfz.depth || 35} m</span>
                                            </div>
                                            <div>
                                                <span className="text-slate-500 text-[10px] block">Confidence</span>
                                                <span className="font-bold text-purple-700">{pfz.confidence}%</span>
                                            </div>
                                        </div>

                                        <p className="text-[11px] text-slate-600 italic bg-amber-50 p-1.5 rounded border border-amber-200 m-0">
                                            💡 {pfz.advisory || 'High potential fishing zone.'}
                                        </p>
                                    </div>
                                </Popup>
                            </Marker>
                        </React.Fragment>
                    );
                })}

                {/* DISTANCE POLYLINE TO NEAREST PFZ */}
                {polylineCoords.length > 0 && (
                    <Polyline
                        positions={polylineCoords}
                        pathOptions={{
                            color: '#10b981',
                            weight: 3,
                            dashArray: '8, 8',
                            opacity: 0.9
                        }}
                    />
                )}

                {/* GEOFENCE RESTRICTED POLYGONS */}
                {GEOFENCE_ZONES.map(zone => (
                    <Polygon
                        key={zone.id}
                        positions={zone.polygon}
                        pathOptions={{
                            color: zone.severity === 'CRITICAL' ? '#ef4444' : '#f59e0b',
                            fillColor: zone.severity === 'CRITICAL' ? '#ef4444' : '#f59e0b',
                            fillOpacity: 0.15,
                            weight: 2,
                            dashArray: '5, 5'
                        }}
                    >
                        <Popup>
                            <div className="p-1">
                                <h4 className="font-bold text-xs text-amber-600 mb-1">🛡️ {zone.name}</h4>
                                <p className="text-[11px] text-slate-600 m-0">{zone.description}</p>
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
