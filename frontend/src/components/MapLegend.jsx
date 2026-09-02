import React, { useState } from 'react';

/**
 * MapLegend Component - Day 2 Deliverable
 * Renders an interactive, floating map legend explaining PFZ Categories and colors.
 */
export default function MapLegend({ activeCategory, onSelectCategory }) {
    const [collapsed, setCollapsed] = useState(false);

    const categories = [
        { id: "ALL", label: "All Categories", color: "bg-slate-400", border: "border-slate-300" },
        { id: "VERY_HIGH", label: "Very High (Score 90-100)", color: "bg-emerald-500", border: "border-emerald-400", badge: "🔴" },
        { id: "HIGH", label: "High (Score 75-89)", color: "bg-orange-500", border: "border-orange-400", badge: "🟧" },
        { id: "MODERATE", label: "Moderate (Score 50-74)", color: "bg-amber-500", border: "border-amber-400", badge: "🟡" },
        { id: "LOW", label: "Low (Score < 50)", color: "bg-lime-500", border: "border-lime-400", badge: "🟢" },
    ];

    return (
        <div className="absolute bottom-6 right-6 z-[1000] bg-slate-900/90 backdrop-blur-md text-slate-100 p-4 rounded-2xl shadow-2xl border border-slate-700/80 max-w-xs transition-all duration-300">
            <div className="flex items-center justify-between gap-2 mb-2 pb-2 border-b border-slate-800">
                <div className="flex items-center gap-2">
                    <span className="text-base">🗺️</span>
                    <h4 className="font-bold text-xs tracking-wide uppercase text-slate-200">PFZ Heatmap Legend</h4>
                </div>
                <button
                    onClick={() => setCollapsed(!collapsed)}
                    className="text-xs text-slate-400 hover:text-white cursor-pointer px-1 py-0.5 rounded hover:bg-slate-800"
                >
                    {collapsed ? '➕' : '➖'}
                </button>
            </div>

            {!collapsed && (
                <>
                    <p className="text-[11px] text-slate-400 mb-3 leading-tight">
                        Layer represents satellite-derived potential fishing zones based on Sea Surface Temperature (SST) & Chlorophyll-a gradient.
                    </p>

                    <div className="space-y-1.5 mb-3">
                        {categories.map((cat) => {
                            const isSelected = activeCategory === cat.id;
                            return (
                                <button
                                    key={cat.id}
                                    onClick={() => onSelectCategory && onSelectCategory(cat.id)}
                                    className={`w-full flex items-center justify-between text-left text-xs px-2.5 py-1.5 rounded-lg border transition-all cursor-pointer ${
                                        isSelected
                                            ? 'bg-slate-800 border-teal-500 text-white font-semibold shadow-md'
                                            : 'bg-slate-950/40 border-slate-800 text-slate-300 hover:bg-slate-800/50'
                                    }`}
                                >
                                    <div className="flex items-center gap-2">
                                        <span className={`w-3 h-3 rounded-full ${cat.color} inline-block shadow-sm`}></span>
                                        <span>{cat.label}</span>
                                    </div>
                                    {isSelected && <span className="text-[10px] text-teal-400 font-bold">ACTIVE</span>}
                                </button>
                            );
                        })}
                    </div>

                    <div className="pt-2 border-t border-slate-800 flex items-center justify-between text-[10px] text-slate-400 font-mono">
                        <span className="flex items-center gap-1">
                            <span className="w-2 h-2 rounded-full bg-red-500 inline-block"></span> IMBL Border
                        </span>
                        <span className="flex items-center gap-1">
                            <span className="w-2 h-2 rounded-full bg-amber-500 inline-block"></span> Restricted Zone
                        </span>
                    </div>
                </>
            )}
        </div>
    );
}
