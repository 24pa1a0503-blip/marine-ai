const { calculateRisk } = require("../../risk-engine/riskCalculator");
const { createRiskGrid } = require("../../risk-engine/riskGrid");
const { getRiskCost } = require("../../risk-engine/riskCost");
const { optimizeRoute } = require("./routeOptimizer");

/**
 * Complete Marine Route Planning Pipeline
 *
 * Marine Conditions
 *      ↓
 * Risk Calculation
 *      ↓
 * Risk Grid
 *      ↓
 * Restricted Zones
 *      ↓
 * A* Route Optimization
 *      ↓
 * Explainable Safe Route
 */

function planMarineRoute({
  rows,
  cols,
  start,
  goal,
  marineConditions,
  hazardCells = [],
  restrictedCells = [],
  customRiskGrid = null,
}) {
  // ----------------------------------------
  // 1. Validate input
  // ----------------------------------------

  if (!rows || !cols || rows <= 0 || cols <= 0) {
    return {
      success: false,
      message: "Invalid grid dimensions",
    };
  }

  if (!start || !goal) {
    return {
      success: false,
      message: "Start and goal positions are required",
    };
  }

  if (!marineConditions) {
    return {
      success: false,
      message: "Marine conditions are required",
    };
  }

  // ----------------------------------------
  // 2. Calculate overall marine risk
  // ----------------------------------------

  const riskResult = calculateRisk(marineConditions);

  const overallRisk = {
    score: riskResult.score,
    level: riskResult.level,
    factors: riskResult.factors,
    riskCost: getRiskCost(riskResult.level),
  };

  // ----------------------------------------
  // 3. Create marine risk grid
  // ----------------------------------------

  const riskGridResult = customRiskGrid
  ? {
      grid: customRiskGrid,
      score: riskResult.score,
      level: riskResult.level,
      factors: riskResult.factors,
    }
  : createRiskGrid(
      rows,
      cols,
      marineConditions,
      hazardCells
    );

  // ----------------------------------------
  // 4. Optimize route using A*
  // ----------------------------------------

  const routeResult = optimizeRoute(
    riskGridResult.grid,
    start,
    goal,
    restrictedCells,
    overallRisk,
  );

  // ----------------------------------------
  // 5. Handle route failure
  // ----------------------------------------

  if (!routeResult.success) {
    return {
      success: false,
      message: routeResult.message,
      risk: overallRisk,
      riskGrid: riskGridResult.grid,
    };
  }

  // ----------------------------------------
  // 6. Return complete marine intelligence
  // ----------------------------------------

  return {
    success: true,

    risk: overallRisk,

    riskGrid: riskGridResult.grid,

    route: routeResult.route,

    distance: routeResult.distance,

    totalRiskCost: routeResult.totalRiskCost,

    totalCost: routeResult.totalCost,

    explanation: routeResult.explanation,

    avoidedHazards: routeResult.avoidedHazards,

    restrictedCells,

    marineConditions,
  };
}

module.exports = {
  planMarineRoute,
};
