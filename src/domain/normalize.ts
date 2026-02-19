export function normalizeSpaces(s: string) {
  return s.replace(/\s+/g, " ").trim();
}

// "dulces" -> "Dulces", "dULceS" -> "Dulces", "  pies  " -> "Pies"
export function prettyCategoryName(input: string) {
  const s = normalizeSpaces(input);
  if (!s) return "";
  const lower = s.toLowerCase();
  return lower.charAt(0).toUpperCase() + lower.slice(1);
}

// llave para comparar duplicados: "Dulces" / "dulces" => "dulces"
export function categoryKey(input: string) {
  return normalizeSpaces(input).toLowerCase();
}
