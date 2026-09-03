const { getPFZs } = require("../../services/pfzService");

function getPFZ(req, res) {
  try {
    const category = req.query.category || "ALL";

    const validCategories = ["ALL", "VERY_HIGH", "HIGH", "MODERATE", "LOW"];

    const normalizedCategory = category.toUpperCase();

    if (!validCategories.includes(normalizedCategory)) {
      return res.status(400).json({
        success: false,
        error: "Invalid PFZ category",
        allowedCategories: validCategories,
      });
    }

    const pfzs = getPFZs(normalizedCategory);

    res.json({
      success: true,
      count: pfzs.length,
      category: normalizedCategory,
      source: "Prototype PFZ Dataset",
      pfzs,
    });
  } catch (error) {
    console.error("PFZ API error:", error);

    res.status(500).json({
      success: false,
      error: "Failed to retrieve PFZ data",
    });
  }
}

module.exports = {
  getPFZ,
};
