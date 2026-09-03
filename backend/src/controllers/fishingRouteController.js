const { findBestFishingRoute } = require("../../services/fishingRouteService");

async function getFishingRoute(req, res) {
  try {
    const {
      latitude,
      longitude,
      rows = 5,
      cols = 5,
      hazardCells = [],
      restrictedCells = [],
    } = req.body;

    if (latitude === undefined || longitude === undefined) {
      return res.status(400).json({
        success: false,
        message: "Latitude and longitude are required",
      });
    }

    const result = await findBestFishingRoute({
      latitude,
      longitude,
      rows,
      cols,
      hazardCells,
      restrictedCells,
    });

    return res.json(result);
  } catch (error) {
    console.error("Fishing route error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to generate fishing route",
    });
  }
}

module.exports = {
  getFishingRoute,
};
