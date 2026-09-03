const express = require("express");

const { analyzeMarine } = require("../controllers/marineAnalyzeController");

const router = express.Router();

router.post("/", analyzeMarine);

module.exports = router;
