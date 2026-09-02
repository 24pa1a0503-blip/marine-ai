import React, { useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, Polygon, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { GEOFENCE_ZONES } from '../gis/geofence';

// Fix standard Leaflet default icon URL issues in Webpack/Vite
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
    iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
    shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

// Custom User Location Pin Icon (📍)
const userIcon = L.divIcon({
    className: 'custom-user-pin',
    html: `<div style="background-color: #ef4444; width: 28px; height: 28px; border-radius: 50%; border: 3px solid white; display: flex; align-items: center; justify-content: center; box-shadow: 0 0 15px rgba(239,68,68,0.8); font-size: 14px;">📍</div>`,
    iconSize: [28, 28],
    iconAnchor: [14, 14]
});

// Custom PFZ Marker Icon (🟢)
const createPfzIcon = (isNearest) => L.divIcon({
    className: 'custom-pfz-pin',
    html: `<div style="background-color: ${isNearest ? '#10b981' : '#059669'}; width: ${isNearest ? '32px' : '24px'}; height: ${isNearest ? '32px' : '24px'}; border-radius: 50%; border: 3px solid white; display: flex; align-items: center; justify-content: center; box-shadow: 0 0 ${isNearest ? '20px #10b981' : '10px #059669'}; font-size: ${isNearest ? '16px' : '12px'}; transition: all 0.3s ease;">🟢</div>`,
    iconSize: isNearest ? [32, 32] : [24, 24],
    iconAnchor: isNearest ? [16, 16] : [12, 12]
});

function MapRecenter({ center }) {
    const map = useMap();
    useEffect(() => {
        map.setView(center, map.getZoom());
    }, [center, map]);
    return null;
}

export default function MarineMap({ userLocation, pfzList, nearestPfz, onSelectPfz }) {
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
                zoom={9}
                style={{ width: '100%', height: '100%', minHeight: '500px', backgroundColor: '#0f172a' }}
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
                            <h4 className="font-bold text-red-600 mb-1">📍 YOUR LOCATION (VESSEL)</h4>
                            <p className="text-xs text-slate-600 m-0">Lat: {userLocation.lat.toFixed(4)}</p>
                            <p className="text-xs text-slate-600 m-0">Lon: {userLocation.lon.toFixed(4)}</p>
                        </div>
                    </Popup>
                </Marker>

                {/* PFZ MARKERS */}
                {pfzList.map((pfz) => {
                    const isNearest = nearestPfz && nearestPfz.id === pfz.id;
                    return (
                        <Marker
                            key={pfz.id}
                            position={[pfz.latitude, pfz.longitude]}
                            icon={createPfzIcon(isNearest)}
                            eventHandlers={{
                                click: () => onSelectPfz && onSelectPfz(pfz)
                            }}
                        >
                            <Popup>
                                <div className="text-slate-900 font-sans p-1 max-w-xs">
                                    <div className="flex items-center gap-2 mb-1">
                                        <span className="font-bold text-emerald-600 text-sm">🟢 {pfz.id}</span>
                                        {isNearest && <span className="bg-emerald-100 text-emerald-800 text-[10px] px-2 py-0.5 rounded-full font-bold">NEAREST</span>}
                                    </div>
                                    <p className="text-xs text-slate-600 m-0"><strong>Distance:</strong> {pfz.distanceKm || '--'} km</p>
                                    <p className="text-xs text-slate-600 m-0"><strong>Direction:</strong> {pfz.direction || '--'}</p>
                                    <p className="text-xs text-slate-600 m-0"><strong>SST:</strong> {pfz.sst}°C</p>
                                    <p className="text-xs text-slate-600 m-0"><strong>Chlorophyll:</strong> {pfz.chlorophyll} mg/m³</p>
                                </div>
                            </Popup>
                        </Marker>
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
            </MapContainer>
        </div>
    );
}
