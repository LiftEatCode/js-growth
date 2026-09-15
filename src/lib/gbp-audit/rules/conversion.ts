import { createGbpFinding } from "../engine";
import type { GbpAuditRule } from "../types";
import { hasOpenHours, hasText } from "../utils";

export const conversionPhoneRule: GbpAuditRule = {
  id: "conversion.phone",
  category: "conversion_readiness",
  title: "Phone available to call",
  evaluate({ profile }) {
    const phone = profile.conversion.phone ?? profile.identity.phone;
    if (phone === null) {
      return createGbpFinding({
        id: "conversion.phone",
        category: "conversion_readiness",
        title: "Phone available to call",
        status: "insufficient_data",
        summary: "Phone was not observed.",
        whyItMatters:
          "Overlaps Profile phone. Conversion asks whether a customer can tap-to-call.",
        recommendation: "Refresh contact fields.",
        evidence: { phone: null },
      });
    }

    if (!hasText(phone)) {
      return createGbpFinding({
        id: "conversion.phone",
        category: "conversion_readiness",
        title: "Phone available to call",
        status: "fail",
        summary: "No phone number is available for customers to call.",
        whyItMatters: "Many local customers still convert by phone.",
        recommendation: "Add the main inbound number to the profile.",
        evidence: { phone: "" },
      });
    }

    return createGbpFinding({
      id: "conversion.phone",
      category: "conversion_readiness",
      title: "Phone available to call",
      status: "pass",
      summary: "A phone number is available.",
      whyItMatters: "Call is a primary action from Maps.",
      recommendation: "Confirm the number is monitored during published hours.",
      evidence: { phone: phone.trim() },
    });
  },
};

export const conversionWebsiteRule: GbpAuditRule = {
  id: "conversion.website",
  category: "conversion_readiness",
  title: "Website available",
  evaluate({ profile }) {
    const url = profile.conversion.websiteUrl ?? profile.identity.websiteUrl;
    if (url === null) {
      return createGbpFinding({
        id: "conversion.website",
        category: "conversion_readiness",
        title: "Website available",
        status: "insufficient_data",
        summary: "Website was not observed.",
        whyItMatters:
          "Overlaps Profile website. Conversion asks whether the website action exists.",
        recommendation: "Refresh contact fields.",
        evidence: { websiteUrl: null },
      });
    }

    if (!hasText(url)) {
      return createGbpFinding({
        id: "conversion.website",
        category: "conversion_readiness",
        title: "Website available",
        status: "fail",
        summary: "No website is available from the profile.",
        whyItMatters: "Customers who want to read more have nowhere to go.",
        recommendation: "Add a working website URL.",
        evidence: { websiteUrl: "" },
      });
    }

    return createGbpFinding({
      id: "conversion.website",
      category: "conversion_readiness",
      title: "Website available",
      status: "pass",
      summary: "A website URL is available.",
      whyItMatters: "Website is a primary Maps action besides call.",
      recommendation: "Send visitors to a page that can take the next step.",
      evidence: { websiteUrl: url.trim() },
    });
  },
};

export const conversionCtaRule: GbpAuditRule = {
  id: "conversion.cta",
  category: "conversion_readiness",
  title: "Booking or ordering CTA",
  evaluate({ profile }) {
    const model = profile.businessModel;
    const conversion = profile.conversion;
    const hasAppointment = hasText(conversion.appointmentUrl ?? profile.identity.appointmentUrl);
    const hasOrdering = hasText(conversion.orderingUrl);
    const hasReservation = hasText(conversion.reservationUrl);
    const hasMenu = hasText(conversion.menuUrl);

    const expectsSomething =
      model.expectsAppointments === true ||
      model.expectsOnlineOrdering === true ||
      model.expectsReservations === true ||
      model.expectsMenu === true;

    const expectsNothing =
      model.expectsAppointments === false &&
      model.expectsOnlineOrdering === false &&
      model.expectsReservations === false &&
      model.expectsMenu === false;

    const unknownModel =
      model.expectsAppointments === null &&
      model.expectsOnlineOrdering === null &&
      model.expectsReservations === null &&
      model.expectsMenu === null;

    if (hasAppointment || hasOrdering || hasReservation || hasMenu) {
      return createGbpFinding({
        id: "conversion.cta",
        category: "conversion_readiness",
        title: "Booking or ordering CTA",
        status: "pass",
        summary: "A booking, ordering, reservation, or menu URL is present.",
        whyItMatters: "Extra actions help customers convert without a phone call.",
        recommendation: "Keep the destination URL working.",
        evidence: {
          hasAppointment,
          hasOrdering,
          hasReservation,
          hasMenu,
        },
      });
    }

    if (expectsNothing || unknownModel) {
      return createGbpFinding({
        id: "conversion.cta",
        category: "conversion_readiness",
        title: "Booking or ordering CTA",
        status: "not_applicable",
        summary: unknownModel
          ? "No booking-style URLs, and the business model was not marked as needing them."
          : "This business model is not expected to use appointment, order, reservation, or menu links.",
        whyItMatters:
          "Plumbers and many trades convert by phone. Missing OpenTable is not a defect for them.",
        recommendation: "Add a booking URL only if customers actually book online.",
        evidence: {
          expectsAppointments: model.expectsAppointments,
          expectsOnlineOrdering: model.expectsOnlineOrdering,
          expectsReservations: model.expectsReservations,
          expectsMenu: model.expectsMenu,
        },
      });
    }

    if (expectsSomething) {
      return createGbpFinding({
        id: "conversion.cta",
        category: "conversion_readiness",
        title: "Booking or ordering CTA",
        status: "fail",
        summary: "The business model expects an online CTA, but none is configured.",
        whyItMatters: "Customers who want to book or order have to hunt for another path.",
        recommendation:
          "Add the matching appointment, reservation, ordering, or menu URL on the profile.",
        evidence: {
          expectsAppointments: model.expectsAppointments,
          expectsOnlineOrdering: model.expectsOnlineOrdering,
          expectsReservations: model.expectsReservations,
          expectsMenu: model.expectsMenu,
        },
      });
    }

    return createGbpFinding({
      id: "conversion.cta",
      category: "conversion_readiness",
      title: "Booking or ordering CTA",
      status: "not_applicable",
      summary: "No applicable online CTA for this model.",
      whyItMatters: "Do not penalize irrelevant GBP features.",
      recommendation: "No change required.",
      evidence: {},
    });
  },
};

export const conversionHoursRule: GbpAuditRule = {
  id: "conversion.hours",
  category: "conversion_readiness",
  title: "Hours available for contact timing",
  evaluate({ profile }) {
    const hours = profile.configuration.regularHours;
    if (hours === null) {
      return createGbpFinding({
        id: "conversion.hours",
        category: "conversion_readiness",
        title: "Hours available for contact timing",
        status: "insufficient_data",
        summary: "Hours were not observed.",
        whyItMatters:
          "Overlaps Profile hours. Conversion asks whether customers know when to call.",
        recommendation: "Refresh hours data.",
        evidence: { regularHours: null },
      });
    }

    if (!hasOpenHours(hours)) {
      return createGbpFinding({
        id: "conversion.hours",
        category: "conversion_readiness",
        title: "Hours available for contact timing",
        status: "fail",
        summary: "No open hours are published.",
        whyItMatters: "People hesitate to call when they cannot tell if anyone is available.",
        recommendation: "Publish hours or state appointment-only clearly.",
        evidence: { openDayCount: 0 },
      });
    }

    return createGbpFinding({
      id: "conversion.hours",
      category: "conversion_readiness",
      title: "Hours available for contact timing",
      status: "pass",
      summary: "Hours are published so customers can time contact.",
      whyItMatters: "Hours support the call action.",
      recommendation: "Keep holiday hours updated.",
      evidence: { openDayCount: hours.filter((day) => !day.closed).length },
    });
  },
};

export const actionPathRule: GbpAuditRule = {
  id: "conversion.action_path",
  category: "conversion_readiness",
  title: "Clear customer action path",
  evaluate({ profile }) {
    const phone = hasText(profile.conversion.phone ?? profile.identity.phone);
    const website = hasText(
      profile.conversion.websiteUrl ?? profile.identity.websiteUrl,
    );
    const appointment = hasText(
      profile.conversion.appointmentUrl ?? profile.identity.appointmentUrl,
    );
    const messaging = profile.conversion.messagingEnabled;
    const ordering = hasText(profile.conversion.orderingUrl);
    const reservation = hasText(profile.conversion.reservationUrl);

    const knownActions = [phone, website, appointment, ordering, reservation];
    if (messaging === true) {
      knownActions.push(true);
    }

    if (knownActions.some(Boolean)) {
      return createGbpFinding({
        id: "conversion.action_path",
        category: "conversion_readiness",
        title: "Clear customer action path",
        status: "pass",
        summary: "At least one clear action is available (call, website, book, message, order, or reserve).",
        whyItMatters:
          "Customers need a next step. One working path is enough; this rule does not require every GBP feature.",
        recommendation: "Make sure the primary action is monitored.",
        evidence: {
          phone,
          website,
          appointment,
          messagingEnabled: messaging,
          ordering,
          reservation,
        },
      });
    }

    const allContactUnknown =
      (profile.identity.phone === null || profile.conversion.phone === null) &&
      (profile.identity.websiteUrl === null || profile.conversion.websiteUrl === null) &&
      messaging === null;

    if (allContactUnknown && !phone && !website) {
      return createGbpFinding({
        id: "conversion.action_path",
        category: "conversion_readiness",
        title: "Clear customer action path",
        status: "insufficient_data",
        summary: "Contact actions were not observed clearly enough to score.",
        whyItMatters: "Unknown contact fields are not treated as zero conversion paths.",
        recommendation: "Refresh conversion fields.",
        evidence: { phone, website, messagingEnabled: messaging },
      });
    }

    return createGbpFinding({
      id: "conversion.action_path",
      category: "conversion_readiness",
      title: "Clear customer action path",
      status: "fail",
      summary: "No call, website, booking, messaging, or ordering action is available.",
      whyItMatters: "A profile without a next step cannot convert interest into contact.",
      recommendation: "Add a phone number or website at minimum.",
      evidence: {
        phone,
        website,
        appointment,
        messagingEnabled: messaging,
        ordering,
        reservation,
      },
    });
  },
};

export const conversionRules: GbpAuditRule[] = [
  conversionPhoneRule,
  conversionWebsiteRule,
  conversionCtaRule,
  conversionHoursRule,
  actionPathRule,
];
