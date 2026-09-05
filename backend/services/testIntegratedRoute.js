const { createRiskGrid } = require("../../risk-engine/riskGrid");
const { optimizeRoute } = require("./routeOptimizer");

// ========================================
// MARINE CONDITIONS
// ========================================

const marineConditions = {
  wind: 30,
  waveHeight: 3,
  rainProbability: 70,
  lightning: 2,
  cyclone: false,
};

// ========================================
// CREATE RISK GRID
// ========================================

const riskResult = createRiskGrid(5, 5, marineConditions, [
  {
    row: 2,
    col: 2,
    riskCost: 50,
  },
]);

console.log("========== MARINE RISK ==========");
console.log("Score:", riskResult.score);
console.log("Level:", riskResult.level);
console.log("Factors:", riskResult.factors);

console.log("\n========== RISK GRID ==========");
console.table(riskResult.grid);

// ========================================
// RESTRICTED ZONE
// ========================================

const restrictedCells = [
  {
    row: 1,
    col: 1,
  },
];

// ========================================
// RUN A*
// ========================================

const routeResult = optimizeRoute(
  riskResult.grid,
  { row: 0, col: 0 },
  { row: 4, col: 4 },
  restrictedCells,
);

// ========================================
// DISPLAY RESULT
// ========================================

console.log("\n========== A* ROUTE ==========");

console.log("Success:", routeResult.success);

if (routeResult.success) {
  console.log("Route:", routeResult.route);
  console.log("Distance:", routeResult.distance);
  console.log("Risk Cost:", routeResult.totalRiskCost);
  console.log("Total Cost:", routeResult.totalCost);
  console.log("Route Risk:", routeResult.riskLevel);
  console.log("Explanation:", routeResult.explanation);

  console.log("\nAvoided Hazards:");

  for (const hazard of routeResult.avoidedHazards) {
    console.log(`- ${hazard.type} at (${hazard.row}, ${hazard.col})`);
  }
} else {
  console.log("Message:", routeResult.message);
}
