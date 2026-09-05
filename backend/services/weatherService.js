const https = require("https");

const agent = new https.Agent({
  rejectUnauthorized: false,
});

function fetchJSON(url) {
  return new Promise((resolve, reject) => {
    https
      .get(url, { agent }, (response) => {
        let data = "";

        response.on("data", (chunk) => {
          data += chunk;
        });

        response.on("end", () => {
          if (response.statusCode !== 200) {
            return reject(
              new Error(
                `Weather API returned status ${response.statusCode}: ${data}`,
              ),
            );
          }

          try {
            resolve(JSON.parse(data));
          } catch (error) {
            reject(new Error("Failed to parse weather API response"));
          }
        });
      })
      .on("error", reject);
  });
}

async function getWeatherConditions(lat, lon) {
  const latitude = Number(lat);
  const longitude = Number(lon);

  if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
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
      "weather_code",
    ].join(","),

    hourly: [
      "wind_speed_10m",
      "wind_direction_10m",
      "wind_gusts_10m",
      "precipitation_probability",
      "precipitation",
      "weather_code",
    ].join(","),

    forecast_hours: "24",

    timezone: "GMT",
  });

  const url = `https://api.open-meteo.com/v1/forecast?${params.toString()}`;

  console.log("Requesting live weather data:");
  console.log(url);

  const result = await fetchJSON(url);

  const current = result.current || {};

  const hourly = result.hourly || {};

  return {
    latitude: result.latitude,
    longitude: result.longitude,

    timestamp: current.time || new Date().toISOString(),

    windSpeed: current.wind_speed_10m ?? null,

    windDirection: current.wind_direction_10m ?? null,

    windGust: current.wind_gusts_10m ?? null,

    precipitation: current.precipitation ?? null,

    precipitationProbability: hourly.precipitation_probability?.[0] ?? null,

    weatherCode: current.weather_code ?? null,

    source: "Open-Meteo Weather API",

    updatedAt: new Date().toISOString(),
  };
}

async function getWeatherForecast(lat, lon, targetDate) {
  const latitude = Number(lat);
  const longitude = Number(lon);

  if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
    throw new Error("Invalid latitude or longitude");
  }

  if (!targetDate) {
    throw new Error("Target forecast date is required");
  }

  const params = new URLSearchParams({
    latitude: latitude.toString(),
    longitude: longitude.toString(),

    hourly: [
      "wind_speed_10m",
      "wind_direction_10m",
      "wind_gusts_10m",
      "precipitation_probability",
      "precipitation",
      "weather_code",
    ].join(","),

    start_date: targetDate,
    end_date: targetDate,

    timezone: "GMT",
  });

  const url = `https://api.open-meteo.com/v1/forecast?${params.toString()}`;

  console.log("Requesting forecast weather data:");
  console.log(url);

  const result = await fetchJSON(url);

  const hourly = result.hourly || {};

  if (!hourly.time || hourly.time.length === 0) {
    throw new Error(`No weather forecast available for ${targetDate}`);
  }

  // Find the representative daytime forecast.
  // Around 12:00 UTC is useful for a simple prototype.
  let selectedIndex = hourly.time.findIndex((time) => time.includes("12:00"));

  // If 12:00 is unavailable, use the middle forecast point.
  if (selectedIndex === -1) {
    selectedIndex = Math.floor(hourly.time.length / 2);
  }

  return {
    latitude: result.latitude,
    longitude: result.longitude,

    forecastDate: targetDate,

    timestamp: hourly.time[selectedIndex] || null,

    windSpeed: hourly.wind_speed_10m?.[selectedIndex] ?? null,

    windDirection: hourly.wind_direction_10m?.[selectedIndex] ?? null,

    windGust: hourly.wind_gusts_10m?.[selectedIndex] ?? null,

    precipitation: hourly.precipitation?.[selectedIndex] ?? null,

    precipitationProbability:
      hourly.precipitation_probability?.[selectedIndex] ?? null,

    weatherCode: hourly.weather_code?.[selectedIndex] ?? null,

    source: "Open-Meteo Weather API",

    status: "FORECAST",

    updatedAt: new Date().toISOString(),
  };
}

module.exports = {
  getWeatherConditions,
  getWeatherForecast,
};
