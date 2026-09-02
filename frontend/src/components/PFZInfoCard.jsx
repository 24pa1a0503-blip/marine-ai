import React from 'react';

/**
 * Enhanced Summary Badge Card for Selected / Nearest PFZ (Day 2 Deliverable)
 */
export default function PFZInfoCard({ nearestPfz, userLocation, onResetLocation }) {
    if (!nearestPfz) {
        return (
            <div className="bg-slate-900 text-slate-300 p-5 rounded-2xl shadow-xl border border-slate-800 animate-pulse">
                <p className="text-xs">Fetching satellite PFZ zones & ocean depth layers...</p>
            </div>
        );
    }

    const categoryBadge = {
        VERY_HIGH: { text: "🔥 VERY HIGH", color: "bg-emerald-500/20 text-emerald-300 border-emerald-500/40" },
        HIGH: { text: "🟧 HIGH", color: "bg-orange-500/20 text-orange-300 border-orange-500/40" },
        MODERATE: { text: "🟡 MODERATE", color: "bg-amber-500/20 text-amber-300 border-amber-500/40" },
        LOW: { text: "🟢 LOW", color: "bg-lime-500/20 text-lime-300 border-lime-500/40" }
    }[nearestPfz.category] || { text: "🟡 MODERATE", color: "bg-amber-500/20 text-amber-300 border-amber-500/40" };

    return (
        <div className="bg-slate-900/90 backdrop-blur-md text-white p-5 rounded-2xl shadow-2xl border border-teal-500/30 w-full">
            <div className="flex items-center justify-between mb-3">
                <span className={`font-semibold px-3 py-1 rounded-full text-xs border ${categoryBadge.color}`}>
                    {categoryBadge.text} (Score: {nearestPfz.pfz_score || 90}/100)
                </span>
                <span className="text-xs text-slate-400 font-mono">
                    ID: {nearestPfz.id}
                </span>
            </div>

            <h3 className="font-bold text-base text-slate-100 mb-2">{nearestPfz.name || `PFZ Zone ${nearestPfz.id}`}</h3>

            <div className="grid grid-cols-2 gap-3 my-3">
                <div className="bg-slate-800/80 p-3 rounded-xl border border-slate-700">
                    <span className="text-slate-400 text-xs block mb-1">Distance</span>
                    <span className="text-2xl font-extrabold text-teal-400">
                        {nearestPfz.distanceKm} <span className="text-sm font-normal text-slate-300">km</span>
                    </span>
                </div>
                <div className="bg-slate-800/80 p-3 rounded-xl border border-slate-700">
                    <span className="text-slate-400 text-xs block mb-1">Heading</span>
                    <span className="text-lg font-bold text-amber-400 flex items-center gap-1">
                        🧭 {nearestPfz.direction}
                    </span>
                </div>
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs bg-slate-800/50 p-3 rounded-xl border border-slate-700/60 mb-3">
                <div>
                    <span className="text-slate-400 block text-[10px]">SST Temp:</span>
                    <span className="font-semibold text-rose-400">{nearestPfz.sst}°C</span>
                </div>
                <div>
                    <span className="text-slate-400 block text-[10px]">Chlorophyll:</span>
                    <span className="font-semibold text-emerald-400">{nearestPfz.chlorophyll} mg/m³</span>
                </div>
                <div>
                    <span className="text-slate-400 block text-[10px]">Ocean Depth:</span>
                    <span className="font-semibold text-blue-400">{nearestPfz.depth || 35} m</span>
                </div>
                <div>
                    <span className="text-slate-400 block text-[10px]">Confidence:</span>
                    <span className="font-semibold text-purple-400">{nearestPfz.confidence}%</span>
                </div>
            </div>

            {nearestPfz.advisory && (
                <div className="text-[11px] bg-slate-950/60 text-slate-300 p-2.5 rounded-lg border border-slate-800 mb-3 italic">
                    💡 {nearestPfz.advisory}
                </div>
            )}

            <div className="flex items-center justify-between text-xs text-slate-400 border-t border-slate-800 pt-3">
                <span>📍 User Pos: ({userLocation.lat.toFixed(2)}°, {userLocation.lon.toFixed(2)}°)</span>
                <button
                    onClick={onResetLocation}
                    className="text-teal-400 hover:underline cursor-pointer font-medium"
                >
                    Reset Position
                </button>
            </div>
        </div>
    );
}
