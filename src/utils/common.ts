export function formatNumber(n?: number) {
  if (n == null) return "";
  return n.toLocaleString();
}
