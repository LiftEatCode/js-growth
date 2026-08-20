/**
 * Google Places API (New) may return Place IDs as `places/ChIJ…` or bare `ChIJ…`.
 * Normalize for consistent matching across Prospect.sourceRef and discovery rows.
 */
export function normalizeGooglePlaceId(
  id: string | null | undefined,
): string | null {
  if (!id?.trim()) {
    return null;
  }

  const trimmed = id.trim();
  const prefixed = trimmed.match(/^places\/(.+)$/i);

  return prefixed?.[1]?.trim() || trimmed;
}

export function googlePlaceIdVariants(
  id: string | null | undefined,
): string[] {
  const normalized = normalizeGooglePlaceId(id);

  if (!normalized) {
    return [];
  }

  return [...new Set([normalized, `places/${normalized}`, id?.trim() ?? ""])].filter(
    Boolean,
  );
}

export function placeIdsMatch(
  left: string | null | undefined,
  right: string | null | undefined,
): boolean {
  const a = normalizeGooglePlaceId(left);
  const b = normalizeGooglePlaceId(right);

  return a !== null && b !== null && a === b;
}
