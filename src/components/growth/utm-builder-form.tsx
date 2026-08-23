"use client";

import { useMemo, useState } from "react";

import { Button, Input } from "@/components/ui";
import {
  buildUtmUrl,
  FACEBOOK_FOUNDER_UTM,
  FACEBOOK_PAGE_UTM,
  GBP_UTM,
  UTM_MEDIUMS,
  UTM_SOURCES,
} from "@/lib/growth";

const SITE_DEFAULT = "https://jsgrowth.com";

export function UtmBuilderForm() {
  const [destinationUrl, setDestinationUrl] = useState(
    `${SITE_DEFAULT}/website-audit`,
  );
  const [source, setSource] = useState<string>("facebook");
  const [medium, setMedium] = useState<string>("organic_social");
  const [campaign, setCampaign] = useState("website_growth");
  const [content, setContent] = useState("");
  const [copied, setCopied] = useState(false);

  const result = useMemo(
    () =>
      buildUtmUrl({
        destinationUrl,
        source,
        medium,
        campaign,
        content: content || undefined,
      }),
    [destinationUrl, source, medium, campaign, content],
  );

  async function copyUrl() {
    if (!result.ok) {
      return;
    }
    try {
      await navigator.clipboard.writeText(result.url);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  }

  function applyPreset(
    preset: "facebook_page" | "facebook_founder" | "gbp",
  ) {
    if (preset === "facebook_page") {
      setSource(FACEBOOK_PAGE_UTM.source);
      setMedium(FACEBOOK_PAGE_UTM.medium);
      setCampaign("website_growth");
      return;
    }
    if (preset === "facebook_founder") {
      setSource(FACEBOOK_FOUNDER_UTM.source);
      setMedium(FACEBOOK_FOUNDER_UTM.medium);
      setCampaign(FACEBOOK_FOUNDER_UTM.campaign);
      return;
    }
    setSource(GBP_UTM.source);
    setMedium(GBP_UTM.medium);
    setCampaign("gbp_website");
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap gap-2">
        <Button
          type="button"
          size="sm"
          variant="outline"
          onClick={() => applyPreset("facebook_page")}
        >
          Facebook Page
        </Button>
        <Button
          type="button"
          size="sm"
          variant="outline"
          onClick={() => applyPreset("facebook_founder")}
        >
          Founder Facebook
        </Button>
        <Button
          type="button"
          size="sm"
          variant="outline"
          onClick={() => applyPreset("gbp")}
        >
          Google Business Profile
        </Button>
      </div>

      <label className="block space-y-2">
        <span className="text-sm font-semibold text-brand">Destination URL</span>
        <Input
          value={destinationUrl}
          onChange={(event) => setDestinationUrl(event.target.value)}
          placeholder="https://jsgrowth.com/website-audit"
        />
      </label>

      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block space-y-2">
          <span className="text-sm font-semibold text-brand">Source</span>
          <select
            className="flex h-10 w-full rounded-xl border border-border bg-white px-3 text-sm"
            value={source}
            onChange={(event) => setSource(event.target.value)}
          >
            {UTM_SOURCES.map((value) => (
              <option key={value} value={value}>
                {value}
              </option>
            ))}
            <option value="custom">custom…</option>
          </select>
          {source === "custom" || !UTM_SOURCES.includes(source as never) ? (
            <Input
              value={source === "custom" ? "" : source}
              onChange={(event) => setSource(event.target.value)}
              placeholder="custom_source"
            />
          ) : null}
        </label>

        <label className="block space-y-2">
          <span className="text-sm font-semibold text-brand">Medium</span>
          <select
            className="flex h-10 w-full rounded-xl border border-border bg-white px-3 text-sm"
            value={medium}
            onChange={(event) => setMedium(event.target.value)}
          >
            {UTM_MEDIUMS.map((value) => (
              <option key={value} value={value}>
                {value}
              </option>
            ))}
          </select>
        </label>

        <label className="block space-y-2">
          <span className="text-sm font-semibold text-brand">Campaign</span>
          <Input
            value={campaign}
            onChange={(event) => setCampaign(event.target.value)}
            placeholder="website_growth"
          />
        </label>

        <label className="block space-y-2">
          <span className="text-sm font-semibold text-brand">Content (optional)</span>
          <Input
            value={content}
            onChange={(event) => setContent(event.target.value)}
            placeholder="website_leads_post_01"
          />
        </label>
      </div>

      <div className="rounded-2xl border border-border bg-slate-50 p-4">
        <p className="text-xs font-semibold uppercase tracking-[0.12em] text-muted">
          Encoded URL
        </p>
        {result.ok ? (
          <p className="mt-2 break-all font-mono text-sm text-brand">{result.url}</p>
        ) : (
          <p className="mt-2 text-sm text-red-600">{result.error}</p>
        )}
        <div className="mt-4">
          <Button
            type="button"
            disabled={!result.ok}
            onClick={() => void copyUrl()}
          >
            {copied ? "Copied" : "Copy URL"}
          </Button>
        </div>
      </div>
    </div>
  );
}
