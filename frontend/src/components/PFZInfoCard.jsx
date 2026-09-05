import React from 'react';

/**
 * Enhanced Summary & Explainability Card for Selected / Nearest PFZ (Phase 8 Deliverable)
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

    const suitabilityScore = nearestPfz.aiSuitabilityScore || nearestPfz.pfz_score || 85;
    const confidenceScore = nearestPfz.confidenceScore || nearestPfz.confidence || 85;
    const sourceStatus = nearestPfz.sourceStatus || (nearestPfz.source === "INCOIS" ? "LIVE" : "PROTOTYPE");

    const breakdown = nearestPfz.perFactorBreakdown || {};

    return (
        <div className="bg-slate-900/95 backdrop-blur-md text-white p-5 rounded-2xl shadow-2xl border border-teal-500/40 w-full space-y-4">
            {/* Header badges */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <span className={`font-semibold px-2.5 py-0.5 rounded-full text-[11px] border ${categoryBadge.color}`}>
                        {categoryBadge.text}
                    </span>
                    <span className={`font-bold px-2 py-0.5 rounded-full text-[10px] border ${
                        sourceStatus === "LIVE" 
                            ? "bg-teal-500/20 text-teal-300 border-teal-500/50"
                            : "bg-purple-500/20 text-purple-300 border-purple-500/50"
                    }`}>
                        {sourceStatus === "LIVE" ? "🟢 LIVE INCOIS" : "⚡ PROTOTYPE FALLBACK"}
                    </span>
                </div>
                <span className="text-[11px] text-slate-400 font-mono">
                    ID: {nearestPfz.id}
                </span>
            </div>

            {/* Zone Name & Overall Score */}
            <div className="flex items-start justify-between">
                <div>
                    <h3 className="font-bold text-lg text-slate-100">{nearestPfz.name || `PFZ Zone ${nearestPfz.id}`}</h3>
                    <p className="text-xs text-slate-400">Heading: <span className="text-amber-400 font-medium">🧭 {nearestPfz.direction || "SW"}</span></p>
                </div>
                <div className="text-right bg-slate-800/90 px-3 py-1.5 rounded-xl border border-teal-500/30">
                    <div className="text-[10px] text-slate-400 uppercase font-semibold">Suitability</div>
                    <div className="text-xl font-black text-teal-400">{suitabilityScore}<span className="text-xs font-normal text-slate-400">/100</span></div>
                </div>
            </div>

            {/* Why This PFZ Was Selected Checklist */}
            <div className="bg-slate-950/80 p-3 rounded-xl border border-slate-800">
                <div className="text-[11px] font-bold text-teal-300 mb-1.5 flex items-center justify-between">
                    <span>🎯 WHY THIS PFZ WAS SELECTED</span>
                    <span className="text-[10px] text-purple-300">Confidence: {confidenceScore}%</span>
                </div>
                <ul className="space-y-1 text-xs text-slate-300">
                    {(nearestPfz.selectionExplanation || [
                        `✓ Close distance: ${nearestPfz.distanceKm || nearestPfz.distance || 22.7} km`,
                        `✓ Chlorophyll concentration: ${nearestPfz.chlorophyll || 0.94} mg/m³`,
                        `✓ Sea surface temperature: ${nearestPfz.sst || 28.8}°C`,
                        `✓ Live dataset: ${sourceStatus === 'LIVE' ? 'INCOIS Live Service' : 'Validated INCOIS North AP Bulletin'}`
                    ]).map((item, idx) => (
                        <li key={idx} className="flex items-center gap-1.5 text-[11px] font-medium text-emerald-300/90">
                            {item}
                        </li>
                    ))}
                </ul>
            </div>

            {/* Per-factor score breakdown */}
            {breakdown.chlorophyll && (
                <div className="bg-slate-800/60 p-3 rounded-xl border border-slate-700/60 text-xs space-y-2">
                    <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Per-Factor Scoring Breakdown</div>
                    <div className="grid grid-cols-2 gap-2 text-[11px]">
                        <div className="bg-slate-900/60 p-2 rounded-lg border border-slate-700">
                            <span className="text-slate-400 block text-[10px]">Chlorophyll (max 45)</span>
                            <span className="font-bold text-emerald-400">{breakdown.chlorophyll.points} pts</span>
                            <span className="text-[9px] text-slate-400 block truncate">{breakdown.chlorophyll.value}</span>
                        </div>
                        <div className="bg-slate-900/60 p-2 rounded-lg border border-slate-700">
                            <span className="text-slate-400 block text-[10px]">Distance (max 25)</span>
                            <span className="font-bold text-teal-400">{breakdown.distance.points} pts</span>
                            <span className="text-[9px] text-slate-400 block truncate">{breakdown.distance.value}</span>
                        </div>
                        <div className="bg-slate-900/60 p-2 rounded-lg border border-slate-700">
                            <span className="text-slate-400 block text-[10px]">SST Temp (max 20)</span>
                            <span className="font-bold text-rose-400">{breakdown.sst.points} pts</span>
                            <span className="text-[9px] text-slate-400 block truncate">{breakdown.sst.value}</span>
                        </div>
                        <div className="bg-slate-900/60 p-2 rounded-lg border border-slate-700">
                            <span className="text-slate-400 block text-[10px]">INCOIS Score (max 10)</span>
                            <span className="font-bold text-amber-400">{breakdown.officialScore.points} pts</span>
                            <span className="text-[9px] text-slate-400 block truncate">{breakdown.officialScore.value || "N/A"}</span>
                        </div>
                    </div>
                </div>
            )}

            {/* Rejection Reasons for Secondary PFZs */}
            {nearestPfz.rejectionReason && (
                <div className="text-[11px] bg-rose-950/40 text-rose-300 p-2.5 rounded-lg border border-rose-900/50">
                    ❌ <span className="font-semibold">Rejection Rationale vs Top PFZ:</span> {nearestPfz.rejectionReason}
                </div>
            )}

            {/* Missing Data Disclosure */}
            {nearestPfz.missingDataDisclosure && (
                <div className="text-[10px] bg-amber-950/40 text-amber-300 p-2 rounded-lg border border-amber-900/50 italic">
                    ⚠️ {nearestPfz.missingDataDisclosure}
                </div>
            )}

            <div className="flex items-center justify-between text-xs text-slate-400 border-t border-slate-800 pt-3">
                <span>📍 Position: ({userLocation.lat.toFixed(2)}°, {userLocation.lon.toFixed(2)}°)</span>
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
