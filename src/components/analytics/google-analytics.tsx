"use client";

import Script from "next/script";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

import { buildAnalyticsPageViewParams } from "@/lib/analytics/page-path";

const GA_MEASUREMENT_ID_PATTERN = /^G-[A-Z0-9]+$/i;

function sendSanitizedPageView(pathname: string): void {
  const gtag = (
    window as Window & {
      gtag?: (
        command: "event",
        eventName: string,
        eventParams?: Record<string, string | number | boolean>,
      ) => void;
    }
  ).gtag;

  if (typeof gtag !== "function") {
    return;
  }

  gtag(
    "event",
    "page_view",
    buildAnalyticsPageViewParams({
      origin: window.location.origin,
      pathname,
      search: window.location.search,
      title: document.title,
      referrer: document.referrer,
    }),
  );
}

export function GoogleAnalytics({ gaId }: { gaId: string }) {
  const pathname = usePathname();
  const [ready, setReady] = useState(false);
  const measurementId = gaId.trim();

  useEffect(() => {
    if (!ready) {
      return;
    }

    sendSanitizedPageView(pathname);
  }, [pathname, ready]);

  if (!GA_MEASUREMENT_ID_PATTERN.test(measurementId)) {
    return null;
  }

  return (
    <>
      <Script
        id="_next-ga-init"
        strategy="afterInteractive"
        dangerouslySetInnerHTML={{
          __html: `
          window.dataLayer = window.dataLayer || [];
          function gtag(){window.dataLayer.push(arguments);}
          gtag('js', new Date());
          gtag('config', '${measurementId}', { send_page_view: false });`,
        }}
      />
      <Script
        id="_next-ga"
        src={`https://www.googletagmanager.com/gtag/js?id=${measurementId}`}
        strategy="afterInteractive"
        onReady={() => setReady(true)}
      />
    </>
  );
}
