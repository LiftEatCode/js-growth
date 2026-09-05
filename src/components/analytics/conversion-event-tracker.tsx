"use client";

import { useEffect } from "react";

import {
  CONVERSION_EVENTS,
  trackConversionEvent,
} from "@/lib/analytics/conversions";

function isContactPage(): boolean {
  return window.location.pathname === "/contact";
}

function isWebsiteAuditPage(): boolean {
  return window.location.pathname === "/website-audit";
}

function detectCompletedStates(): void {
  if (isContactPage() && document.querySelector('form [role="status"]')) {
    trackConversionEvent(
      CONVERSION_EVENTS.quoteSubmitted,
      {
        placement: "contact_page",
        form_name: "contact",
        surface: "contact_form",
      },
      { oncePerSession: true },
    );
  }

  if (isWebsiteAuditPage() && document.querySelector("#report-priorities")) {
    trackConversionEvent(
      CONVERSION_EVENTS.auditCompleted,
      {
        placement: "audit_landing",
        surface: "website_audit",
        report_context: "inline_landing",
      },
      { oncePerSession: true },
    );
  }
}

export function ConversionEventTracker() {
  useEffect(() => {
    function handleClick(event: MouseEvent): void {
      const target = event.target;
      if (!(target instanceof Element)) {
        return;
      }

      const anchor = target.closest("a[href]");
      if (!(anchor instanceof HTMLAnchorElement)) {
        return;
      }

      const href = anchor.getAttribute("href")?.trim();
      if (!href) {
        return;
      }

      if (href.toLowerCase().startsWith("tel:")) {
        trackConversionEvent(CONVERSION_EVENTS.phoneClicked, {
          surface: "global_link",
        });
        return;
      }

      if (href.toLowerCase().startsWith("mailto:")) {
        trackConversionEvent(CONVERSION_EVENTS.emailClicked, {
          surface: "global_link",
        });
        return;
      }

      try {
        const destination = new URL(href, window.location.href);
        if (
          destination.origin === window.location.origin &&
          destination.pathname === "/contact"
        ) {
          trackConversionEvent(CONVERSION_EVENTS.contactClicked, {
            surface: "contact_link",
          });
        }
      } catch {
        // Ignore malformed or non-navigation href values.
      }
    }

    function handleFocusIn(event: FocusEvent): void {
      const target = event.target;
      if (!(target instanceof Element)) {
        return;
      }

      if (isContactPage() && target.closest("form")) {
        trackConversionEvent(
          CONVERSION_EVENTS.quoteStarted,
          {
            placement: "contact_page",
            form_name: "contact",
            surface: "contact_form",
          },
          { oncePerSession: true },
        );
      }

      if (
        isWebsiteAuditPage() &&
        target.closest("#website-audit-url")
      ) {
        // GA4 already receives audit_started from the existing audit funnel.
        // Mirror the same event into Clarity without creating a duplicate GA4 event.
        trackConversionEvent(
          CONVERSION_EVENTS.auditStarted,
          {
            placement: "audit_landing",
            surface: "website_audit",
          },
          {
            ga4: false,
            oncePerSession: true,
          },
        );
      }
    }

    function handleSubmit(event: SubmitEvent): void {
      const form = event.target;
      if (!(form instanceof HTMLFormElement)) {
        return;
      }

      if (isContactPage()) {
        trackConversionEvent(
          CONVERSION_EVENTS.quoteStarted,
          {
            placement: "contact_page",
            form_name: "contact",
            surface: "contact_form",
          },
          { oncePerSession: true },
        );
      }

      if (isWebsiteAuditPage()) {
        // Covers keyboard/programmatic submission when the URL field was not focused.
        trackConversionEvent(
          CONVERSION_EVENTS.auditStarted,
          {
            placement: "audit_landing",
            surface: "website_audit",
          },
          {
            ga4: false,
            oncePerSession: true,
          },
        );
      }
    }

    document.addEventListener("click", handleClick, true);
    document.addEventListener("focusin", handleFocusIn, true);
    document.addEventListener("submit", handleSubmit, true);

    detectCompletedStates();
    const observer = new MutationObserver(detectCompletedStates);
    observer.observe(document.body, {
      childList: true,
      subtree: true,
    });

    return () => {
      document.removeEventListener("click", handleClick, true);
      document.removeEventListener("focusin", handleFocusIn, true);
      document.removeEventListener("submit", handleSubmit, true);
      observer.disconnect();
    };
  }, []);

  return null;
}
