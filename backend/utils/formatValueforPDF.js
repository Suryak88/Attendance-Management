export function formatValue(val, suffix = "") {
  if (!val || val === 0) return "-";
  return suffix ? `${Number(val)} ${suffix}` : val;
}
