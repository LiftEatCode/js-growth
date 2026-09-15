import type { BusinessProfileData } from "../types";
import {
  FIXTURE_AS_OF,
  baseModel,
  daysAgoIso,
  emptyConversionExtras,
  sampleReview,
  weekdayHours,
} from "./helpers";

export const serviceAreaBusiness: BusinessProfileData = {
  capturedAt: FIXTURE_AS_OF,
  identity: {
    name: "Hill Country Mobile Pet Grooming",
    primaryCategory: "Mobile pet groomer",
    additionalCategories: ["Pet groomer"],
    description:
      "Hill Country Mobile Pet Grooming brings wash, trim, and nail care to driveways in Austin, Round Rock, Cedar Park, and Georgetown. We work from a custom van so pets stay in a familiar setting. Appointments are scheduled online; we do not have a customer storefront.",
    phone: "(512) 555-0182",
    websiteUrl: "https://www.hillcountrymobilegrooming.example",
    appointmentUrl: "https://www.hillcountrymobilegrooming.example/book",
  },
  configuration: {
    locationType: "SERVICE_AREA",
    serviceAreas: ["Austin, TX", "Round Rock, TX", "Cedar Park, TX", "Georgetown, TX"],
    hasPublicAddress: false,
    regularHours: weekdayHours("08:00", "18:00"),
    specialHours: [],
    openingDate: "2019-05-20",
  },
  services: [
    { name: "Full groom", description: "Bath, trim, nails" },
    { name: "Bath and brush", description: null },
    { name: "Nail trim", description: null },
  ],
  products: [],
  attributes: ["comes_to_you"],
  media: {
    photoCount: 16,
    logoPresent: true,
    coverPhotoPresent: true,
    ownerUploadedPhotoCount: 12,
    customerUploadedPhotoCount: 4,
    mostRecentOwnerPhotoAt: daysAgoIso(14),
    mostRecentPhotoAt: daysAgoIso(9),
  },
  activity: {
    posts: [
      { publishedAt: daysAgoIso(10), type: "UPDATE" },
      { publishedAt: daysAgoIso(28), type: "UPDATE" },
    ],
    postCount: 14,
    mostRecentPostAt: daysAgoIso(10),
  },
  reviews: {
    averageRating: 4.9,
    totalCount: 41,
    ownerResponseCount: 38,
    mostRecentReviewAt: daysAgoIso(5),
    reviews: [
      sampleReview(5, 5, true),
      sampleReview(5, 16, true),
      sampleReview(4, 33, true),
    ],
  },
  conversion: {
    websiteUrl: "https://www.hillcountrymobilegrooming.example",
    phone: "(512) 555-0182",
    appointmentUrl: "https://www.hillcountrymobilegrooming.example/book",
    messagingEnabled: true,
    ...emptyConversionExtras,
  },
  businessModel: baseModel({ expectsAppointments: true }),
  localSeoContext: {
    websiteDomain: "hillcountrymobilegrooming.example",
    websiteName: "Hill Country Mobile Pet Grooming",
    websitePhone: "(512) 555-0182",
    websiteAddress: null,
    localLandingPageUrl: "https://www.hillcountrymobilegrooming.example/austin",
    localLandingPageRelevant: true,
  },
};
