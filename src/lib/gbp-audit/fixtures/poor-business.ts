import type { BusinessProfileData } from "../types";
import {
  FIXTURE_AS_OF,
  baseModel,
  daysAgoIso,
  emptyConversionExtras,
  sampleReview,
} from "./helpers";

export const poorBusiness: BusinessProfileData = {
  capturedAt: FIXTURE_AS_OF,
  identity: {
    name: "Fast Patch Auto",
    primaryCategory: "Auto repair shop",
    additionalCategories: [],
    description: "We fix cars.",
    phone: "",
    websiteUrl: "",
    appointmentUrl: "",
  },
  configuration: {
    locationType: "STOREFRONT",
    serviceAreas: [],
    hasPublicAddress: true,
    regularHours: [],
    specialHours: [],
    openingDate: "2011-09-15",
  },
  services: [],
  products: [],
  attributes: [],
  media: {
    photoCount: 1,
    logoPresent: false,
    coverPhotoPresent: false,
    ownerUploadedPhotoCount: 0,
    customerUploadedPhotoCount: 1,
    mostRecentOwnerPhotoAt: null,
    mostRecentPhotoAt: daysAgoIso(400),
  },
  activity: {
    posts: [],
    postCount: 0,
    mostRecentPostAt: null,
  },
  reviews: {
    averageRating: 3.1,
    totalCount: 2,
    ownerResponseCount: 0,
    mostRecentReviewAt: daysAgoIso(400),
    reviews: [sampleReview(2, 400, false), sampleReview(4, 520, false)],
  },
  conversion: {
    websiteUrl: "",
    phone: "",
    appointmentUrl: "",
    messagingEnabled: false,
    ...emptyConversionExtras,
  },
  businessModel: baseModel(),
  localSeoContext: null,
};
