export function capitalizeFirst(s: string) {
  const t = s.replace(/\s+/g, " ").trim();
  if (!t) return "";
  return t.charAt(0).toUpperCase() + t.slice(1);
}
