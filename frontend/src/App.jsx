import React, { useState, useEffect, useCallback } from 'react';
import MarineMap from './components/MarineMap';
import PFZInfoCard from './components/PFZInfoCard';
import GeofenceAlert from './components/GeofenceAlert';
import { findNearestPFZ } from './gis/spatialQueries';
import { checkPointGeofence } from './gis/geofence';
import { createRouteGeoJSON } from './gis/layers/routeLayer';
import { createRiskGridGeoJSON } from './gis/layers/riskGridLayer';
import { runMustPassTests } from './gis/test_runner';

const FALLBACK_PFZS = [
    { id: "PFZ-BOB-001", name: "Kakinada Deep Sea Eddy", latitude: 16.82, longitude: 82.62, pfz_score: 96, category: "VERY_HIGH", sst: 26.8, chlorophyll: 2.85, depth: 45, confidence: 95, advisory: "Prime pelagic aggregation zone along thermal front." },
    { id: "PFZ-BOB-002", name: "Visakhapatnam Shelf", latitude: 17.25, longitude: 83.45, pfz_score: 84, category: "HIGH", sst: 27.1, chlorophyll: 2.15, depth: 62, confidence: 88, advisory: "Favourable coastal upwelling detected by satellite IR sensor." },
    { id: "PFZ-BOB-003", name: "Godavari Estuary Plume", latitude: 16.45, longitude: 82.35, pfz_score: 68, category: "MODERATE", sst: 27.8, chlorophyll: 1.45, depth: 28, confidence: 82, advisory: "Moderate nutrient outflow from estuarine plume." },
    { id: "PFZ-BOB-004", name: "Machilipatnam Offshore", latitude: 15.90, longitude: 81.65, pfz_score: 42, category: "LOW", sst: 28.9, chlorophyll: 0.85, depth: 35, confidence: 75, advisory: "Low chlorophyll density; warmer surface water gradient." }
];

export default function App() {
    const [userLocation, setUserLocation] = useState({ lat: 16.98, lon: 82.24 });
    const [pfzList, setPfzList] = useState([]);
    const [activeCategory, setActiveCategory] = useState("ALL");
    const [selectedPfz, setSelectedPfz] = useState(null);
    const [nearestData, setNearestData] = useState({ nearest: null, allSorted: [] });

    // Layer Toggles
    const [showGeofences, setShowGeofences] = useState(true);
    const [showRiskGrid, setShowRiskGrid] = useState(false);
    const [showRoute, setShowRoute] = useState(true);

    // Hazard Route Simulation State
    const [simulateHazardRoute, setSimulateHazardRoute] = useState(false);
    const [testResults, setTestResults] = useState(null);

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [isApiLive, setIsApiLive] = useState(false);

    // Fetch PFZ Data
    const fetchPFZData = useCallback(async (cat = activeCategory) => {
        setLoading(true);
        setError(null);
        try {
            const url = `http://localhost:8000/api/pfz?category=${cat}`;
            const response = await fetch(url);
            if (!response.ok) throw new Error(`HTTP status ${response.status}`);
            const data = await response.json();
            setPfzList(data.pfzs || []);
            setIsApiLive(true);
        } catch (err) {
            console.warn("Backend API offline, operating in cached GIS mode:", err.message);
            setError("Backend API offline. Operating in Cached Satellite GIS Mode.");
            setIsApiLive(false);
            if (cat && cat !== "ALL") {
                setPfzList(FALLBACK_PFZS.filter(p => p.category === cat));
            } else {
                setPfzList(FALLBACK_PFZS);
            }
        } finally {
            setLoading(false);
        }
    }, [activeCategory]);

    useEffect(() => {
        fetchPFZData(activeCategory);
    }, [activeCategory, fetchPFZData]);

    useEffect(() => {
        if (pfzList.length > 0) {
            const result = findNearestPFZ(userLocation.lat, userLocation.lon, pfzList);
            setNearestData(result);
        }
    }, [userLocation, pfzList]);

    // Check Geofence status for User Location
    const pointGeofenceCheck = checkPointGeofence(userLocation.lat, userLocation.lon);

    // Define Vessel Route Waypoints
    const targetPfz = selectedPfz || nearestData.nearest;
    const waypoints = simulateHazardRoute
        ? [
            { lat: userLocation.lat, lon: userLocation.lon },
            { lat: 16.80, lon: 82.35 }, // Passes inside Coringa MPA Restricted Zone!
            { lat: targetPfz?.latitude || 16.82, lon: targetPfz?.longitude || 82.62 }
        ]
        : targetPfz ? [
            { lat: userLocation.lat, lon: userLocation.lon },
            { lat: targetPfz.latitude, lon: targetPfz.longitude }
        ] : [];

    // Generate Route GeoJSON & Check Hazard Breaches
    const routeObj = createRouteGeoJSON(waypoints);

    // Generate Risk Grid GeoJSON for Member 4
    const riskGridGeoJSON = createRiskGridGeoJSON();

    // Determine Active Geofence Alert
    const activeGeofenceAlert = pointGeofenceCheck.isInside
        ? pointGeofenceCheck
        : routeObj.geofenceCheck;

    const handleRunTests = () => {
        const res = runMustPassTests();
        setTestResults(res);
    };

    return (
        <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
            {/* TOP HEADER */}
            <header className="bg-slate-900 border-b border-slate-800 px-6 py-4 flex flex-col sm:flex-row items-center justify-between shadow-xl gap-4">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-teal-500 to-cyan-600 flex items-center justify-center text-xl shadow-lg shadow-teal-500/20">
                        🌊
                    </div>
                    <div>
                        <h1 className="font-extrabold text-lg text-white tracking-wide">
                            SamudraDrishti <span className="text-xs bg-teal-500/20 text-teal-300 px-2 py-0.5 rounded border border-teal-500/30">SIH 2026</span>
                        </h1>
                        <p className="text-xs text-slate-400">GIS, GeoJSON & Geofencing Engine (Member 3 - Days 2-4 Completed)</p>
                    </div>
                </div>

                <div className="flex items-center gap-3 text-xs font-mono">
                    <span className={`px-3 py-1.5 rounded-xl border flex items-center gap-1.5 ${
                        isApiLive ? 'bg-emerald-950/60 border-emerald-500/40 text-emerald-300' : 'bg-amber-950/60 border-amber-500/40 text-amber-300'
                    }`}>
                        <span className={`w-2 h-2 rounded-full ${isApiLive ? 'bg-emerald-400 animate-ping' : 'bg-amber-400'}`}></span>
                        {isApiLive ? 'LIVE BACKEND API' : 'OFFLINE GIS MODE'}
                    </span>

                    <button
                        onClick={handleRunTests}
                        className="bg-purple-900/60 hover:bg-purple-800 text-purple-200 px-3 py-1.5 rounded-xl border border-purple-500/40 cursor-pointer font-sans transition-all flex items-center gap-1.5"
                    >
                        🧪 Run 5 Must-Pass Tests
                    </button>
                </div>
            </header>

            {/* ERROR BANNER */}
            {error && (
                <div className="bg-amber-900/40 border-b border-amber-500/30 px-6 py-2 flex items-center justify-between text-xs text-amber-200">
                    <span>⚠️ {error}</span>
                    <button onClick={() => fetchPFZData(activeCategory)} className="bg-amber-800/60 hover:bg-amber-700 text-amber-100 px-2 py-0.5 rounded cursor-pointer">
                        🔄 Retry API
                    </button>
                </div>
            )}

            {/* MAIN LAYOUT */}
            <main className="flex-1 p-6 grid grid-cols-1 lg:grid-cols-4 gap-6 max-w-7xl mx-auto w-full">
                {/* LEFT CONTROL PANEL */}
                <div className="lg:col-span-1 flex flex-col gap-4">
                    {/* GEOFENCE ALERT BANNER IF BREACHED */}
                    <GeofenceAlert geofenceStatus={activeGeofenceAlert} />

                    {/* LAYER TOGGLE CONTROLS */}
                    <div className="bg-slate-900/80 rounded-2xl p-4 border border-slate-800 shadow-lg">
                        <h3 className="font-bold text-xs uppercase tracking-wider text-slate-400 mb-3">
                            🗺️ Map GeoJSON Layer Controls
                        </h3>
                        <div className="space-y-2 text-xs">
                            <label className="flex items-center justify-between p-2 rounded-xl bg-slate-800/50 hover:bg-slate-800 cursor-pointer border border-slate-700/60">
                                <span className="flex items-center gap-2">🛡️ Restricted Geofences</span>
                                <input type="checkbox" checked={showGeofences} onChange={(e) => setShowGeofences(e.target.checked)} className="accent-teal-500" />
                            </label>
                            <label className="flex items-center justify-between p-2 rounded-xl bg-slate-800/50 hover:bg-slate-800 cursor-pointer border border-slate-700/60">
                                <span className="flex items-center gap-2">🧭 Vessel Route Polyline</span>
                                <input type="checkbox" checked={showRoute} onChange={(e) => setShowRoute(e.target.checked)} className="accent-teal-500" />
                            </label>
                            <label className="flex items-center justify-between p-2 rounded-xl bg-slate-800/50 hover:bg-slate-800 cursor-pointer border border-slate-700/60">
                                <span className="flex items-center gap-2">📊 Risk-Grid (Member 4)</span>
                                <input type="checkbox" checked={showRiskGrid} onChange={(e) => setShowRiskGrid(e.target.checked)} className="accent-teal-500" />
                            </label>
                        </div>

                        <div className="mt-3 pt-3 border-t border-slate-800">
                            <button
                                onClick={() => setSimulateHazardRoute(!simulateHazardRoute)}
                                className={`w-full py-2 px-3 rounded-xl border text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-2 ${
                                    simulateHazardRoute
                                        ? 'bg-rose-900/80 border-rose-500 text-rose-200'
                                        : 'bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700'
                                }`}
                            >
                                ⚡ {simulateHazardRoute ? 'Reset Safe Route' : 'Simulate Restricted Hazard Route'}
                            </button>
                        </div>
                    </div>

                    {/* MUST-PASS TEST RESULTS OVERLAY */}
                    {testResults && (
                        <div className="bg-slate-900/90 rounded-2xl p-4 border border-purple-500/40 shadow-xl">
                            <div className="flex items-center justify-between mb-2">
                                <h4 className="font-bold text-xs text-purple-300">🧪 MUST-PASS TEST RESULTS</h4>
                                <button onClick={() => setTestResults(null)} className="text-xs text-slate-400 hover:text-white">❌</button>
                            </div>
                            <div className="space-y-1.5 text-[11px]">
                                {testResults.map(t => (
                                    <div key={t.id} className={`p-1.5 rounded border ${t.passed ? 'bg-emerald-950/40 border-emerald-500/30 text-emerald-300' : 'bg-rose-950/40 border-rose-500/30 text-rose-300'}`}>
                                        <div className="font-bold">{t.passed ? '✅' : '❌'} {t.name}</div>
                                        <div className="text-[10px] text-slate-400">{t.detail}</div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* PFZ STATS CARD */}
                    <PFZInfoCard
                        nearestPfz={targetPfz}
                        userLocation={userLocation}
                        onResetLocation={() => { setUserLocation({ lat: 16.98, lon: 82.24 }); setSimulateHazardRoute(false); }}
                    />
                </div>

                {/* RIGHT MAP CANVAS */}
                <div className="lg:col-span-3 min-h-[550px]">
                    <MarineMap
                        userLocation={userLocation}
                        pfzList={nearestData.allSorted || []}
                        nearestPfz={nearestData.nearest}
                        activeCategory={activeCategory}
                        onSelectCategory={setActiveCategory}
                        onSelectPfz={(pfz) => setSelectedPfz(pfz)}
                        routeObj={routeObj}
                        riskGridGeoJSON={riskGridGeoJSON}
                        showRiskGrid={showRiskGrid}
                        showGeofences={showGeofences}
                        showRoute={showRoute}
                    />
                </div>
            </main>
        </div>
    );
}
