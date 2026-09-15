import type { BusinessProfileData } from "../types";
import {
  FIXTURE_AS_OF,
  baseModel,
  daysAgoIso,
  emptyConversionExtras,
  sampleReview,
  weekdayHours,
} from "./helpers";

export const excellentBusiness: BusinessProfileData = {
  capturedAt: FIXTURE_AS_OF,
  identity: {
    name: "Cedar & Pine HVAC",
    primaryCategory: "HVAC contractor",
    additionalCategories: ["Air conditioning repair service", "Furnace repair service"],
    description:
      "Cedar & Pine HVAC installs and repairs heating and cooling systems for homes in the Cedar Park area. The team handles seasonal maintenance, emergency no-cool calls, and replacement quotes with written options. We explain repair versus replace in plain language and schedule around workdays when we can.",
    phone: "(512) 555-0148",
    websiteUrl: "https://www.cedarandpinehvac.example",
    appointmentUrl: "https://www.cedarandpinehvac.example/book",
  },
  configuration: {
    locationType: "STOREFRONT",
    serviceAreas: [],
    hasPublicAddress: true,
    regularHours: weekdayHours("08:00", "17:00", {
      openTime: "09:00",
      closeTime: "13:00",
    }),
    specialHours: [{ date: "2026-12-25", openTime: null, closeTime: null, closed: true }],
    openingDate: "2018-04-12",
  },
  services: [
    { name: "Air conditioning repair", description: "Diagnostic and repair" },
    { name: "Heating repair", description: null },
    { name: "Maintenance plans", description: "Seasonal tune-ups" },
  ],
  products: [],
  attributes: ["identifies_as_women_owned", "has_wheelchair_accessible_entrance"],
  media: {
    photoCount: 28,
    logoPresent: true,
    coverPhotoPresent: true,
    ownerUploadedPhotoCount: 18,
    customerUploadedPhotoCount: 10,
    mostRecentOwnerPhotoAt: daysAgoIso(8),
    mostRecentPhotoAt: daysAgoIso(3),
  },
  activity: {
    posts: [
      { publishedAt: daysAgoIso(6), type: "UPDATE" },
      { publishedAt: daysAgoIso(20), type: "OFFER" },
      { publishedAt: daysAgoIso(41), type: "UPDATE" },
    ],
    postCount: 24,
    mostRecentPostAt: daysAgoIso(6),
  },
  reviews: {
    averageRating: 4.8,
    totalCount: 87,
    ownerResponseCount: 82,
    mostRecentReviewAt: daysAgoIso(4),
    reviews: [
      sampleReview(5, 4, true),
      sampleReview(5, 11, true),
      sampleReview(4, 18, true),
      sampleReview(5, 27, true),
      sampleReview(3, 40, true),
      sampleReview(5, 55, true),
    ],
  },
  conversion: {
    websiteUrl: "https://www.cedarandpinehvac.example",
    phone: "(512) 555-0148",
    appointmentUrl: "https://www.cedarandpinehvac.example/book",
    messagingEnabled: true,
    ...emptyConversionExtras,
  },
  businessModel: baseModel({ expectsAppointments: true }),
  localSeoContext: {
    websiteDomain: "cedarandpinehvac.example",
    websiteName: "Cedar & Pine HVAC",
    websitePhone: "512-555-0148",
    websiteAddress: "410 Harbor Lane, Cedar Park, TX",
    localLandingPageUrl: "https://www.cedarandpinehvac.example/hvac-cedar-park",
    localLandingPageRelevant: true,
  },
};
