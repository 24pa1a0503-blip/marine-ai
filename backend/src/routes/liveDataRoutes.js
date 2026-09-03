const express = require("express");

const {
  getWeather,
  getOcean,
  getWarnings,
} = require("../controllers/liveDataController");

const router = express.Router();

router.get("/weather", getWeather);
router.get("/ocean", getOcean);
router.get("/warnings", getWarnings);

module.exports = router;
