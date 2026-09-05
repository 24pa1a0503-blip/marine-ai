const https = require("https");
const fs = require("fs");
const os = require("os");
const path = require("path");
const { execFile } = require("child_process");
const { promisify } = require("util");

const execFileAsync = promisify(execFile);

const INCOIS_WCS_URL = "https://incois.gov.in/geoserver/PFZ-TUNA-SST-CHL/wcs";

const COVERAGE = "PFZ-TUNA-SST-CHL:chl";

/**
 * Download a small INCOIS CHL GeoTIFF around a coordinate.
 */
function downloadCHLRaster(
  latitude,
  longitude,
  radius = 0.25,
  resolution = 50,
) {
  return new Promise((resolve, reject) => {
    const minLon = longitude - radius;
    const maxLon = longitude + radius;
    const minLat = latitude - radius;
    const maxLat = latitude + radius;

    const url =
      `${INCOIS_WCS_URL}` +
      `?service=WCS` +
      `&version=1.0.0` +
      `&request=GetCoverage` +
      `&coverage=${encodeURIComponent(COVERAGE)}` +
      `&crs=EPSG:4326` +
      `&bbox=${minLon},${minLat},${maxLon},${maxLat}` +
      `&format=GeoTIFF` +
      `&width=${resolution}` +
      `&height=${resolution}`;

    https
      .get(
        url,
        {
          headers: {
            Accept: "image/tiff",
            "User-Agent": "Marine-AI/1.0",
          },
        },
        (res) => {
          if (res.statusCode !== 200) {
            return reject(
              new Error(`INCOIS WCS returned HTTP ${res.statusCode}`),
            );
          }

          const chunks = [];

          res.on("data", (chunk) => chunks.push(chunk));

          res.on("end", () => {
            resolve(Buffer.concat(chunks));
          });
        },
      )
      .on("error", reject);
  });
}

/**
 * Find the nearest valid CHL pixel.
 */
async function extractNearestCHL(rasterPath, latitude, longitude) {
  const pythonScript = `
import sys
import rasterio
import numpy as np

raster_path = sys.argv[1]
lat = float(sys.argv[2])
lon = float(sys.argv[3])

with rasterio.open(raster_path) as r:
    data = r.read(1)

    height, width = data.shape

    # Create pixel row/column grids
    rows, cols = np.indices((height, width))

    # Convert pixel coordinates to geographic coordinates
    transform = r.transform

    pixel_lons = (
        transform.c
        + (cols + 0.5) * transform.a
        + (rows + 0.5) * transform.b
    )

    pixel_lats = (
        transform.f
        + (cols + 0.5) * transform.d
        + (rows + 0.5) * transform.e
    )

    valid = np.isfinite(data)

    if not np.any(valid):
        print("NO_VALID_DATA")
        sys.exit(0)

    # Squared geographic distance from requested coordinate
    distance = (
        (pixel_lats - lat) ** 2
        + (pixel_lons - lon) ** 2
    )

    # Ignore invalid pixels
    distance[~valid] = np.inf

    row, col = np.unravel_index(
        np.argmin(distance),
        distance.shape
    )

    value = float(data[row, col])

    print(
        value,
        pixel_lats[row, col],
        pixel_lons[row, col]
    )
`;

  const scriptPath = path.join(os.tmpdir(), "marine_ai_chl_extract.py");

  fs.writeFileSync(scriptPath, pythonScript);

  try {
    const { stdout } = await execFileAsync(
      "python",
      [scriptPath, rasterPath, String(latitude), String(longitude)],
      {
        maxBuffer: 1024 * 1024,
      },
    );

    const output = stdout.trim();

    if (output === "NO_VALID_DATA") {
      return null;
    }

    const [value, pixelLat, pixelLon] = output.split(/\s+/).map(Number);

    if (!Number.isFinite(value)) {
      return null;
    }

    return {
      chlorophyll: value,
      latitude: pixelLat,
      longitude: pixelLon,
    };
  } finally {
    fs.unlinkSync(scriptPath);
  }
}

/**
 * Fetch live/operational chlorophyll around a PFZ.
 */
async function fetchChlorophyll(latitude, longitude) {
  const lat = Number(latitude);
  const lon = Number(longitude);

  if (!Number.isFinite(lat) || !Number.isFinite(lon)) {
    throw new Error("Valid latitude and longitude are required");
  }

  const buffer = await downloadCHLRaster(lat, lon);

  const tempPath = path.join(os.tmpdir(), `marine-ai-chl-${Date.now()}.tif`);

  fs.writeFileSync(tempPath, buffer);

  try {
    const result = await extractNearestCHL(tempPath, lat, lon);

    if (!result) {
      return {
        chlorophyll: null,
        unit: "mg/m³",
        source: "INCOIS PFZ CHL WCS",
        status: "NO_DATA",
        timestamp: new Date().toISOString(),
      };
    }

    return {
      chlorophyll: Number(result.chlorophyll.toFixed(4)),
      unit: "mg/m³",
      latitude: result.latitude,
      longitude: result.longitude,
      source: "INCOIS PFZ CHL WCS",
      status: "LIVE",
      timestamp: new Date().toISOString(),
    };
  } finally {
    fs.unlinkSync(tempPath);
  }
}

module.exports = {
  fetchChlorophyll,
};
