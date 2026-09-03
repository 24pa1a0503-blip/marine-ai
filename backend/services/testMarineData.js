const { getMarineConditions } = require("./marineDataService");

async function test() {
  try {
    const data = await getMarineConditions(16.75, 82.5);

    console.log("\n===== LIVE MARINE DATA =====");

    console.log("Latitude:", data.latitude);
    console.log("Longitude:", data.longitude);
    console.log("Timestamp:", data.timestamp);

    console.log("Wave Height:", data.waveHeight, "m");
    console.log("Wave Period:", data.wavePeriod, "s");
    console.log("SST:", data.sst, "°C");

    console.log("Current Speed:", data.currentSpeed);

    console.log("Current Direction:", data.currentDirection);

    console.log("Source:", data.source);

    console.log("============================\n");
  } catch (error) {
    console.error("Marine data error:", error.message);
  }
}

test();
