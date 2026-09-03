const express = require("express");
const cors = require("cors");
require("dotenv").config();
const fishingRouteRoutes = require("../routes/fishingRouteRoutes");
const marineRouteRoutes = require("../routes/marineRouteRoutes");
const riskRoutes = require("./routes/riskRoutes");
const pfzRoutes = require("./routes/pfzRoutes");
const routeRoutes = require("../routes/routeRoutes");
const sstRoutes = require("../routes/sstRoutes");
const liveDataRoutes = require("./routes/liveDataRoutes");
const geofenceRoutes = require("./routes/geofenceRoutes");
const marineAnalyzeRoutes = require("./routes/marineAnalyzeRoutes");
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
app.use("/api", liveDataRoutes);
app.use("/api/marine", riskRoutes);
app.use("/api/geofence", geofenceRoutes);
app.use("/api/marine/analyze", marineAnalyzeRoutes);

// ========================================
// SST API
// ========================================

app.use("/api/marine/sst", sstRoutes);
app.use("/api/pfz", pfzRoutes);
app.use("/api/route", marineRouteRoutes);
app.use("/api/fishing-route", fishingRouteRoutes);

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
