const express = require("express");

const { getMarineRisk } = require("../controllers/riskController");

const router = express.Router();

router.post("/risk", getMarineRisk);

module.exports = router;
