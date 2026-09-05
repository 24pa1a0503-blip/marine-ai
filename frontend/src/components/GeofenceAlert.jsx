import React from 'react';

/**
 * GeofenceAlert Component
 * Renders warning alert banner when user position or planned vessel route breaches demo restricted zones.
 */
export default function GeofenceAlert({ geofenceStatus }) {
    if (!geofenceStatus || (geofenceStatus.status !== "BLOCKED" && geofenceStatus.status !== "ROUTE_HAZARD_WARNING")) {
        return null;
    }

    const isBlocked = geofenceStatus.status === "BLOCKED";

    return (
        <div className={`p-4 rounded-2xl shadow-2xl border backdrop-blur-md mb-4 text-white ${
            isBlocked
                ? 'bg-rose-950/90 border-rose-500/80 shadow-rose-500/20'
                : 'bg-amber-950/90 border-amber-500/80 shadow-amber-500/20'
        }`}>
            <div className="flex items-start gap-3">
                <div className="text-2xl p-2 rounded-xl bg-white/10">
                    {isBlocked ? '🛑' : '⚠️'}
                </div>
                <div className="flex-1">
                    <div className="flex items-center justify-between">
                        <h4 className="font-extrabold text-sm tracking-wide uppercase">
                            {isBlocked ? 'GEOFENCE RESTRICTED BREACH' : 'VESSEL ROUTE HAZARD WARNING'}
                        </h4>
                        <span className="text-[10px] font-mono bg-white/10 px-2 py-0.5 rounded border border-white/20">
                            DEMO BOUNDARY
                        </span>
                    </div>

                    <p className="text-xs text-slate-200 mt-1 font-medium leading-relaxed">
                        {geofenceStatus.warningMessage}
                    </p>

                    {geofenceStatus.triggerExplanation && (
                        <div className="mt-2 text-[11px] bg-black/40 p-2 rounded-lg border border-white/10 font-mono text-rose-200">
                            🚨 <span className="font-bold">Why Alert Triggered:</span> {geofenceStatus.triggerExplanation}
                        </div>
                    )}

                    <p className="text-[10px] text-slate-300 italic mt-2 border-t border-white/10 pt-1.5">
                        {geofenceStatus.disclaimer || '⚠️ Demo boundaries for SIH 2026 prototype. Non-official / Not for real navigation.'}
                    </p>
                </div>
            </div>
        </div>
    );
}
