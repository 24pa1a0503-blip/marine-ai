const { checkGeofence } = require("../../services/geofenceService");

function getCoordinates(req) {
  const latitude = Number(req.query.latitude ?? req.query.lat);

  const longitude = Number(req.query.longitude ?? req.query.lon);

  if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
    return null;
  }

  return { latitude, longitude };
}

function getGeofence(req, res) {
  try {
    const coordinates = getCoordinates(req);

    if (!coordinates) {
      return res.status(400).json({
        success: false,
        error: "Valid latitude and longitude are required",
      });
    }

    const result = checkGeofence(coordinates.latitude, coordinates.longitude);

    if (!result.success) {
      return res.status(400).json(result);
    }

    res.json(result);
  } catch (error) {
    console.error("Geofence API error:", error);

    res.status(500).json({
      success: false,
      error: "Failed to perform geofence check",
    });
  }
}

module.exports = {
  getGeofence,
};
