const {
  getPFZs,
  getPFZSourceStatus,
  getNearbyPFZs,
  rankPFZs,
} = require("../../services/pfzService");

async function getPFZ(req, res) {
  try {
    const category = req.query.category || "ALL";

    const validCategories = ["ALL", "VERY_HIGH", "HIGH", "MODERATE", "LOW"];

    const normalizedCategory = category.toUpperCase();

    if (!validCategories.includes(normalizedCategory)) {
      return res.status(400).json({
        success: false,
        error: "Invalid PFZ category",
        allowedCategories: validCategories,
      });
    }

    const pfzs = await getPFZs(normalizedCategory);
    const sourceStatus = await getPFZSourceStatus();

    res.json({
      success: true,
      count: pfzs.length,
      category: normalizedCategory,

      source: sourceStatus.source,
      status: sourceStatus.status,
      updatedAt: sourceStatus.updatedAt,

      pfzs,
    });
  } catch (error) {
    console.error("PFZ API error:", error);

    res.status(500).json({
      success: false,
      error: "Failed to retrieve PFZ data",
    });
  }
}

async function getNearbyPFZ(req, res) {
  try {
    const latitude = Number(req.query.latitude);
    const longitude = Number(req.query.longitude);
    const limit = Number(req.query.limit || 5);

    if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
      return res.status(400).json({
        success: false,
        error: "Valid latitude and longitude are required",
      });
    }

    const pfzs = await getNearbyPFZs(latitude, longitude, limit);

    const sourceStatus = await getPFZSourceStatus();

    res.json({
      success: true,

      userLocation: {
        latitude,
        longitude,
      },

      count: pfzs.length,

      source: sourceStatus.source,
      status: sourceStatus.status,
      updatedAt: sourceStatus.updatedAt,

      pfzs,
    });
  } catch (error) {
    console.error("Nearby PFZ API error:", error);

    res.status(500).json({
      success: false,
      error: "Failed to retrieve nearby PFZ data",
    });
  }
}

async function getRankedPFZ(req, res) {
  try {
    const latitude = Number(req.query.latitude);
    const longitude = Number(req.query.longitude);
    const limit = Number(req.query.limit || 5);

    if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
      return res.status(400).json({
        success: false,
        message: "Valid latitude and longitude are required",
      });
    }

    const pfzs = await rankPFZs(latitude, longitude, limit);

    const sourceStatus = await getPFZSourceStatus();

    return res.json({
      success: true,
      userLocation: {
        latitude,
        longitude,
      },
      count: pfzs.length,
      source: sourceStatus.source,
      status: sourceStatus.status,
      updatedAt: sourceStatus.updatedAt,
      rankingType: "AI_SUITABILITY",
      pfzs,
    });
  } catch (error) {
    console.error("Ranked PFZ error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to rank fishing zones",
      error: error.message,
    });
  }
}

module.exports = {
  getPFZ,
  getNearbyPFZ,
  getRankedPFZ,
};
