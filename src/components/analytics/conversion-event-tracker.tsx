"use client";

import { useEffect } from "react";
import Clarity from "@microsoft/clarity";

const CONVERSION_EVENTS = {
  contactClicked: "contact_clicked",
  phoneClicked: "phone_clicked",
  emailClicked: "email_clicked",
  quoteStarted: "quote_started",
  quoteSubmitted: "quote_submitted",
  auditStarted: "audit_started",
  auditCompleted: "audit_completed",
} as const;

type ConversionEventName =
  (typeof CONVERSION_EVENTS)[keyof typeof CONVERSION_EVENTS];

const SESSION_EVENT_PREFIX = "jsg-conversion-event-v1-";

function sendGa4Event(name: ConversionEventName): void {
  const gtag = (
    window as Window & {
      gtag?: (
        command: "event",
        eventName: string,
        eventParams?: Record<string, string | number | boolean>,
      ) => void;
    }
  ).gtag;

  if (typeof gtag === "function") {
    gtag("event", name);
  }
}

function sendClarityEvent(name: ConversionEventName): void {
  try {
    Clarity.event(name);
  } catch {
    // Analytics should never interrupt the visitor experience.
  }
}

function trackConversionEvent(
  name: ConversionEventName,
  options: { ga4?: boolean; oncePerSession?: boolean } = {},
): void {
  const { ga4 = true, oncePerSession = false } = options;

  if (oncePerSession) {
    try {
      const storageKey = `${SESSION_EVENT_PREFIX}${name}`;
      if (window.sessionStorage.getItem(storageKey)) {
        return;
      }
      window.sessionStorage.setItem(storageKey, "1");
    } catch {
      // Continue when sessionStorage is unavailable.
    }
  }

  if (ga4) {
    sendGa4Event(name);
  }
  sendClarityEvent(name);
}

function isContactPage(): boolean {
  return window.location.pathname === "/contact";
}

function isWebsiteAuditPage(): boolean {
  return window.location.pathname === "/website-audit";
}

function detectCompletedStates(): void {
  if (isContactPage() && document.querySelector('form [role="status"]')) {
    trackConversionEvent(CONVERSION_EVENTS.quoteSubmitted, {
      oncePerSession: true,
    });
  }

  if (isWebsiteAuditPage() && document.querySelector("#report-priorities")) {
    trackConversionEvent(CONVERSION_EVENTS.auditCompleted, {
      oncePerSession: true,
    });
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
        trackConversionEvent(CONVERSION_EVENTS.phoneClicked);
        return;
      }

      if (href.toLowerCase().startsWith("mailto:")) {
        trackConversionEvent(CONVERSION_EVENTS.emailClicked);
        return;
      }

      try {
        const destination = new URL(href, window.location.href);
        if (
          destination.origin === window.location.origin &&
          destination.pathname === "/contact"
        ) {
          trackConversionEvent(CONVERSION_EVENTS.contactClicked);
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
        trackConversionEvent(CONVERSION_EVENTS.quoteStarted, {
          oncePerSession: true,
        });
      }

      if (
        isWebsiteAuditPage() &&
        target.closest("#website-audit-url")
      ) {
        // GA4 already receives audit_started from the existing audit funnel.
        // Mirror the same event into Clarity without creating a duplicate GA4 event.
        trackConversionEvent(CONVERSION_EVENTS.auditStarted, {
          ga4: false,
          oncePerSession: true,
        });
      }
    }

    function handleSubmit(event: SubmitEvent): void {
      const form = event.target;
      if (!(form instanceof HTMLFormElement)) {
        return;
      }

      if (isContactPage()) {
        trackConversionEvent(CONVERSION_EVENTS.quoteStarted, {
          oncePerSession: true,
        });
      }

      if (isWebsiteAuditPage()) {
        // Covers keyboard/programmatic submission when the URL field was not focused.
        trackConversionEvent(CONVERSION_EVENTS.auditStarted, {
          ga4: false,
          oncePerSession: true,
        });
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
