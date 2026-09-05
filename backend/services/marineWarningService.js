const https = require("https");

const IMD_WARNING_URL =
  "https://mausam.imd.gov.in/imd_latest/contents/subdivisionwise-warning_mc.php?id=2";

function fetchText(url) {
  return new Promise((resolve, reject) => {
    https
      .get(
        url,
        { rejectUnauthorized: false },
        (response) => {
          let data = "";

          response.on("data", (chunk) => {
            data += chunk;
          });

          response.on("end", () => {
            if (response.statusCode !== 200) {
              return reject(
                new Error(
                  `IMD warning service returned status ${response.statusCode}`
                )
              );
            }

            resolve(data);
          });
        }
      )
      .on("error", reject);
  });
}

function cleanHTML(html) {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/\s+/g, " ")
    .trim();
}

function detectWarning(text) {
  const lowerText = text.toLowerCase();

  const lightningWarning =
    lowerText.includes("thunderstorm & lightning") ||
    lowerText.includes("thunderstorm and lightning");

  const strongWindWarning =
    lowerText.includes("strong surface winds");

  const squallWarning =
    lowerText.includes("squall");

  const factors = [];

  if (lightningWarning) {
    factors.push("IMD thunderstorm/lightning warning");
  }

  if (strongWindWarning) {
    factors.push("IMD strong surface wind warning");
  }

  if (squallWarning) {
    factors.push("IMD squall warning");
  }

  let level = "NORMAL";

  if (squallWarning || lightningWarning) {
    level = "HIGH";
  } else if (strongWindWarning) {
    level = "MODERATE";
  }

  return {
    level,
    warning: factors.length > 0,
    factors,
    lightningWarning,
    strongWindWarning,
    squallWarning
  };
}

async function getMarineWarnings(latitude, longitude) {
  const lat = Number(latitude);
  const lon = Number(longitude);

  if (!Number.isFinite(lat) || !Number.isFinite(lon)) {
    throw new Error("Invalid latitude or longitude");
  }

  const html = await fetchText(IMD_WARNING_URL);

  const text = cleanHTML(html);

  /*
   * IMPORTANT:
   * We deliberately do not use a generic "lightning" search.
   * The parser only considers explicit IMD warning phrases.
   */
  const warning = detectWarning(text);

  return {
    source: "India Meteorological Department",

    sourceUrl: IMD_WARNING_URL,

    region: "Coastal Andhra Pradesh",

    latitude: lat,
    longitude: lon,

    level: warning.level,

    warning: warning.warning,

    factors: warning.factors,

    lightningWarning: warning.lightningWarning,

    strongWindWarning: warning.strongWindWarning,

    squallWarning: warning.squallWarning,

    checkedAt: new Date().toISOString()
  };
}

module.exports = {
  getMarineWarnings
};