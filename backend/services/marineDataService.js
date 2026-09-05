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
                `Marine API returned status ${response.statusCode}: ${data}`,
              ),
            );
          }

          try {
            resolve(JSON.parse(data));
          } catch (error) {
            reject(new Error("Failed to parse marine API response"));
          }
        });
      })
      .on("error", reject);
  });
}

async function getMarineConditions(lat, lon) {
  const latitude = Number(lat);
  const longitude = Number(lon);

  if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
    throw new Error("Invalid latitude or longitude");
  }

  const params = new URLSearchParams({
    latitude: latitude.toString(),
    longitude: longitude.toString(),

    current: [
      "wave_height",
      "wave_period",
      "sea_surface_temperature",
      "ocean_current_velocity",
      "ocean_current_direction",
    ].join(","),

    hourly: [
      "wave_height",
      "wave_period",
      "sea_surface_temperature",
      "ocean_current_velocity",
      "ocean_current_direction",
    ].join(","),

    forecast_hours: "24",

    timezone: "GMT",

    cell_selection: "sea",
  });

  const url = `https://marine-api.open-meteo.com/v1/marine?${params.toString()}`;

  console.log("Requesting live marine data:");
  console.log(url);

  const result = await fetchJSON(url);

  const current = result.current || {};

  return {
    latitude: result.latitude,
    longitude: result.longitude,

    timestamp: current.time || new Date().toISOString(),

    waveHeight: current.wave_height ?? null,

    wavePeriod: current.wave_period ?? null,

    sst: current.sea_surface_temperature ?? null,

    currentSpeed: current.ocean_current_velocity ?? null,

    currentDirection: current.ocean_current_direction ?? null,

    source: "Open-Meteo Marine API",

    updatedAt: new Date().toISOString(),
  };
}

async function getMarineForecast(lat, lon, targetDate) {
  const latitude = Number(lat);
  const longitude = Number(lon);

  if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
    throw new Error("Invalid latitude or longitude");
  }

  if (!targetDate) {
    throw new Error("Forecast date is required");
  }

  const params = new URLSearchParams({
    latitude: latitude.toString(),
    longitude: longitude.toString(),

    hourly: [
      "wave_height",
      "wave_period",
      "sea_surface_temperature",
      "ocean_current_velocity",
      "ocean_current_direction",
    ].join(","),

    start_date: targetDate,
    end_date: targetDate,

    timezone: "GMT",

    cell_selection: "sea",
  });

  const url = `https://marine-api.open-meteo.com/v1/marine?${params.toString()}`;

  console.log("Requesting forecast marine data:");
  console.log(url);

  const result = await fetchJSON(url);

  const hourly = result.hourly || {};

  const times = hourly.time || [];

  if (times.length === 0) {
    throw new Error(`No marine forecast data available for ${targetDate}`);
  }

  // Select approximately midday forecast.
  let index = times.findIndex((time) => String(time).includes("12:00"));

  // Fallback to the middle available forecast point.
  if (index === -1) {
    index = Math.floor(times.length / 2);
  }

  return {
    latitude: result.latitude,
    longitude: result.longitude,

    forecastDate: targetDate,

    timestamp: times[index],

    waveHeight: hourly.wave_height?.[index] ?? null,

    wavePeriod: hourly.wave_period?.[index] ?? null,

    sst: hourly.sea_surface_temperature?.[index] ?? null,

    currentSpeed: hourly.ocean_current_velocity?.[index] ?? null,

    currentDirection: hourly.ocean_current_direction?.[index] ?? null,

    source: "Open-Meteo Marine API",

    status: "FORECAST",

    updatedAt: new Date().toISOString(),
  };
}

module.exports = {
  getMarineConditions,
  getMarineForecast,
};
