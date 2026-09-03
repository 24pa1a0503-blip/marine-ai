const PFZ_DATA = [
  {
    id: "PFZ-BOB-001",
    name: "Kakinada Deep Sea Eddy",
    latitude: 16.82,
    longitude: 82.62,
    pfz_score: 96,
    category: "VERY_HIGH",
    sst: 26.8,
    chlorophyll: 2.85,
    depth: 45,
    confidence: 95,
    advisory: "Prime pelagic aggregation zone along thermal front."
  },
  {
    id: "PFZ-BOB-002",
    name: "Kakinada Coastal Front",
    latitude: 16.95,
    longitude: 82.48,
    pfz_score: 88,
    category: "HIGH",
    sst: 27.2,
    chlorophyll: 2.35,
    depth: 38,
    confidence: 89,
    advisory: "Strong chlorophyll concentration indicates good fishing potential."
  },
  {
    id: "PFZ-BOB-003",
    name: "Visakhapatnam Offshore Zone",
    latitude: 17.52,
    longitude: 83.35,
    pfz_score: 79,
    category: "HIGH",
    sst: 27.6,
    chlorophyll: 1.95,
    depth: 52,
    confidence: 84,
    advisory: "Moderate thermal gradient with elevated chlorophyll."
  },
  {
    id: "PFZ-BOB-004",
    name: "Machilipatnam Fishing Zone",
    latitude: 15.95,
    longitude: 81.35,
    pfz_score: 67,
    category: "MODERATE",
    sst: 28.1,
    chlorophyll: 1.55,
    depth: 32,
    confidence: 76,
    advisory: "Moderate fishing potential near coastal productivity zone."
  },
  {
    id: "PFZ-BOB-005",
    name: "Amalapuram Offshore Zone",
    latitude: 16.62,
    longitude: 82.15,
    pfz_score: 48,
    category: "LOW",
    sst: 28.7,
    chlorophyll: 0.95,
    depth: 28,
    confidence: 61,
    advisory: "Lower productivity compared with nearby thermal fronts."
  }
];

function getPFZs(category = "ALL") {
  if (!category || category.toUpperCase() === "ALL") {
    return PFZ_DATA;
  }

  return PFZ_DATA.filter(
    pfz => pfz.category === category.toUpperCase()
  );
}

module.exports = {
  getPFZs,
  PFZ_DATA
};