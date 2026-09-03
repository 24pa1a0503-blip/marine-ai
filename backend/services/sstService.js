const https = require("https");

const agent = new https.Agent({
  rejectUnauthorized: false,
});

// INCOIS ERDDAP dataset
const ERDDAP_BASE =
  "https://erddap.incois.gov.in/erddap/griddap/incois_tmi_3day_datasets";

function fetchJSON(url) {
  return new Promise((resolve, reject) => {
    https
      .get(
        url,
        {
          agent,
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
                  `ERDDAP returned status ${response.statusCode}: ${data}`,
                ),
              );
            }

            try {
              resolve(JSON.parse(data));
            } catch (error) {
              reject(
                new Error(
                  `Failed to parse ERDDAP response: ${error.message}`,
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
  const latitude = Math.round(Number(lat) * 4) / 4;
  const longitude = Math.round(Number(lon) * 4) / 4;

  if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
    throw new Error("Invalid latitude or longitude");
  }

  /*
   * The TMI dataset contains:
   * - SST
   * - Wind speed
   * - Rain rate
   *
   * We request the latest available record by first
   * requesting the dataset metadata.
   */

  const metadataUrl =
    `${ERDDAP_BASE}.json`;

  const metadata = await fetchJSON(metadataUrl);

  const timeValues =
    metadata.table?.rows || [];

  if (timeValues.length === 0) {
    throw new Error("No TMI data available from INCOIS ERDDAP");
  }

  /*
   * The metadata endpoint is not guaranteed to expose
   * the latest data value directly, so for the first
   * live-data test we use the most recent timestamp
   * exposed by the dataset response.
   */

  const latestTime =
    timeValues[timeValues.length - 1]?.[0];

  if (!latestTime) {
    throw new Error("Unable to determine latest SST timestamp");
  }

  const query =
    `SST[(\"${latestTime}\")][(${latitude})][(${longitude})]`;

  const url =
    `${ERDDAP_BASE}.json?${encodeURIComponent(query)}`;

  console.log("Requesting current SST from INCOIS:");
  console.log(url);

  const result = await fetchJSON(url);

  const row =
    result.table?.rows?.[0];

  return {
    latitude,
    longitude,
    sst: row?.[3] ?? null,
    timestamp: latestTime,
    source: "INCOIS ERDDAP",
    dataset: "incois_tmi_3day_datasets",
  };
}

module.exports = {
  getSST,
};