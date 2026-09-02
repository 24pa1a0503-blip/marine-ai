const { optimizeRoute } = require("./routeOptimizer");

// ========================================
// MARINE RISK GRID
// ========================================

const grid = [
  //  LOW  LOW  LOW  LOW  LOW
  [1, 1, 1, 1, 1],

  //  LOW  HIGH HIGH HIGH LOW
  [1, 20, 20, 20, 1],

  //  LOW  HIGH HIGH HIGH LOW
  [1, 20, 50, 20, 1],

  //  LOW  HIGH HIGH HIGH LOW
  [1, 20, 20, 20, 1],

  //  LOW  LOW  LOW  LOW  LOW
  [1, 1, 1, 1, 1],
];

// ========================================
// START & DESTINATION
// ========================================

const start = {
  row: 0,
  col: 0,
};

const goal = {
  row: 4,
  col: 4,
};

// ========================================
// RESTRICTED CELLS
// ========================================

const restrictedCells = [{ row: 2, col: 0 }];

// ========================================
// OPTIMIZE ROUTE
// ========================================

const result = optimizeRoute(grid, start, goal, restrictedCells);

// ========================================
// DISPLAY RESULT
// ========================================

console.log("\n========== MARINE ROUTE RESULT ==========\n");

console.log("Success:", result.success);

console.log("Route:");

if (result.route) {
  result.route.forEach((cell, index) => {
    console.log(`${index + 1}. (${cell.row}, ${cell.col})`);
  });
}

console.log("\nDistance:", result.distance);

console.log("Total Risk Cost:", result.totalRiskCost);

console.log("Total Cost:", result.totalCost);

console.log("Risk Level:", result.riskLevel);

console.log("\n==========================================\n");
