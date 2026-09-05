import React, { useState } from 'react';

/**
 * Complete Map Legend Component (Days 3 & 4 Deliverable)
 * Supports PFZ, Safe Route, Risk Grid, Hazard, and Restricted Demo Zones.
 */
export default function MapLegend({ activeCategory, onSelectCategory }) {
    const [collapsed, setCollapsed] = useState(false);

    const categories = [
        { id: "ALL", label: "All Categories", color: "bg-slate-400" },
        { id: "VERY_HIGH", label: "Very High (Score 90-100)", color: "bg-emerald-500" },
        { id: "HIGH", label: "High (Score 75-89)", color: "bg-orange-500" },
        { id: "MODERATE", label: "Moderate (Score 50-74)", color: "bg-amber-500" },
        { id: "LOW", label: "Low (Score < 50)", color: "bg-lime-500" },
    ];

    return (
        <div className="absolute bottom-6 right-6 z-[1000] bg-slate-900/95 backdrop-blur-md text-slate-100 p-4 rounded-2xl shadow-2xl border border-slate-700/80 max-w-xs transition-all duration-300">
            <div className="flex items-center justify-between gap-2 mb-2 pb-2 border-b border-slate-800">
                <div className="flex items-center gap-2">
                    <span className="text-base">🗺️</span>
                    <h4 className="font-bold text-xs tracking-wide uppercase text-slate-200">Marine Map Legend</h4>
                </div>
                <button
                    onClick={() => setCollapsed(!collapsed)}
                    className="text-xs text-slate-400 hover:text-white cursor-pointer px-1 py-0.5 rounded hover:bg-slate-800"
                >
                    {collapsed ? '➕' : '➖'}
                </button>
            </div>

            {!collapsed && (
                <div className="space-y-3">
                    {/* PFZ CATEGORIES */}
                    <div>
                        <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1.5">PFZ Heatmap Categories</span>
                        <div className="space-y-1">
                            {categories.map((cat) => (
                                <button
                                    key={cat.id}
                                    onClick={() => onSelectCategory && onSelectCategory(cat.id)}
                                    className={`w-full flex items-center justify-between text-left text-[11px] px-2 py-1 rounded border transition-all cursor-pointer ${
                                        activeCategory === cat.id
                                            ? 'bg-slate-800 border-teal-500 text-white font-semibold'
                                            : 'bg-slate-950/40 border-slate-800 text-slate-300 hover:bg-slate-800/50'
                                    }`}
                                >
                                    <div className="flex items-center gap-2">
                                        <span className={`w-2.5 h-2.5 rounded-full ${cat.color} inline-block`}></span>
                                        <span>{cat.label}</span>
                                    </div>
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* ROUTE & RISK SYMBOLS */}
                    <div className="pt-2 border-t border-slate-800 space-y-1.5 text-[11px]">
                        <span className="text-[10px] uppercase font-bold text-slate-400 block">Vessel Route & Hazards</span>
                        <div className="flex items-center justify-between text-slate-300">
                            <span className="flex items-center gap-1.5">
                                <span className="w-4 h-1 bg-emerald-500 rounded inline-block"></span> Safe Vessel Route
                            </span>
                        </div>
                        <div className="flex items-center justify-between text-slate-300">
                            <span className="flex items-center gap-1.5">
                                <span className="w-4 h-1 bg-rose-500 rounded border-dashed border-rose-300 inline-block"></span> Restricted Breach Route
                            </span>
                        </div>
                        <div className="flex items-center justify-between text-slate-300">
                            <span className="flex items-center gap-1.5">
                                <span className="w-3 h-3 rounded bg-amber-500/30 border border-amber-500 inline-block"></span> Risk-Grid Cell (Member 4)
                            </span>
                        </div>
                        <div className="flex items-center justify-between text-slate-300">
                            <span className="flex items-center gap-1.5">
                                <span className="w-3 h-3 rounded bg-rose-500/30 border border-rose-500 inline-block"></span> Restricted Demo Polygon
                            </span>
                        </div>
                    </div>

                    {/* DISCLAIMER FOOTER */}
                    <div className="pt-2 border-t border-slate-800 text-[9px] text-amber-300/80 italic leading-tight">
                        ⚠️ Demo boundaries for SIH 2026 prototype. Non-official / Not for real navigation.
                    </div>
                </div>
            )}
        </div>
    );
}
