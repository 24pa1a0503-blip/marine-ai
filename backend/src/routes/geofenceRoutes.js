const express = require("express");

const { getGeofence } = require("../controllers/geofenceController");

const router = express.Router();

router.get("/", getGeofence);

module.exports = router;
