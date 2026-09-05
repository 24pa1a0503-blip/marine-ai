const express = require("express");

const {
  getWeather,
  getOcean,
  getWarnings,
  getWeatherForecast,
  getMarineForecast,
} = require("../controllers/liveDataController");

const router = express.Router();

router.get("/weather", getWeather);
router.get("/weather/forecast", getWeatherForecast);

router.get("/ocean", getOcean);
router.get("/ocean/forecast", getMarineForecast);

router.get("/warnings", getWarnings);

module.exports = router;
