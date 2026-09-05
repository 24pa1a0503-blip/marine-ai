/**
 * Marine AI - Central Alert Engine
 *
 * Responsibilities:
 * - Convert detected hazards into alerts
 * - Assign severity and priority
 * - Generate deterministic alert IDs
 * - Deduplicate active alerts
 * - Update existing alerts
 * - Expire/resolved alerts
 * - Maintain alert history
 *
 * This is intentionally an in-memory store for the prototype.
 * A database can replace this later without changing the API contract.
 */

const activeAlerts = new Map();
const alertHistory = [];

const PRIORITY = {
  CRITICAL: 0,
  HIGH: 1,
  MEDIUM: 2,
  LOW: 3,
  INFO: 4,
};

const ALERT_EXPIRATION_MINUTES = {
  CRITICAL: 60,
  HIGH: 120,
  MEDIUM: 240,
  LOW: 360,
  INFO: 720,
};

function generateAlertId(hazard, location) {
  const latitude = Number(location?.latitude ?? 0).toFixed(4);
  const longitude = Number(location?.longitude ?? 0).toFixed(4);

  return `ALT-${hazard.id}-${latitude}-${longitude}`;
}

function getExpirationTime(severity) {
  const minutes =
    ALERT_EXPIRATION_MINUTES[severity] ??
    ALERT_EXPIRATION_MINUTES.MEDIUM;

  return new Date(
    Date.now() + minutes * 60 * 1000
  ).toISOString();
}

function createAlert(hazard, location, context = {}) {
  const now = new Date().toISOString();

  const severity = hazard.severity || "MEDIUM";

  const priority =
    hazard.priority ??
    PRIORITY[severity] ??
    PRIORITY.MEDIUM;

  return {
    id: generateAlertId(hazard, location),

    type: hazard.type,

    hazard: hazard.id,

    severity,

    priority,

    status: "ACTIVE",

    title: hazard.title,

    message: hazard.message,

    location: {
      latitude: Number(location?.latitude),
      longitude: Number(location?.longitude),
    },

    value: hazard.value ?? null,

    unit: hazard.unit ?? null,

    evidence: hazard.evidence || [],

    recommendation:
      hazard.recommendation || "CAUTION",

    pfzId: context.pfzId ?? null,

    routeId: context.routeId ?? null,

    sourceStatus:
      context.sourceStatus ||
      context.dataMode ||
      "UNKNOWN",

    source:
      context.source ||
      "Marine AI",

    createdAt: now,

    updatedAt: now,

    expiresAt: getExpirationTime(severity),
  };
}

/**
 * Evaluate detected hazards and update active alerts.
 */
function evaluateAlerts(hazards = [], location = {}, context = {}) {
  const currentIds = new Set();

  for (const hazard of hazards) {
    const alertId = generateAlertId(hazard, location);

    currentIds.add(alertId);

    const existingAlert = activeAlerts.get(alertId);

    if (existingAlert) {
      existingAlert.severity =
        hazard.severity || existingAlert.severity;

      existingAlert.priority =
        hazard.priority ??
        existingAlert.priority;

      existingAlert.title =
        hazard.title ||
        existingAlert.title;

      existingAlert.message =
        hazard.message ||
        existingAlert.message;

      existingAlert.value =
        hazard.value ??
        existingAlert.value;

      existingAlert.unit =
        hazard.unit ??
        existingAlert.unit;

      existingAlert.evidence =
        hazard.evidence ||
        existingAlert.evidence;

      existingAlert.recommendation =
        hazard.recommendation ||
        existingAlert.recommendation;

      existingAlert.updatedAt =
        new Date().toISOString();

      existingAlert.expiresAt =
        getExpirationTime(existingAlert.severity);

      continue;
    }

    const alert = createAlert(
      hazard,
      location,
      context
    );

    activeAlerts.set(alert.id, alert);
  }

  /*
   * Any previously active alert that was not detected
   * during this evaluation is considered resolved.
   */
  for (const [id, alert] of activeAlerts.entries()) {
    if (!currentIds.has(id)) {
      resolveAlert(id);
    }
  }

  return getActiveAlerts();
}

/**
 * Resolve an active alert.
 */
function resolveAlert(alertId) {
  const alert = activeAlerts.get(alertId);

  if (!alert) {
    return null;
  }

  alert.status = "RESOLVED";
  alert.updatedAt = new Date().toISOString();

  alertHistory.push({
    ...alert,
  });

  activeAlerts.delete(alertId);

  return alert;
}

/**
 * Expire alerts whose expiration time has passed.
 */
function expireAlerts() {
  const now = Date.now();

  for (const [id, alert] of activeAlerts.entries()) {
    if (
      alert.expiresAt &&
      new Date(alert.expiresAt).getTime() <= now
    ) {
      alert.status = "EXPIRED";
      alert.updatedAt = new Date().toISOString();

      alertHistory.push({
        ...alert,
      });

      activeAlerts.delete(id);
    }
  }
}

/**
 * Return active alerts sorted by priority.
 */
function getActiveAlerts() {
  expireAlerts();

  return Array.from(activeAlerts.values()).sort(
    (a, b) => a.priority - b.priority
  );
}

/**
 * Return alert history.
 */
function getAlertHistory() {
  return [...alertHistory].sort(
    (a, b) =>
      new Date(b.updatedAt) -
      new Date(a.updatedAt)
  );
}

/**
 * Get a single active alert.
 */
function getAlert(alertId) {
  expireAlerts();

  return activeAlerts.get(alertId) || null;
}

/**
 * Clear all alerts.
 *
 * Useful during development/testing.
 */
function clearAlerts() {
  activeAlerts.clear();
  alertHistory.length = 0;
}

module.exports = {
  evaluateAlerts,
  getActiveAlerts,
  getAlertHistory,
  getAlert,
  resolveAlert,
  expireAlerts,
  clearAlerts,
};