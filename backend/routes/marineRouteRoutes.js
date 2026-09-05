const express = require("express");
const { planRoute } = require("../src/controllers/marineRouteController");

const router = express.Router();

router.post("/marine", planRoute);

module.exports = router;
