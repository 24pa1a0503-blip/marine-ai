const express = require("express");
const {
  getPFZ,
  getNearbyPFZ,
  getRankedPFZ,
} = require("../controllers/pfzController");

const router = express.Router();

router.get("/nearby", getNearbyPFZ);
router.get("/ranked", getRankedPFZ);
router.get("/", getPFZ);

module.exports = router;
