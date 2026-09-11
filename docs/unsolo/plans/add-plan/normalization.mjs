// Kept in parity with the verified GeoNames importer and search-destinations.
const unicodeWhitespace = /\p{White_Space}+/gu;

export function normalizeDestinationQuery(value) {
  return value.toLowerCase().normalize("NFKD").toLowerCase()
    .replace(/ß/gu, "ss").replace(/\p{M}/gu, "")
    .replace(/[\p{Pd}'’‘ʼ＇`]/gu, " ")
    .replace(unicodeWhitespace, " ")
    .replaceAll("\u001c", " ").replaceAll("\u001d", " ")
    .replaceAll("\u001e", " ").replaceAll("\u001f", " ")
    .replace(/ +/g, " ").replace(/^ +| +$/g, "");
}

export function destinationQueryState(raw) {
  if (typeof raw !== "string") return { normalized: "", valid: false, searchable: false };
  const normalized = normalizeDestinationQuery(raw);
  const length = [...normalized].length;
  const valid = !/[\p{C}]/u.test(normalized) && length <= 80;
  return { normalized, valid, searchable: valid && length >= 2 };
}
