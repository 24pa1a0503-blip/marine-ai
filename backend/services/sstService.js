const https = require("https");

const agent = new https.Agent({
  rejectUnauthorized: false,
});

const ERDDAP_BASE =
  "https://erddap.incois.gov.in/erddap/griddap/NOAA_AVHRR_AMSR_datasets";

function fetchJSON(url) {
  return new Promise((resolve, reject) => {
    https
      .get(
        url,
        {
          agent: agent,
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
              reject(new Error("Failed to parse ERDDAP response"));
            }
          });
        },
      )
      .on("error", reject);
  });
}

async function getSST(lat, lon) {
  /*
   * Dataset grid:
   * latitude  = 0.25 degree
   * longitude = 0.25 degree
   *
   * Request the nearest grid point.
   */

  const latitude = Math.round(Number(lat) * 4) / 4;
  const longitude = Math.round(Number(lon) * 4) / 4;

  /*
   * Known available date used for initial connectivity testing.
   * This is historical data, NOT real-time SST.
   */

  const date = "2011-10-04T00:00:00Z";

  const query = `sst[(${date})][(0)][(${latitude})][(${longitude})]`;

  const url = `${ERDDAP_BASE}.json?${encodeURIComponent(query)}`;

  console.log("Requesting SST from:", url);

  const result = await fetchJSON(url);

  return {
    latitude,
    longitude,
    sst: result.table?.rows?.[0]?.[4] ?? null,
    source: "INCOIS ERDDAP",
    dataset: "NOAA_AVHRR_AMSR_datasets",
    timestamp: date,
  };
}

module.exports = {
  getSST,
};
