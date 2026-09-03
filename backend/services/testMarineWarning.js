const {
  getMarineWarnings
} = require("./marineWarningService");

async function test() {
  try {
    const result =
      await getMarineWarnings(
        16.70,
        82.30
      );

    console.log(
      "\n===== IMD MARINE WARNING ====="
    );

    console.log(
      "Region:",
      result.region
    );

    console.log(
      "Warning Level:",
      result.level
    );

    console.log(
      "Warning Active:",
      result.warning
    );

    console.log(
      "Lightning Warning:",
      result.lightningWarning
    );

    console.log(
      "Strong Wind Warning:",
      result.strongWindWarning
    );

    console.log(
      "Squall Warning:",
      result.squallWarning
    );

    console.log(
      "Factors:",
      result.factors
    );

    console.log(
      "Source:",
      result.source
    );

    console.log(
      "Checked At:",
      result.checkedAt
    );

    console.log(
      "==============================\n"
    );

  } catch (error) {
    console.error(
      "Warning service error:",
      error.message
    );
  }
}

test();