const abbreviations = {
  spg: "SPG",
  spb: "SPB",
  hrd: "HRD",
  it: "IT",
  ceo: "CEO",
  ar: "AR",
  ga: "GA",
};

export function formatCapitalize(text) {
  return text
    .toLowerCase()
    .replace(/\b\w/g, (char) => char.toUpperCase())
    .replace(/\b[\w]+\b/g, (word) => {
      return abbreviations[word.toLowerCase()] || word;
    });
}
