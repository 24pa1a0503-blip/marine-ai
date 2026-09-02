const express = require("express");
const cors = require("cors");
require("dotenv").config();

const riskRoutes = require("./routes/riskRoutes");
const routeRoutes = require("../routes/routeRoutes");

const app = express();

app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 5000;

// ========================================
// HEALTH CHECK
// ========================================

app.get("/api/health", (req, res) => {
  res.json({
    status: "ok",
    message: "Marine AI backend is running",
  });
});

// ========================================
// MARINE RISK API
// ========================================

app.use("/api/marine", riskRoutes);

// ========================================
// ROUTE OPTIMIZATION API
// POST /api/route/optimize
// ========================================

app.use("/api/route", routeRoutes);

// ========================================
// START SERVER
// ========================================

app.listen(PORT, () => {
  console.log(`Marine AI backend running on port ${PORT}`);
});
