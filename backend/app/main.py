"""
FastAPI Server for SamudraDrishti Marine Intelligence Platform
Member 3 GIS / Spatial API (Day 2 Deliverable)
"""
from fastapi import FastAPI, Query, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from typing import Optional, List
from app.mock_data import BAY_OF_BENGAL_PFZS

app = FastAPI(
    title="SamudraDrishti Marine GIS API",
    version="2.0.0",
    description="Agentic AI Marine Intelligence Platform - Geospatial API Day 2"
)

# Enable CORS for React Frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
def read_root():
    return {
        "status": "online",
        "system": "SamudraDrishti Marine Intelligence Platform",
        "module": "Member 3 - GIS & PFZ Visualization API"
    }

@app.get("/api/health")
def health_check():
    return {"status": "ok", "message": "GIS Services Operational"}

@app.get("/api/pfz")
def get_all_pfzs(category: Optional[str] = Query(default=None, description="Filter by category: VERY_HIGH, HIGH, MODERATE, LOW")):
    """
    Returns all active Potential Fishing Zones (PFZs) with depth, SST, chlorophyll, score & category.
    """
    if category and category != "ALL":
        filtered = [pfz for pfz in BAY_OF_BENGAL_PFZS if pfz["category"] == category.upper()]
        return {"count": len(filtered), "pfzs": filtered}
    
    return {"count": len(BAY_OF_BENGAL_PFZS), "pfzs": BAY_OF_BENGAL_PFZS}

@app.get("/api/pfz/nearby")
def get_nearby_pfzs(
    lat: Optional[float] = Query(default=16.98, description="User Latitude"),
    lon: Optional[float] = Query(default=82.24, description="User Longitude"),
    category: Optional[str] = Query(default=None)
):
    """
    Returns active PFZs centered near user coordinate.
    """
    pfzs = BAY_OF_BENGAL_PFZS
    if category and category != "ALL":
        pfzs = [pfz for pfz in pfzs if pfz["category"] == category.upper()]

    return {
        "user_location": {"latitude": lat, "longitude": lon},
        "count": len(pfzs),
        "pfzs": pfzs
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
