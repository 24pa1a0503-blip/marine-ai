const { detectHazards } = require("../hazardDetector");

const {
  evaluateAlerts,
  getActiveAlerts,
  getAlertHistory,
  getAlert,
  clearAlerts,
} = require("../alertEngine");

function evaluateMarineAlerts(req, res) {
  try {
    const data = req.body || {};

    const latitude = Number(
      data.location?.latitude ?? data.latitude
    );

    const longitude = Number(
      data.location?.longitude ?? data.longitude
    );

    if (
      !Number.isFinite(latitude) ||
      !Number.isFinite(longitude)
    ) {
      return res.status(400).json({
        success: false,
        error: "Valid latitude and longitude are required",
      });
    }

    const hazards = detectHazards(data);

    const alerts = evaluateAlerts(
      hazards,
      { latitude, longitude },
      {
        dataMode: data.dataMode,
        sourceStatus: data.sourceStatus,
        source: "Marine AI",
      }
    );

    return res.json({
      success: true,
      location: {
        latitude,
        longitude,
      },
      hazardCount: hazards.length,
      alertCount: alerts.length,
      hazards,
      alerts,
      generatedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Alert evaluation error:", error);

    return res.status(500).json({
      success: false,
      error: "Failed to evaluate marine alerts",
      message: error.message,
    });
  }
}

function getAlerts(req, res) {
  const alerts = getActiveAlerts();

  return res.json({
    success: true,
    count: alerts.length,
    alerts,
    generatedAt: new Date().toISOString(),
  });
}

function getAlertById(req, res) {
  const alert = getAlert(req.params.id);

  if (!alert) {
    return res.status(404).json({
      success: false,
      error: "Alert not found",
    });
  }

  return res.json({
    success: true,
    alert,
  });
}

function getHistory(req, res) {
  const history = getAlertHistory();

  return res.json({
    success: true,
    count: history.length,
    alerts: history,
  });
}

function clearAlertStore(req, res) {
  clearAlerts();

  return res.json({
    success: true,
    message: "Alert store cleared",
  });
}

module.exports = {
  evaluateMarineAlerts,
  getAlerts,
  getAlertById,
  getHistory,
  clearAlertStore,
};