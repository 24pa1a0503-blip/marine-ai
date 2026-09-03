const express = require("express");
const { getPFZ } = require("../controllers/pfzController");

const router = express.Router();

router.get("/", getPFZ);

module.exports = router;