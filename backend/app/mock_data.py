"""
Enhanced Oceanographic & PFZ Dataset for India Coastal Waters (Bay of Bengal, Arabian Sea, Andaman)
Smart India Hackathon 2026 - Problem Statement 26176 (Day 2 Deliverable)
"""

BAY_OF_BENGAL_PFZS = [
    {
        "id": "PFZ-BOB-001",
        "name": "Kakinada Deep Sea Eddy",
        "latitude": 16.82,
        "longitude": 82.62,
        "pfz_score": 96,
        "category": "VERY_HIGH",
        "sst": 26.8,  # °C
        "chlorophyll": 2.85,  # mg/m³
        "depth": 45,  # meters
        "confidence": 95,
        "advisory": "Prime pelagic aggregation zone along thermal front.",
        "valid_until": "2026-09-04T18:00:00Z"
    },
    {
        "id": "PFZ-BOB-002",
        "name": "Visakhapatnam Shelf",
        "latitude": 17.25,
        "longitude": 83.45,
        "pfz_score": 84,
        "category": "HIGH",
        "sst": 27.1,
        "chlorophyll": 2.15,
        "depth": 62,
        "confidence": 88,
        "advisory": "Favourable coastal upwelling detected by satellite IR sensor.",
        "valid_until": "2026-09-04T18:00:00Z"
    },
    {
        "id": "PFZ-BOB-003",
        "name": "Gautami Godavari Estuary Outflow",
        "latitude": 16.45,
        "longitude": 82.35,
        "pfz_score": 68,
        "category": "MODERATE",
        "sst": 27.8,
        "chlorophyll": 1.45,
        "depth": 28,
        "confidence": 82,
        "advisory": "Moderate nutrient outflow from estuarine plume.",
        "valid_until": "2026-09-04T18:00:00Z"
    },
    {
        "id": "PFZ-BOB-004",
        "name": "Machilipatnam Offshore",
        "latitude": 15.90,
        "longitude": 81.65,
        "pfz_score": 42,
        "category": "LOW",
        "sst": 28.9,
        "chlorophyll": 0.85,
        "depth": 35,
        "confidence": 75,
        "advisory": "Low chlorophyll density; warmer surface water gradient.",
        "valid_until": "2026-09-04T18:00:00Z"
    },
    {
        "id": "PFZ-BOB-005",
        "name": "Puri Coastal Front",
        "latitude": 19.50,
        "longitude": 86.10,
        "pfz_score": 91,
        "category": "VERY_HIGH",
        "sst": 26.5,
        "chlorophyll": 3.10,
        "depth": 52,
        "confidence": 94,
        "advisory": "High sardine and mackerel productivity potential.",
        "valid_until": "2026-09-04T18:00:00Z"
    },
    {
        "id": "PFZ-AS-006",
        "name": "Kochi Coastal Ridge (Arabian Sea)",
        "latitude": 9.85,
        "longitude": 75.90,
        "pfz_score": 78,
        "category": "HIGH",
        "sst": 27.4,
        "chlorophyll": 1.95,
        "depth": 40,
        "confidence": 87,
        "advisory": "Strong monsoon upwelling zone.",
        "valid_until": "2026-09-04T18:00:00Z"
    }
]
