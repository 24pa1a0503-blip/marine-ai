const { planMarineRoute } = require("./marineRouteService");

const marineConditions = {
  wind: 30,
  waveHeight: 3,
  rainProbability: 70,
  lightning: 2,
  cyclone: false,
};

const result = planMarineRoute({
  rows: 5,
  cols: 5,

  start: {
    row: 0,
    col: 0,
  },

  goal: {
    row: 4,
    col: 4,
  },

  marineConditions,

  hazardCells: [
    {
      row: 2,
      col: 2,
      riskCost: 50,
    },
  ],

  restrictedCells: [
    {
      row: 1,
      col: 1,
    },
  ],
});

console.log("\n========== MARINE ROUTE PLANNER ==========\n");

console.log("Success:", result.success);

console.log("\nMarine Risk:");
console.log("Score:", result.risk.score);
console.log("Level:", result.risk.level);
console.log("Factors:", result.risk.factors);

console.log("\nRisk Grid:");
console.table(result.riskGrid);

if (result.success) {
  console.log("\nOptimized Route:");
  result.route.forEach((cell, index) => {
    console.log(`${index + 1}. (${cell.row}, ${cell.col})`);
  });

  console.log("\nDistance:", result.distance);
  console.log("Total Risk Cost:", result.totalRiskCost);
  console.log("Total Cost:", result.totalCost);

  console.log("\nExplanation:");
  console.log(result.explanation);

  console.log("\nAvoided Hazards:");

  result.avoidedHazards.forEach((hazard) => {
    console.log(
      `- ${hazard.type} at (${hazard.row}, ${hazard.col})`
    );
  });
} else {
  console.log("\nRoute failed:");
  console.log(result.message);
}

console.log("\n===========================================\n");