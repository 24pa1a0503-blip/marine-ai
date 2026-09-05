const express = require("express");

const {
  evaluateMarineAlerts,
  getAlerts,
  getAlertById,
  getHistory,
  clearAlertStore,
} = require("../controllers/alertController");

const router = express.Router();

// Evaluate supplied marine data
router.post("/evaluate", evaluateMarineAlerts);

// Active alerts
router.get("/", getAlerts);

// Alert history
router.get("/history", getHistory);

// Single alert
router.get("/:id", getAlertById);

// Development/testing only
router.delete("/dev/clear", clearAlertStore);

module.exports = router;