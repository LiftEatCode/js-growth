import type {
  BusinessProfileData,
  GbpProfileReview,
  GbpRegularHoursDay,
} from "../types";

export const FIXTURE_AS_OF = "2026-08-30T12:00:00.000Z";

export function daysAgoIso(days: number): string {
  const asOf = Date.parse(FIXTURE_AS_OF);
  return new Date(asOf - days * 86_400_000).toISOString();
}

export function weekdayHours(
  openTime: string,
  closeTime: string,
  saturday?: { openTime: string; closeTime: string },
): GbpRegularHoursDay[] {
  const days: GbpRegularHoursDay[] = [
    { day: "SUNDAY", openTime: null, closeTime: null, closed: true },
    { day: "MONDAY", openTime, closeTime, closed: false },
    { day: "TUESDAY", openTime, closeTime, closed: false },
    { day: "WEDNESDAY", openTime, closeTime, closed: false },
    { day: "THURSDAY", openTime, closeTime, closed: false },
    { day: "FRIDAY", openTime, closeTime, closed: false },
    saturday
      ? {
          day: "SATURDAY",
          openTime: saturday.openTime,
          closeTime: saturday.closeTime,
          closed: false,
        }
      : { day: "SATURDAY", openTime: null, closeTime: null, closed: true },
  ];
  return days;
}

export function sampleReview(
  rating: number,
  daysAgo: number,
  responded: boolean,
): GbpProfileReview {
  const publishedAt = daysAgoIso(daysAgo);
  return {
    rating,
    publishedAt,
    hasOwnerResponse: responded,
    ownerResponseAt: responded ? daysAgoIso(Math.max(0, daysAgo - 1)) : null,
  };
}

export const emptyConversionExtras = {
  orderingUrl: "",
  menuUrl: "",
  reservationUrl: "",
} as const;

export function baseModel(
  overrides: Partial<BusinessProfileData["businessModel"]> = {},
): BusinessProfileData["businessModel"] {
  return {
    expectsAppointments: null,
    expectsOnlineOrdering: false,
    expectsReservations: false,
    expectsMenu: false,
    ...overrides,
  };
}
