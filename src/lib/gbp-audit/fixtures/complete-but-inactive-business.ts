import type { BusinessProfileData } from "../types";
import {
  FIXTURE_AS_OF,
  baseModel,
  daysAgoIso,
  emptyConversionExtras,
  sampleReview,
  weekdayHours,
} from "./helpers";

/** Once well-filled, then neglected for ~10 months. */
export const completeButInactiveBusiness: BusinessProfileData = {
  capturedAt: FIXTURE_AS_OF,
  identity: {
    name: "Riverside Piano Studio",
    primaryCategory: "Piano teacher",
    additionalCategories: ["Music school"],
    description:
      "Riverside Piano Studio teaches beginners through intermediate students in the Harbor View neighborhood. Lessons cover technique, reading, and recital prep. The studio has a waiting list in the fall and keeps a regular weekday schedule for after-school lessons.",
    phone: "(713) 555-0144",
    websiteUrl: "https://www.riversidepianostudio.example",
    appointmentUrl: "https://www.riversidepianostudio.example/lessons",
  },
  configuration: {
    locationType: "STOREFRONT",
    serviceAreas: [],
    hasPublicAddress: true,
    regularHours: weekdayHours("14:00", "20:00", {
      openTime: "09:00",
      closeTime: "13:00",
    }),
    specialHours: [],
    openingDate: "2016-09-08",
  },
  services: [
    { name: "Private piano lessons", description: "30 and 45 minute sessions" },
    { name: "Recital preparation", description: null },
  ],
  products: [],
  attributes: ["welcomes_children"],
  media: {
    photoCount: 22,
    logoPresent: true,
    coverPhotoPresent: true,
    ownerUploadedPhotoCount: 16,
    customerUploadedPhotoCount: 6,
    mostRecentOwnerPhotoAt: daysAgoIso(310),
    mostRecentPhotoAt: daysAgoIso(200),
  },
  activity: {
    posts: [],
    postCount: 0,
    mostRecentPostAt: null,
  },
  reviews: {
    averageRating: 4.6,
    totalCount: 52,
    ownerResponseCount: 41,
    mostRecentReviewAt: daysAgoIso(300),
    reviews: [
      sampleReview(5, 300, true),
      sampleReview(4, 340, true),
      sampleReview(5, 400, true),
      sampleReview(5, 520, false),
    ],
  },
  conversion: {
    websiteUrl: "https://www.riversidepianostudio.example",
    phone: "(713) 555-0144",
    appointmentUrl: "https://www.riversidepianostudio.example/lessons",
    messagingEnabled: true,
    ...emptyConversionExtras,
  },
  businessModel: baseModel({ expectsAppointments: true }),
  localSeoContext: {
    websiteDomain: "riversidepianostudio.example",
    websiteName: "Riverside Piano Studio",
    websitePhone: "713-555-0144",
    websiteAddress: "88 Riverwalk Ct, Harbor View, TX",
    localLandingPageUrl: "https://www.riversidepianostudio.example/piano-lessons",
    localLandingPageRelevant: true,
  },
};
