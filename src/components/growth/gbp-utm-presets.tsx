"use client";

import { useMemo, useState } from "react";

import { Button, Input } from "@/components/ui";
import { buildUtmUrl } from "@/lib/growth";
import {
  GBP_POST_UTM,
  GBP_WEBSITE_UTM,
  buildGbpPostContent,
} from "@/lib/growth/acquisition-capture";

const SITE_DEFAULT = "https://jsgrowth.com";

export function GbpUtmPresets() {
  const [destination, setDestination] = useState(
    `${SITE_DEFAULT}/website-audit`,
  );
  const [postSlug, setPostSlug] = useState("seo_services_001");
  const [copied, setCopied] = useState(false);

  const websiteResult = useMemo(
    () =>
      buildUtmUrl({
        destinationUrl: destination,
        ...GBP_WEBSITE_UTM,
      }),
    [destination],
  );

  const postContent = buildGbpPostContent(postSlug);
  const postResult = useMemo(() => {
    if (!postContent) {
      return { ok: false as const, error: "Invalid slug" };
    }
    return buildUtmUrl({
      destinationUrl: destination,
      ...GBP_POST_UTM,
      content: postContent,
    });
  }, [destination, postContent]);

  async function copy(url: string) {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  }

  return (
    <div
      className="space-y-4 rounded-2xl border border-border bg-white p-6"
      data-testid="gbp-utm-presets"
    >
      <p className="text-sm font-semibold text-brand">GBP UTM presets</p>
      <p className="text-xs text-muted">
        Canonical: source={GBP_WEBSITE_UTM.source} · medium=
        {GBP_WEBSITE_UTM.medium} · campaign={GBP_WEBSITE_UTM.campaign}. No
        sensitive data in UTMs.
      </p>
      <label className="block space-y-1 text-sm">
        <span className="font-medium">Destination URL</span>
        <Input
          value={destination}
          onChange={(e) => setDestination(e.target.value)}
          data-testid="gbp-utm-destination"
        />
      </label>
      <div className="space-y-2">
        <p className="text-xs font-semibold uppercase tracking-wide text-muted">
          Website link
        </p>
        <p className="break-all font-mono text-xs" data-testid="gbp-utm-website">
          {websiteResult.ok ? websiteResult.url : websiteResult.error}
        </p>
        {websiteResult.ok ? (
          <Button
            type="button"
            size="sm"
            onClick={() => copy(websiteResult.url)}
            data-testid="gbp-utm-copy-website"
          >
            Copy website UTM
          </Button>
        ) : null}
      </div>
      <div className="space-y-2">
        <p className="text-xs font-semibold uppercase tracking-wide text-muted">
          Post link
        </p>
        <label className="block space-y-1 text-sm">
          <span className="font-medium">Post slug</span>
          <Input
            value={postSlug}
            onChange={(e) => setPostSlug(e.target.value)}
            data-testid="gbp-utm-post-slug"
          />
        </label>
        <p className="text-xs text-muted">
          utm_content={postContent ?? "INVALID"}
        </p>
        <p className="break-all font-mono text-xs" data-testid="gbp-utm-post">
          {postResult.ok ? postResult.url : postResult.error}
        </p>
        {postResult.ok ? (
          <Button
            type="button"
            size="sm"
            onClick={() => copy(postResult.url)}
            data-testid="gbp-utm-copy-post"
          >
            Copy post UTM
          </Button>
        ) : null}
      </div>
      {copied ? (
        <p className="text-xs text-green-700" data-testid="gbp-utm-copied">
          Copied
        </p>
      ) : null}
    </div>
  );
}
