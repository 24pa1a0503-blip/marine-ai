function createGeographicRoute({ route, start, destination }) {
  if (!Array.isArray(route) || route.length === 0) {
    return [];
  }

  const maxRow = Math.max(...route.map((point) => point.row));

  const maxCol = Math.max(...route.map((point) => point.col));

  const startLat = Number(start.latitude);
  const startLon = Number(start.longitude);

  const endLat = Number(destination.latitude);
  const endLon = Number(destination.longitude);

  return route.map((cell) => {
    const latRatio = maxRow === 0 ? 0 : cell.row / maxRow;

    const lonRatio = maxCol === 0 ? 0 : cell.col / maxCol;

    const latitude = startLat + (endLat - startLat) * latRatio;

    const longitude = startLon + (endLon - startLon) * lonRatio;

    return {
      row: cell.row,
      col: cell.col,
      latitude: Number(latitude.toFixed(6)),
      longitude: Number(longitude.toFixed(6)),
    };
  });
}

module.exports = {
  createGeographicRoute,
};
