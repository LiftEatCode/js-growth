import type { BusinessProfileData } from "../types";
import {
  FIXTURE_AS_OF,
  baseModel,
  daysAgoIso,
  emptyConversionExtras,
  sampleReview,
  weekdayHours,
} from "./helpers";

export const averageBusiness: BusinessProfileData = {
  capturedAt: FIXTURE_AS_OF,
  identity: {
    name: "Oak Street Lawn Care",
    primaryCategory: "Landscaper",
    additionalCategories: [],
    description:
      "Mowing and lawn care for Oak Street and nearby neighborhoods. Call for a quote.",
    phone: "(737) 555-0160",
    websiteUrl: "https://oakstreetlawn.example",
    appointmentUrl: "",
  },
  configuration: {
    locationType: "STOREFRONT",
    serviceAreas: [],
    hasPublicAddress: true,
    regularHours: weekdayHours("07:00", "16:00"),
    specialHours: [],
    openingDate: "2014-03-01",
  },
  services: [],
  products: [],
  attributes: [],
  media: {
    photoCount: 5,
    logoPresent: true,
    coverPhotoPresent: false,
    ownerUploadedPhotoCount: 3,
    customerUploadedPhotoCount: 2,
    mostRecentOwnerPhotoAt: daysAgoIso(80),
    mostRecentPhotoAt: daysAgoIso(40),
  },
  activity: {
    posts: [{ publishedAt: daysAgoIso(70), type: "UPDATE" }],
    postCount: 4,
    mostRecentPostAt: daysAgoIso(70),
  },
  reviews: {
    averageRating: 4.2,
    totalCount: 11,
    ownerResponseCount: 6,
    mostRecentReviewAt: daysAgoIso(35),
    reviews: [
      sampleReview(5, 35, true),
      sampleReview(4, 50, false),
      sampleReview(5, 70, true),
      sampleReview(3, 88, true),
      sampleReview(4, 120, false),
    ],
  },
  conversion: {
    websiteUrl: "https://oakstreetlawn.example",
    phone: "(737) 555-0160",
    appointmentUrl: "",
    messagingEnabled: false,
    ...emptyConversionExtras,
  },
  businessModel: baseModel(),
  localSeoContext: null,
};
