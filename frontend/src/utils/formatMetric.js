export function formatCompactMetric(value, t) {
  if (typeof value !== "string") {
    return value;
  }

  return value.replace(/k$/i, t("metrics.thousandSuffix"));
}
