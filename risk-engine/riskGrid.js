const { calculateRisk } = require("./riskCalculator");
const { getRiskCost } = require("./riskCost");

// ========================================
// CONVERT MARINE CONDITIONS TO RISK GRID
// ========================================

function createRiskGrid(rows, cols, marineConditions, hazardCells = []) {
  const risk = calculateRisk(marineConditions);
  const riskCost = getRiskCost(risk.level);

  const grid = [];

  // Create base grid
  for (let row = 0; row < rows; row++) {
    const gridRow = [];

    for (let col = 0; col < cols; col++) {
      gridRow.push(riskCost);
    }

    grid.push(gridRow);
  }

  // Apply specific hazard cells
  for (const hazard of hazardCells) {
    if (
      hazard.row >= 0 &&
      hazard.row < rows &&
      hazard.col >= 0 &&
      hazard.col < cols
    ) {
      grid[hazard.row][hazard.col] = hazard.riskCost;
    }
  }

  return {
    grid,
    score: risk.score,
    level: risk.level,
    factors: risk.factors,
  };
}

module.exports = {
  createRiskGrid,
};
