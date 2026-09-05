const express = require("express");
const cors = require("cors");
require("dotenv").config();

const riskRoutes = require("./routes/riskRoutes");
const geofenceRoutes = require("./routes/geofenceRoutes");

const app = express();

app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 5000;

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

// Mount Risk Routes
app.use("/api/marine", riskRoutes);

// Mount Geofence Routes
app.use("/api/geofence", geofenceRoutes);
app.use("/api/marine/geofence", geofenceRoutes);

app.listen(PORT, () => {
  console.log(`Marine AI backend running on port ${PORT}`);
});
