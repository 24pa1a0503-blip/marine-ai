const { getSST } = require("../../services/sstService");

async function getMarineSST(req, res) {
  try {
    const lat = Number(req.query.lat);
    const lon = Number(req.query.lon);

    if (!Number.isFinite(lat) || !Number.isFinite(lon)) {
      return res.status(400).json({
        success: false,
        error: "Valid lat and lon are required",
      });
    }

    const data = await getSST(lat, lon);

    res.json({
      success: true,
      data,
    });
  } catch (error) {
    console.error("SST API error:", error);

    res.status(500).json({
      success: false,
      error: "Failed to fetch SST data",
      details: error.message,
    });
  }
}

module.exports = {
  getMarineSST,
};
