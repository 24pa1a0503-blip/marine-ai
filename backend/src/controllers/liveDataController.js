const { getWeatherConditions } = require("../../services/weatherService");
const { getMarineConditions } = require("../../services/marineDataService");
const { getMarineWarnings } = require("../../services/marineWarningService");

function getCoordinates(req) {
  const latitude = Number(req.query.latitude ?? req.query.lat);
  const longitude = Number(req.query.longitude ?? req.query.lon);

  if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
    return null;
  }

  return { latitude, longitude };
}

async function getWeather(req, res) {
  try {
    const coordinates = getCoordinates(req);

    if (!coordinates) {
      return res.status(400).json({
        success: false,
        error: "Valid latitude and longitude are required",
      });
    }

    const data = await getWeatherConditions(
      coordinates.latitude,
      coordinates.longitude,
    );

    res.json({
      success: true,
      ...data,
    });
  } catch (error) {
    console.error("Weather API error:", error);

    res.status(500).json({
      success: false,
      error: "Failed to retrieve live weather data",
    });
  }
}

async function getOcean(req, res) {
  try {
    const coordinates = getCoordinates(req);

    if (!coordinates) {
      return res.status(400).json({
        success: false,
        error: "Valid latitude and longitude are required",
      });
    }

    const data = await getMarineConditions(
      coordinates.latitude,
      coordinates.longitude,
    );

    res.json({
      success: true,
      ...data,
    });
  } catch (error) {
    console.error("Marine data API error:", error);

    res.status(500).json({
      success: false,
      error: "Failed to retrieve live marine data",
    });
  }
}

async function getWarnings(req, res) {
  try {
    const coordinates = getCoordinates(req);

    if (!coordinates) {
      return res.status(400).json({
        success: false,
        error: "Valid latitude and longitude are required",
      });
    }

    const data = await getMarineWarnings(
      coordinates.latitude,
      coordinates.longitude,
    );

    res.json({
      success: true,
      ...data,
    });
  } catch (error) {
    console.error("Marine warning API error:", error);

    res.status(500).json({
      success: false,
      error: "Failed to retrieve marine warning data",
    });
  }
}

module.exports = {
  getWeather,
  getOcean,
  getWarnings,
};
