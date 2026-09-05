const express = require("express");
const cors = require("cors");
require("dotenv").config();

const riskRoutes = require("./routes/riskRoutes");
const geofenceRoutes = require("./routes/geofenceRoutes");
const marineAnalyzeRoutes = require("./routes/marineAnalyzeRoutes");
const alertRoutes = require("./routes/alertRoutes");
const pfzRoutes = require("./routes/pfzRoutes");

let liveDataRoutes, sstRoutes, marineRouteRoutes, fishingRouteRoutes, routeRoutes;

try { liveDataRoutes = require("./routes/liveDataRoutes"); } catch (e) {}
try { sstRoutes = require("./routes/sstRoutes"); } catch (e) {}
try { marineRouteRoutes = require("./routes/marineRouteRoutes"); } catch (e) {}
try { fishingRouteRoutes = require("./routes/fishingRouteRoutes"); } catch (e) {}
try { routeRoutes = require("./routes/routeRoutes"); } catch (e) {}
const app = express();

app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 5000;

// Health Check
app.get("/api/health", (req, res) => {
  res.json({
    status: "ok",
    message: "Marine AI backend is running",
    services: {
      risk: "active",
      geofence: "active",
      pfz: "active"
    }
  });
});

// Mount Routes
if (liveDataRoutes) app.use("/api", liveDataRoutes);
app.use("/api/marine", riskRoutes);
app.use("/api/marine/geofence", geofenceRoutes);

if (pfzRoutes) app.use("/api/pfz", pfzRoutes);
if (sstRoutes) app.use("/api/marine/sst", sstRoutes);
if (marineRouteRoutes) app.use("/api/route", marineRouteRoutes);
if (fishingRouteRoutes) app.use("/api/fishing-route", fishingRouteRoutes);
if (routeRoutes) app.use("/api/route", routeRoutes);
if (marineAnalyzeRoutes) app.use("/api/marine/analyze", marineAnalyzeRoutes);
if (alertRoutes) app.use("/api/alerts", alertRoutes);

// ========================================
// START SERVER
// ========================================

app.listen(PORT, () => {
  console.log(`Marine AI backend running on port ${PORT}`);
});
