const express = require("express");
const cors = require("cors");
require("dotenv").config();

const riskRoutes = require("./routes/riskRoutes");
const app = express();

app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 5000;

app.get("/api/health", (req, res) => {
  res.json({
    status: "ok",
    message: "Marine AI backend is running",
  });
});

app.use("/api/marine", riskRoutes);

app.listen(PORT, () => {
  console.log(`Marine AI backend running on port ${PORT}`);
});
