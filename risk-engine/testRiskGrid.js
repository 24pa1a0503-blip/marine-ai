const { createRiskGrid } = require("./riskGrid");

// ========================================
// CALM MARINE CONDITIONS
// ========================================

const calmConditions = {
  wind: 10,
  waveHeight: 1,
  rainProbability: 10,
  lightning: 0,
  cyclone: false,
};

const calmResult = createRiskGrid(5, 5, calmConditions);

console.log("========== CALM RISK GRID ==========");
console.log("Risk Score:", calmResult.score);
console.log("Risk Level:", calmResult.level);
console.log("Factors:", calmResult.factors);
console.log("Grid:");
console.table(calmResult.grid);

// ========================================
// SEVERE MARINE CONDITIONS
// ========================================

const severeConditions = {
  wind: 45,
  waveHeight: 5,
  rainProbability: 95,
  lightning: 5,
  cyclone: true,
};

const severeResult = createRiskGrid(5, 5, severeConditions);

console.log("\n========== EXTREME RISK GRID ==========");
console.log("Risk Score:", severeResult.score);
console.log("Risk Level:", severeResult.level);
console.log("Factors:", severeResult.factors);
console.log("Grid:");
console.table(severeResult.grid);
