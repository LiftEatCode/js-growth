const EARTH_RADIUS_MILES = 3958.8;

function toRadians(degrees: number): number {
  return (degrees * Math.PI) / 180;
}

export function haversineDistanceMiles(
  from: { latitude: number; longitude: number },
  to: { latitude: number; longitude: number },
): number {
  const lat1 = toRadians(from.latitude);
  const lat2 = toRadians(to.latitude);
  const deltaLat = toRadians(to.latitude - from.latitude);
  const deltaLng = toRadians(to.longitude - from.longitude);

  const a =
    Math.sin(deltaLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(deltaLng / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return Math.round(EARTH_RADIUS_MILES * c * 10) / 10;
}

export function geographicBandForDistance(
  distanceMiles: number | null,
  radiusMiles: number,
): "very_near" | "near" | "regional" | "distant" | "unknown" {
  if (distanceMiles === null) {
    return "unknown";
  }

  const radius = Math.max(1, radiusMiles);

  if (distanceMiles <= radius * 0.4) {
    return "very_near";
  }

  if (distanceMiles <= radius) {
    return "near";
  }

  if (distanceMiles <= radius * 2) {
    return "regional";
  }

  return "distant";
}
