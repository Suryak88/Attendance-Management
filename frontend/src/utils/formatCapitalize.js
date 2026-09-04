const abbreviations = {
  spg: "SPG",
  spb: "SPB",
  hrd: "HRD",
  it: "IT",
  ceo: "CEO",
  ar: "AR",
  ga: "GA",
  po: "PO",
  hr: "HR",
  pt: "PT",
};

export function formatCapitalize(text) {
  if (!text) return;

  return text
    .toLowerCase()
    .replace(/\b\w/g, (char) => char.toUpperCase())
    .replace(/\b[\w]+\b/g, (word) => {
      return abbreviations[word.toLowerCase()] || word;
    });
}
