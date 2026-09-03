const https = require("https");

const OPEN_METEO_MARINE_URL =
  "https://marine-api.open-meteo.com/v1/marine";

function fetchJSON(url) {
  return new Promise((resolve, reject) => {
    https
      .get(
        url,
        {
          headers: {
            "User-Agent": "Marine-AI-Prototype/1.0",
          },
        },
        (response) => {
          let data = "";

          response.on("data", (chunk) => {
            data += chunk;
          });

          response.on("end", () => {
            if (response.statusCode !== 200) {
              return reject(
                new Error(
                  `Open-Meteo returned status ${response.statusCode}: ${data}`,
                ),
              );
            }

            try {
              resolve(JSON.parse(data));
            } catch (error) {
              reject(
                new Error(
                  `Failed to parse Open-Meteo response: ${error.message}`,
                ),
              );
            }
          });
        },
      )
      .on("error", reject);
  });
}

async function getSST(lat, lon) {
  const latitude = Number(lat);
  const longitude = Number(lon);

  if (
    !Number.isFinite(latitude) ||
    !Number.isFinite(longitude) ||
    latitude < -90 ||
    latitude > 90 ||
    longitude < -180 ||
    longitude > 180
  ) {
    throw new Error("Invalid latitude or longitude");
  }

  const params = new URLSearchParams({
    latitude: String(latitude),
    longitude: String(longitude),
    current: "sea_surface_temperature",
    cell_selection: "sea",
    timezone: "GMT",
  });

  const url = `${OPEN_METEO_MARINE_URL}?${params.toString()}`;

  console.log("Requesting current SST from Open-Meteo:");
  console.log(url);

  const result = await fetchJSON(url);

  const sst = result.current?.sea_surface_temperature ?? null;
  const timestamp = result.current?.time ?? null;

  return {
    latitude: result.latitude ?? latitude,
    longitude: result.longitude ?? longitude,
    sst,
    timestamp,
    source: "Open-Meteo Marine API",
  };
}

module.exports = {
  getSST,
};