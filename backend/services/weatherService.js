const https = require("https");

const agent = new https.Agent({
  rejectUnauthorized: false
});

function fetchJSON(url) {
  return new Promise((resolve, reject) => {
    https.get(url, { agent }, (response) => {
      let data = "";

      response.on("data", (chunk) => {
        data += chunk;
      });

      response.on("end", () => {
        if (response.statusCode !== 200) {
          return reject(
            new Error(
              `Weather API returned status ${response.statusCode}: ${data}`
            )
          );
        }

        try {
          resolve(JSON.parse(data));
        } catch (error) {
          reject(
            new Error("Failed to parse weather API response")
          );
        }
      });
    }).on("error", reject);
  });
}

async function getWeatherConditions(lat, lon) {
  const latitude = Number(lat);
  const longitude = Number(lon);

  if (
    !Number.isFinite(latitude) ||
    !Number.isFinite(longitude)
  ) {
    throw new Error("Invalid latitude or longitude");
  }

  const params = new URLSearchParams({
    latitude: latitude.toString(),
    longitude: longitude.toString(),

    current: [
      "wind_speed_10m",
      "wind_direction_10m",
      "wind_gusts_10m",
      "precipitation",
      "weather_code"
    ].join(","),

    hourly: [
      "wind_speed_10m",
      "wind_direction_10m",
      "wind_gusts_10m",
      "precipitation_probability",
      "precipitation",
      "weather_code"
    ].join(","),

    forecast_hours: "24",

    timezone: "GMT"
  });

  const url =
    `https://api.open-meteo.com/v1/forecast?${params.toString()}`;

  console.log("Requesting live weather data:");
  console.log(url);

  const result = await fetchJSON(url);

  const current = result.current || {};

  const hourly = result.hourly || {};

  return {
    latitude: result.latitude,
    longitude: result.longitude,

    timestamp:
      current.time ||
      new Date().toISOString(),

    windSpeed: current.wind_speed_10m ?? null,

    windDirection:
      current.wind_direction_10m ?? null,

    windGust:
      current.wind_gusts_10m ?? null,

    precipitation:
      current.precipitation ?? null,

    precipitationProbability:
      hourly.precipitation_probability?.[0] ?? null,

    weatherCode:
      current.weather_code ?? null,

    source: "Open-Meteo Weather API",

    updatedAt: new Date().toISOString()
  };
}

module.exports = {
  getWeatherConditions
};