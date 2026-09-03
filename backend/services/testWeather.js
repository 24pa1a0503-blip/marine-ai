const { getWeatherConditions } = require("./weatherService");

async function test() {
  try {
    const data = await getWeatherConditions(16.7, 82.3);

    console.log("\n===== LIVE WEATHER DATA =====");

    console.log("Latitude:", data.latitude);

    console.log("Longitude:", data.longitude);

    console.log("Timestamp:", data.timestamp);

    console.log("Wind Speed:", data.windSpeed, "km/h");

    console.log("Wind Direction:", data.windDirection, "°");

    console.log("Wind Gust:", data.windGust, "km/h");

    console.log("Precipitation:", data.precipitation, "mm");

    console.log("Rain Probability:", data.precipitationProbability, "%");

    console.log("Weather Code:", data.weatherCode);

    console.log("Source:", data.source);

    console.log("============================\n");
  } catch (error) {
    console.error("Weather data error:", error.message);
  }
}

test();
