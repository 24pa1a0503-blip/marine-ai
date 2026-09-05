const express = require("express");

const { getMarineSST } = require("../src/controllers/sstController");

const router = express.Router();

router.get("/", getMarineSST);

module.exports = router;
