import React, { useState, useEffect, useCallback } from 'react';
import MarineMap from './components/MarineMap';
import PFZInfoCard from './components/PFZInfoCard';
import { findNearestPFZ } from './gis/spatialQueries';

// Static Fallback Dataset if Backend API is offline
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
    
    // Day 2 Requirement: Loading & Error States
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [isApiLive, setIsApiLive] = useState(false);

    // Fetch PFZ Data from Backend API /api/pfz or /api/pfz/nearby
    const fetchPFZData = useCallback(async (cat = activeCategory) => {
        setLoading(true);
        setError(null);
        try {
            const url = `http://localhost:8000/api/pfz?category=${cat}`;
            const response = await fetch(url);
            
            if (!response.ok) {
                throw new Error(`Server returned HTTP status ${response.status}`);
            }
            
            const data = await response.json();
            const fetched = data.pfzs || [];
            setPfzList(fetched);
            setIsApiLive(true);
        } catch (err) {
            console.warn("Backend API offline, loading verified GIS fallback data:", err.message);
            setError("Backend API offline. Operating in Cached Satellite Mode.");
            setIsApiLive(false);
            
            // Filter fallback data by category
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

    // Recalculate Nearest PFZ whenever user location or PFZ list changes
    useEffect(() => {
        if (pfzList.length > 0) {
            const result = findNearestPFZ(userLocation.lat, userLocation.lon, pfzList);
            setNearestData(result);
        } else {
            setNearestData({ nearest: null, allSorted: [] });
        }
    }, [userLocation, pfzList]);

    const handleCategoryChange = (category) => {
        setActiveCategory(category);
        setSelectedPfz(null);
    };

    const handleResetLocation = () => {
        setUserLocation({ lat: 16.98, lon: 82.24 });
    };

    const displayPfz = selectedPfz || nearestData.nearest;

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
                            SamudraDrishti <span className="text-xs bg-teal-500/20 text-teal-300 px-2 py-0.5 rounded border border-teal-500/30">SIH 2026 Day 2</span>
                        </h1>
                        <p className="text-xs text-slate-400">GIS & PFZ Intensity Visualization Engine (Member 3)</p>
                    </div>
                </div>

                {/* API STATUS & LOCATION BADGE */}
                <div className="flex items-center gap-3 text-xs font-mono">
                    <span className={`px-3 py-1.5 rounded-xl border flex items-center gap-1.5 ${
                        isApiLive ? 'bg-emerald-950/60 border-emerald-500/40 text-emerald-300' : 'bg-amber-950/60 border-amber-500/40 text-amber-300'
                    }`}>
                        <span className={`w-2 h-2 rounded-full ${isApiLive ? 'bg-emerald-400 animate-ping' : 'bg-amber-400'}`}></span>
                        {isApiLive ? 'LIVE BACKEND CONNECTED' : 'OFFLINE GIS MODE'}
                    </span>

                    <div className="bg-slate-800/80 px-3 py-1.5 rounded-xl border border-slate-700 text-teal-400 font-bold">
                        📍 Lat {userLocation.lat}°N, Lon {userLocation.lon}°E
                    </div>
                </div>
            </header>

            {/* ERROR BANNER IF API FAILED */}
            {error && (
                <div className="bg-amber-900/40 border-b border-amber-500/30 px-6 py-2 flex items-center justify-between text-xs text-amber-200">
                    <div className="flex items-center gap-2">
                        <span>⚠️ {error}</span>
                    </div>
                    <button
                        onClick={() => fetchPFZData(activeCategory)}
                        className="bg-amber-800/60 hover:bg-amber-700 text-amber-100 px-2.5 py-1 rounded border border-amber-600/50 cursor-pointer transition-all"
                    >
                        🔄 Retry API Connect
                    </button>
                </div>
            )}

            {/* MAIN CONTENT AREA */}
            <main className="flex-1 p-6 grid grid-cols-1 lg:grid-cols-4 gap-6 max-w-7xl mx-auto w-full">
                {/* LEFT CONTROL PANEL */}
                <div className="lg:col-span-1 flex flex-col gap-5">
                    {/* CATEGORY FILTER BUTTONS */}
                    <div className="bg-slate-900/80 rounded-2xl p-4 border border-slate-800 shadow-lg">
                        <h3 className="font-bold text-xs uppercase tracking-wider text-slate-400 mb-3">
                            Filter PFZ Categories
                        </h3>
                        <div className="grid grid-cols-2 gap-2 text-xs">
                            {[
                                { id: "ALL", label: "All Zones" },
                                { id: "VERY_HIGH", label: "🔥 Very High" },
                                { id: "HIGH", label: "🟧 High" },
                                { id: "MODERATE", label: "🟡 Moderate" },
                                { id: "LOW", label: "🟢 Low" }
                            ].map(cat => (
                                <button
                                    key={cat.id}
                                    onClick={() => handleCategoryChange(cat.id)}
                                    className={`py-2 px-2.5 rounded-xl border transition-all cursor-pointer text-center font-medium ${
                                        activeCategory === cat.id
                                            ? 'bg-teal-600 border-teal-400 text-white shadow-md'
                                            : 'bg-slate-800/60 border-slate-800 text-slate-300 hover:bg-slate-800'
                                    }`}
                                >
                                    {cat.label}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* PFZ INFO SUMMARY CARD */}
                    <PFZInfoCard
                        nearestPfz={displayPfz}
                        userLocation={userLocation}
                        onResetLocation={handleResetLocation}
                    />

                    {/* ACTIVE PFZ ZONES LIST */}
                    <div className="bg-slate-900/80 rounded-2xl p-4 border border-slate-800 shadow-lg flex-1">
                        <div className="flex items-center justify-between mb-3">
                            <h3 className="font-bold text-sm text-slate-200">
                                🟢 Visible PFZ Hotspots
                            </h3>
                            <span className="text-xs text-slate-400 font-mono">
                                {loading ? 'Loading...' : `${nearestData.allSorted?.length || 0} active`}
                            </span>
                        </div>

                        {loading ? (
                            <div className="py-8 text-center text-xs text-slate-400 animate-pulse">
                                🌊 Fetching satellite ocean data...
                            </div>
                        ) : (
                            <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                                {nearestData.allSorted?.map((pfz, idx) => {
                                    const isSelected = selectedPfz?.id === pfz.id || (!selectedPfz && idx === 0);
                                    return (
                                        <div
                                            key={pfz.id}
                                            onClick={() => setSelectedPfz(pfz)}
                                            className={`p-3 rounded-xl border transition-all text-xs cursor-pointer flex justify-between items-center ${
                                                isSelected
                                                    ? 'bg-teal-950/60 border-teal-500 text-teal-200 font-semibold shadow-md'
                                                    : 'bg-slate-800/40 border-slate-800 text-slate-300 hover:border-slate-700'
                                            }`}
                                        >
                                            <div>
                                                <div className="font-bold flex items-center gap-1">
                                                    <span>{pfz.name || pfz.id}</span>
                                                    {idx === 0 && <span className="text-[10px] bg-teal-500/30 text-teal-300 px-1.5 py-0.5 rounded">NEAREST</span>}
                                                </div>
                                                <div className="text-[11px] text-slate-400">
                                                    SST: {pfz.sst}°C | Chl: {pfz.chlorophyll} | Depth: {pfz.depth || 35}m
                                                </div>
                                            </div>
                                            <div className="text-right font-mono">
                                                <div className="text-teal-400 font-bold">{pfz.distanceKm} km</div>
                                                <div className="text-[10px] text-amber-400">{pfz.direction}</div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                </div>

                {/* RIGHT MAIN MAP CANVAS */}
                <div className="lg:col-span-3 min-h-[550px] relative">
                    <MarineMap
                        userLocation={userLocation}
                        pfzList={nearestData.allSorted || []}
                        nearestPfz={nearestData.nearest}
                        activeCategory={activeCategory}
                        onSelectCategory={handleCategoryChange}
                        onSelectPfz={(pfz) => setSelectedPfz(pfz)}
                    />
                </div>
            </main>
        </div>
    );
}
