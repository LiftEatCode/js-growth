const INDUSTRY_SEARCH_PHRASES: Record<string, string> = {
  hvac: "HVAC contractor",
  plumber: "plumber",
  plumbing: "plumber",
  roofing: "roofing contractor",
  roofer: "roofing contractor",
  electrical: "electrician",
  electrician: "electrician",
  landscaping: "landscaper",
  landscaper: "landscaper",
};

export function industrySearchPhrase(industry: string): string {
  const trimmed = industry.trim();

  if (!trimmed) {
    return "local contractor";
  }

  const mapped = INDUSTRY_SEARCH_PHRASES[trimmed.toLowerCase()];
  return mapped ?? trimmed;
}

export function buildPlacesTextQuery(options: {
  industry: string;
  locationLabel: string;
  radiusMiles: number | null;
}): string {
  const phrase = industrySearchPhrase(options.industry);
  const location = options.locationLabel.trim();
  const radius =
    options.radiusMiles && options.radiusMiles > 0
      ? ` within ${options.radiusMiles} miles of`
      : " in";

  return `${phrase}${radius} ${location}`;
}
