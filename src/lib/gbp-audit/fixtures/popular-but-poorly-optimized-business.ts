import type { BusinessProfileData } from "../types";
import {
  FIXTURE_AS_OF,
  baseModel,
  daysAgoIso,
  sampleReview,
  weekdayHours,
} from "./helpers";

/** Strong customer demand; weak owner-controlled optimization. */
export const popularButPoorlyOptimizedBusiness: BusinessProfileData = {
  capturedAt: FIXTURE_AS_OF,
  identity: {
    name: "Metro Burger Shack",
    primaryCategory: "Hamburger restaurant",
    additionalCategories: [],
    description: "Family-owned burgers, fries, and shakes downtown. Come hungry.",
    phone: "(214) 555-0190",
    websiteUrl: "https://metroburgershack.example",
    appointmentUrl: "",
  },
  configuration: {
    locationType: "STOREFRONT",
    serviceAreas: [],
    hasPublicAddress: true,
    regularHours: weekdayHours("11:00", "21:00", {
      openTime: "11:00",
      closeTime: "22:00",
    }),
    specialHours: [],
    openingDate: "2010-02-14",
  },
  services: [],
  products: [],
  attributes: [],
  media: {
    photoCount: 48,
    logoPresent: true,
    coverPhotoPresent: false,
    ownerUploadedPhotoCount: 2,
    customerUploadedPhotoCount: 46,
    mostRecentOwnerPhotoAt: daysAgoIso(210),
    mostRecentPhotoAt: daysAgoIso(4),
  },
  activity: {
    posts: [],
    postCount: 0,
    mostRecentPostAt: null,
  },
  reviews: {
    averageRating: 4.7,
    totalCount: 312,
    ownerResponseCount: 48,
    mostRecentReviewAt: daysAgoIso(2),
    reviews: [
      sampleReview(5, 2, false),
      sampleReview(5, 6, false),
      sampleReview(4, 9, false),
      sampleReview(3, 14, false),
      sampleReview(5, 21, true),
      sampleReview(5, 40, false),
    ],
  },
  conversion: {
    websiteUrl: "https://metroburgershack.example",
    phone: "(214) 555-0190",
    appointmentUrl: "",
    messagingEnabled: false,
    orderingUrl: "",
    menuUrl: "",
    reservationUrl: "",
  },
  businessModel: baseModel({
    expectsAppointments: false,
    expectsOnlineOrdering: true,
    expectsReservations: false,
    expectsMenu: true,
  }),
  localSeoContext: null,
};
