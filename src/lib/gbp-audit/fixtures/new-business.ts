import type { BusinessProfileData } from "../types";
import {
  FIXTURE_AS_OF,
  baseModel,
  daysAgoIso,
  emptyConversionExtras,
  sampleReview,
  weekdayHours,
} from "./helpers";

export const newBusiness: BusinessProfileData = {
  capturedAt: FIXTURE_AS_OF,
  identity: {
    name: "Bright Harbor Pediatric Dentistry",
    primaryCategory: "Pediatric dentist",
    additionalCategories: ["Dentist"],
    description:
      "Bright Harbor Pediatric Dentistry opened to serve families in Harbor Ridge with routine cleanings, cavity care, and calm first visits. We explain each step to parents and children and keep Saturday mornings available for working families.",
    phone: "(281) 555-0177",
    websiteUrl: "https://www.brightharbordental.example",
    appointmentUrl: "https://www.brightharbordental.example/schedule",
  },
  configuration: {
    locationType: "STOREFRONT",
    serviceAreas: [],
    hasPublicAddress: true,
    regularHours: weekdayHours("08:00", "17:00", {
      openTime: "08:00",
      closeTime: "12:00",
    }),
    specialHours: [],
    openingDate: "2026-07-10",
  },
  services: [
    { name: "Pediatric cleaning", description: null },
    { name: "Cavity treatment", description: null },
  ],
  products: [],
  attributes: ["welcomes_children"],
  media: {
    photoCount: 10,
    logoPresent: true,
    coverPhotoPresent: true,
    ownerUploadedPhotoCount: 8,
    customerUploadedPhotoCount: 2,
    mostRecentOwnerPhotoAt: daysAgoIso(12),
    mostRecentPhotoAt: daysAgoIso(5),
  },
  activity: {
    posts: [{ publishedAt: daysAgoIso(6), type: "UPDATE" }],
    postCount: 2,
    mostRecentPostAt: daysAgoIso(6),
  },
  reviews: {
    averageRating: 5,
    totalCount: 3,
    ownerResponseCount: 3,
    mostRecentReviewAt: daysAgoIso(7),
    reviews: [
      sampleReview(5, 7, true),
      sampleReview(5, 18, true),
      sampleReview(5, 29, true),
    ],
  },
  conversion: {
    websiteUrl: "https://www.brightharbordental.example",
    phone: "(281) 555-0177",
    appointmentUrl: "https://www.brightharbordental.example/schedule",
    messagingEnabled: true,
    ...emptyConversionExtras,
  },
  businessModel: baseModel({ expectsAppointments: true }),
  localSeoContext: {
    websiteDomain: "brightharbordental.example",
    websiteName: "Bright Harbor Pediatric Dentistry",
    websitePhone: "2815550177",
    websiteAddress: "22 Marina Way, Harbor Ridge, TX",
    localLandingPageUrl: "https://www.brightharbordental.example",
    localLandingPageRelevant: true,
  },
};
