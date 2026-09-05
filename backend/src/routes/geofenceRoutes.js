/**
 * Express Routes for Geofencing Services
 */
const express = require("express");
const { getAllGeofences, getGeofence, checkGeofenceService } = require("../controllers/geofenceController");

const router = express.Router();

// GET /api/geofence
router.get("/", getAllGeofences);

// POST /api/geofence/check
router.post("/check", checkGeofenceService);

module.exports = router;
