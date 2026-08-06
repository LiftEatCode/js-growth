import {
    ExternalLink,
    FileCode2,
    Globe2,
    ImageIcon,
    Link2,
    ListTree,
    MapPin,
  } from "lucide-react";
  
  import { AuditScore } from "@/components/website-audit/audit-score";
  import { FindingCard } from "@/components/website-audit/finding-card";
  import { Badge } from "@/components/ui/badge";
  import type {
    AuditFinding,
    WebsiteAuditResult,
  } from "@/lib/website-audit/types";
  
  interface AuditResultsProps {
    result: WebsiteAuditResult;
  }
  
  function sortFindings(
    findings: AuditFinding[],
  ): AuditFinding[] {
    const priority = {
      fail: 0,
      warning: 1,
      pass: 2,
    };
  
    return [...findings].sort((a, b) => {
      const statusDifference =
        priority[a.status] - priority[b.status];
  
      if (statusDifference !== 0) {
        return statusDifference;
      }
  
      return b.scoreImpact - a.scoreImpact;
    });
  }
  
  function formatDate(value: string): string {
    return new Intl.DateTimeFormat("en-US", {
      dateStyle: "medium",
      timeStyle: "short",
    }).format(new Date(value));
  }
  
  export function AuditResults({
    result,
  }: AuditResultsProps) {
    const sortedFindings = sortFindings(result.findings);
  
    return (
      <div className="space-y-8">
        <section className="rounded-2xl border border-border bg-card p-6 shadow-sm">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
            <div className="min-w-0">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Globe2
                  aria-hidden="true"
                  className="size-4"
                />
                Audited website
              </div>
  
              <h2 className="mt-2 break-all text-2xl font-semibold tracking-tight text-foreground">
                {result.metadata.finalUrl}
              </h2>
  
              {result.metadata.requestedUrl !==
              result.metadata.finalUrl ? (
                <p className="mt-2 break-all text-sm text-muted-foreground">
                  Requested: {result.metadata.requestedUrl}
                </p>
              ) : null}
  
              <p className="mt-2 text-sm text-muted-foreground">
                Audited {formatDate(result.metadata.fetchedAt)}
              </p>
            </div>
  
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="outline">
                HTTP {result.metadata.statusCode}
              </Badge>
  
              <Badge variant="secondary">
                {result.metadata.contentType ??
                  "Unknown content type"}
              </Badge>
  
              <a
                href={result.metadata.finalUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:underline"
              >
                Open website
                <ExternalLink
                  aria-hidden="true"
                  className="size-4"
                />
              </a>
            </div>
          </div>
        </section>
  
        <AuditScore
          overallScore={result.overallScore}
          categoryScores={result.categoryScores}
          summary={result.summary}
        />
  
        <section
          aria-labelledby="page-details-heading"
          className="rounded-2xl border border-border bg-card p-6 shadow-sm"
        >
          <div>
            <p className="text-sm font-medium text-primary">
              Page analysis
            </p>
  
            <h2
              id="page-details-heading"
              className="mt-1 text-2xl font-semibold tracking-tight text-foreground"
            >
              Homepage details
            </h2>
          </div>
  
          <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <DetailCard
              icon={ListTree}
              label="Headings"
              value={`${result.pageData.h1Count} H1 · ${result.pageData.h2Count} H2 · ${result.pageData.h3Count} H3`}
            />
  
            <DetailCard
              icon={ImageIcon}
              label="Images"
              value={`${result.pageData.imageCount} total · ${result.pageData.imagesWithoutAlt} missing alt`}
            />
  
            <DetailCard
              icon={Link2}
              label="Links"
              value={`${result.pageData.internalLinkCount} internal · ${result.pageData.externalLinkCount} external`}
            />
  
            <DetailCard
              icon={FileCode2}
              label="Structured data"
              value={
                result.pageData.structuredDataTypes.length > 0
                  ? result.pageData.structuredDataTypes.join(
                      ", ",
                    )
                  : result.pageData.hasStructuredData
                    ? "Detected"
                    : "Not detected"
              }
            />
  
            <DetailCard
              icon={Globe2}
              label="Title"
              value={
                result.pageData.title ??
                "No title detected"
              }
            />
  
            <DetailCard
              icon={FileCode2}
              label="Meta description"
              value={
                result.pageData.metaDescription ??
                "No meta description detected"
              }
            />
  
            <DetailCard
              icon={Link2}
              label="Canonical URL"
              value={
                result.pageData.canonicalUrl ??
                "No canonical URL detected"
              }
            />
  
            <DetailCard
              icon={MapPin}
              label="Local signals"
              value={
                result.pageData.hasLocalBusinessSignals
                  ? "Detected"
                  : "Not detected"
              }
            />
          </div>
        </section>
  
        <section
          aria-labelledby="findings-heading"
          className="space-y-5"
        >
          <div>
            <p className="text-sm font-medium text-primary">
              Recommended actions
            </p>
  
            <h2
              id="findings-heading"
              className="mt-1 text-2xl font-semibold tracking-tight text-foreground"
            >
              Audit findings
            </h2>
  
            <p className="mt-2 max-w-3xl text-sm leading-6 text-muted-foreground">
              Failed checks appear first, followed by warnings
              and passed checks. Address the highest-impact
              issues before lower-priority improvements.
            </p>
          </div>
  
          <div className="space-y-4">
            {sortedFindings.map((finding) => (
              <FindingCard
                key={finding.id}
                finding={finding}
              />
            ))}
          </div>
        </section>
      </div>
    );
  }
  
  interface DetailCardProps {
    icon: typeof Globe2;
    label: string;
    value: string;
  }
  
  function DetailCard({
    icon: Icon,
    label,
    value,
  }: DetailCardProps) {
    return (
      <div className="rounded-xl border border-border bg-background p-4">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Icon
            aria-hidden="true"
            className="size-4"
          />
          {label}
        </div>
  
        <p className="mt-2 break-words text-sm font-medium leading-6 text-foreground">
          {value}
        </p>
      </div>
    );
  }