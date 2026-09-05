const https = require("https");

const MUR_SST_URL =
  "https://coastwatch.pfeg.noaa.gov/erddap/griddap/jplMURSST41.csv";

function fetchSST(latitude, longitude) {
  return new Promise((resolve, reject) => {
    const url = `${MUR_SST_URL}?analysed_sst[last][(${latitude})][(${longitude})]`;

    https
      .get(
        url,
        {
          headers: {
            Accept: "text/csv",
            "User-Agent": "Marine-AI/1.0",
          },
        },
        (res) => {
          let data = "";

          res.on("data", (chunk) => {
            data += chunk;
          });

          res.on("end", () => {
            if (res.statusCode !== 200) {
              return reject(
                new Error(`MUR SST API returned HTTP ${res.statusCode}`),
              );
            }

            const lines = data.trim().split(/\r?\n/);

            if (lines.length < 3) {
              return reject(new Error("Invalid MUR SST response"));
            }

            const values = lines[2].split(",");
            const sst = Number(values[3]);

            if (!Number.isFinite(sst)) {
              return reject(
                new Error("MUR SST value is unavailable at this location"),
              );
            }

            resolve({
              latitude: Number(values[1]),
              longitude: Number(values[2]),
              sst: sst,
              timestamp: values[0],
              source: "NASA JPL MUR SST",
              status: "LIVE",
            });
          });
        },
      )
      .on("error", reject);
  });
}

module.exports = {
  fetchSST,
};
