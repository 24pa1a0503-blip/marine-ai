import React from 'react';

/**
 * Summary badge card displaying details about the Nearest PFZ
 */
export default function PFZInfoCard({ nearestPfz, userLocation, onResetLocation }) {
    if (!nearestPfz) {
        return (
            <div className="bg-slate-800 text-slate-300 p-4 rounded-xl shadow-lg border border-slate-700">
                <p className="text-sm">Loading PFZ data or searching nearby ocean zones...</p>
            </div>
        );
    }

    return (
        <div className="bg-slate-900/90 backdrop-blur-md text-white p-5 rounded-2xl shadow-2xl border border-teal-500/30 max-w-md w-full">
            <div className="flex items-center justify-between mb-3">
                <span className="bg-teal-500/20 text-teal-300 font-semibold px-3 py-1 rounded-full text-xs border border-teal-500/40">
                    🟢 NEAREST PFZ DETECTED
                </span>
                <span className="text-xs text-slate-400 font-mono">
                    ID: {nearestPfz.id}
                </span>
            </div>

            <div className="grid grid-cols-2 gap-4 my-3">
                <div className="bg-slate-800/80 p-3 rounded-xl border border-slate-700">
                    <span className="text-slate-400 text-xs block mb-1">Distance</span>
                    <span className="text-2xl font-extrabold text-teal-400">
                        {nearestPfz.distanceKm} <span className="text-sm font-normal text-slate-300">km</span>
                    </span>
                </div>
                <div className="bg-slate-800/80 p-3 rounded-xl border border-slate-700">
                    <span className="text-slate-400 text-xs block mb-1">Direction</span>
                    <span className="text-lg font-bold text-amber-400 flex items-center gap-1">
                        🧭 {nearestPfz.direction}
                    </span>
                </div>
            </div>

            <div className="space-y-2 text-xs bg-slate-800/50 p-3 rounded-xl border border-slate-700/60 mb-4">
                <div className="flex justify-between">
                    <span className="text-slate-400">PFZ Coordinates:</span>
                    <span className="font-mono text-slate-200">{nearestPfz.latitude.toFixed(2)}°N, {nearestPfz.longitude.toFixed(2)}°E</span>
                </div>
                <div className="flex justify-between">
                    <span className="text-slate-400">Sea Surface Temp (SST):</span>
                    <span className="font-semibold text-rose-400">{nearestPfz.sst}°C</span>
                </div>
                <div className="flex justify-between">
                    <span className="text-slate-400">Chlorophyll-a:</span>
                    <span className="font-semibold text-emerald-400">{nearestPfz.chlorophyll} mg/m³</span>
                </div>
                <div className="flex justify-between">
                    <span className="text-slate-400">Fish Productivity Confidence:</span>
                    <span className="font-bold text-teal-300">{nearestPfz.confidence}%</span>
                </div>
            </div>

            <div className="flex items-center justify-between text-xs text-slate-400 border-t border-slate-800 pt-3">
                <span>📍 User at ({userLocation.lat.toFixed(2)}, {userLocation.lon.toFixed(2)})</span>
                <button
                    onClick={onResetLocation}
                    className="text-teal-400 hover:underline cursor-pointer font-medium"
                >
                    Reset Demo Pos
                </button>
            </div>
        </div>
    );
}
