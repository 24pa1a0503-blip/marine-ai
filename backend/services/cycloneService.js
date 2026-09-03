const IMD_CYCLONE_URL =
  process.env.IMD_CYCLONE_URL ||
  "https://mausam.imd.gov.in/responsive/cycloneinformation.php";

async function getCycloneStatus(latitude, longitude) {
  try {
    const response = await fetch(IMD_CYCLONE_URL);

    if (!response.ok) {
      throw new Error(`IMD cyclone service returned HTTP ${response.status}`);
    }

    const html = await response.text();

    // The public IMD cyclone page is currently HTML-based.
    // Do not infer cyclone presence from page availability alone.
    return {
      success: true,
      status: "NOT_AVAILABLE",
      active: null,
      cyclone: null,
      location: {
        latitude,
        longitude,
      },
      source: "India Meteorological Department",
      sourceUrl: IMD_CYCLONE_URL,
      message:
        "Official IMD cyclone information page is reachable, but structured cyclone track data is not available through this service yet.",
      checkedAt: new Date().toISOString(),
    };
  } catch (error) {
    console.warn(`[Cyclone Service Warning] ${error.message}`);

    return {
      success: false,
      status: "NOT_AVAILABLE",
      active: null,
      cyclone: null,
      location: {
        latitude,
        longitude,
      },
      source: "India Meteorological Department",
      sourceUrl: IMD_CYCLONE_URL,
      message:
        "Cyclone information could not be retrieved. Do not assume cyclone absence.",
      checkedAt: new Date().toISOString(),
    };
  }
}

module.exports = {
  getCycloneStatus,
};
