const express = require("express");

const router = express.Router();

const { optimizeRoute } = require("../services/routeOptimizer");

const { calculateRisk } = require("../../risk-engine/riskCalculator");

const { getRiskCost } = require("../../risk-engine/riskCost");

// ========================================
// POST /api/route/optimize
// ========================================

router.post("/optimize", (req, res) => {
  try {
    const {
      grid,
      start,
      goal,
      restrictedCells = [],
      marineConditions,
    } = req.body;

    // ========================================
    // VALIDATION
    // ========================================

    if (!grid || !start || !goal) {
      return res.status(400).json({
        success: false,
        message: "grid, start and goal are required",
      });
    }

    // ========================================
    // CALCULATE MARINE RISK
    // ========================================

    let marineRisk = null;

    if (marineConditions) {
      const risk = calculateRisk(marineConditions);

      marineRisk = {
        score: risk.score,
        level: risk.level,
        factors: risk.factors,
        riskCost: getRiskCost(risk.level),
      };
    }

    // ========================================
    // RUN A*
    // ========================================

    const result = optimizeRoute(
      grid,
      start,
      goal,
      restrictedCells,
      marineRisk,
    );

    // ========================================
    // RESPONSE
    // ========================================

    return res.json(result);
  } catch (error) {
    console.error("Route optimization error:", error);

    return res.status(500).json({
      success: false,
      message: "Route optimization failed",
      error: error.message,
    });
  }
});

module.exports = router;
