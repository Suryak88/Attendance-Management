export function truncateText(text, maxLength = 10, dot = true) {
  if (!text) return "";
  if (text.length <= maxLength) return text;
  if (dot === false) return text.slice(0, maxLength);
  return text.slice(0, maxLength) + "...";
}
