import { THRESHOLDS } from "../constants";
import { createGbpFinding } from "../engine";
import type { GbpAuditFinding, GbpAuditRule } from "../types";
import { daysSince, deriveMostRecentPostAt, derivePostCount } from "../utils";

function recencyFinding(input: {
  id: "activity.recent_posts" | "activity.recent_owner_photos";
  title: string;
  latest: string | null;
  unknown: boolean;
  zeroKnown: boolean;
  asOf: string;
  isNewBusiness: boolean;
  passDays: number;
  warningDays: number;
  why: string;
  evidence: Record<string, string | number | boolean | null>;
}): GbpAuditFinding {
  const { id, title, latest, unknown, zeroKnown, asOf, isNewBusiness } = input;

  if (unknown) {
    return createGbpFinding({
      id,
      category: "activity_freshness",
      title,
      status: "insufficient_data",
      summary: `${title} could not be evaluated from the available data.`,
      whyItMatters: input.why,
      recommendation:
        "Sync posts or photo timestamps when those APIs are available. Unknown activity is not scored as zero activity.",
      evidence: input.evidence,
    });
  }

  if (zeroKnown && !latest) {
    return createGbpFinding({
      id,
      category: "activity_freshness",
      title,
      status: isNewBusiness ? "warning" : "fail",
      severity: isNewBusiness ? "low" : "high",
      summary: isNewBusiness
        ? `No ${title.toLowerCase()} yet on this new profile.`
        : `No ${title.toLowerCase()} is recorded.`,
      whyItMatters: input.why,
      recommendation: isNewBusiness
        ? "Start with one post or photo from recent work. A long archive is not expected yet."
        : "Publish a useful update or photo from recent work so the profile does not look idle.",
      evidence: input.evidence,
    });
  }

  if (!latest) {
    return createGbpFinding({
      id,
      category: "activity_freshness",
      title,
      status: "insufficient_data",
      summary: `Counts exist, but no date was available for ${title.toLowerCase()}.`,
      whyItMatters: input.why,
      recommendation: "Include a most-recent timestamp in the snapshot.",
      evidence: input.evidence,
    });
  }

  const age = daysSince(latest, asOf);
  if (age <= input.passDays) {
    return createGbpFinding({
      id,
      category: "activity_freshness",
      title,
      status: "pass",
      summary: `Last ${title.toLowerCase()} was ${age} day(s) ago.`,
      whyItMatters: input.why,
      recommendation: "Keep a simple cadence so the profile does not go quiet.",
      evidence: { ...input.evidence, daysSince: age },
    });
  }

  if (age <= input.warningDays) {
    return createGbpFinding({
      id,
      category: "activity_freshness",
      title,
      status: "warning",
      summary: `Last ${title.toLowerCase()} was ${age} day(s) ago.`,
      whyItMatters: input.why,
      recommendation: "Post a useful update or recent photo from a completed job.",
      evidence: { ...input.evidence, daysSince: age },
    });
  }

  return createGbpFinding({
    id,
    category: "activity_freshness",
    title,
    status: isNewBusiness ? "warning" : "fail",
    severity: isNewBusiness ? "low" : "high",
    summary: `Last ${title.toLowerCase()} was ${age} day(s) ago.`,
    whyItMatters: input.why,
    recommendation: "Resume posting from real jobs rather than leaving the profile idle.",
    evidence: { ...input.evidence, daysSince: age },
  });
}

export const recentPostsRule: GbpAuditRule = {
  id: "activity.recent_posts",
  category: "activity_freshness",
  title: "Recent posts",
  evaluate({ profile, asOf, isNewBusiness }) {
    const count = derivePostCount(profile);
    const latest = deriveMostRecentPostAt(profile);
    const unknown = count === null && profile.activity.posts.length === 0 && !latest;
    const zeroKnown = count === 0;

    return recencyFinding({
      id: "activity.recent_posts",
      title: "Recent posts",
      latest,
      unknown,
      zeroKnown,
      asOf,
      isNewBusiness,
      passDays: THRESHOLDS.recentPostDaysPass,
      warningDays: THRESHOLDS.recentPostDaysWarning,
      why: "Posts are a freshness signal for people who open the profile. They are not treated as a secret ranking lever.",
      evidence: {
        postCount: count,
        mostRecentPostAt: latest,
        isNewBusiness,
      },
    });
  },
};

export const recentOwnerPhotosRule: GbpAuditRule = {
  id: "activity.recent_owner_photos",
  category: "activity_freshness",
  title: "Recent owner photos",
  evaluate({ profile, asOf, isNewBusiness }) {
    const ownerCount = profile.media.ownerUploadedPhotoCount;
    const latest = profile.media.mostRecentOwnerPhotoAt;
    const unknown = ownerCount === null && !latest;
    const zeroKnown = ownerCount === 0;

    return recencyFinding({
      id: "activity.recent_owner_photos",
      title: "Recent owner photos",
      latest,
      unknown,
      zeroKnown,
      asOf,
      isNewBusiness,
      passDays: THRESHOLDS.recentOwnerPhotoDaysPass,
      warningDays: THRESHOLDS.recentOwnerPhotoDaysWarning,
      why: "Owner-uploaded photos show the business is still documenting work. Customer photos are useful but not a substitute for this check.",
      evidence: {
        ownerUploadedPhotoCount: ownerCount,
        mostRecentOwnerPhotoAt: latest,
        isNewBusiness,
      },
    });
  },
};

export const recentProfileActivityRule: GbpAuditRule = {
  id: "activity.recent_profile_activity",
  category: "activity_freshness",
  title: "Recent profile activity",
  evaluate({ profile, asOf, isNewBusiness }) {
    const postAt = deriveMostRecentPostAt(profile);
    const photoAt = profile.media.mostRecentOwnerPhotoAt;
    const postCount = derivePostCount(profile);
    const ownerCount = profile.media.ownerUploadedPhotoCount;

    const postsUnknown = postCount === null && !postAt;
    const photosUnknown = ownerCount === null && !photoAt;
    if (postsUnknown && photosUnknown) {
      return createGbpFinding({
        id: "activity.recent_profile_activity",
        category: "activity_freshness",
        title: "Recent profile activity",
        status: "insufficient_data",
        summary: "Neither posts nor owner-photo dates were observed.",
        whyItMatters:
          "This rollup answers whether the profile looks alive. Overlaps with the post and photo rules; it is a combined freshness view, not extra ranking math.",
        recommendation: "Sync posts and media dates when APIs are available.",
        evidence: { postAt, photoAt },
      });
    }

    const ages = [postAt, photoAt]
      .filter((value): value is string => Boolean(value))
      .map((value) => daysSince(value, asOf));
    const newest = ages.length > 0 ? Math.min(...ages) : null;

    if (newest === null) {
      return createGbpFinding({
        id: "activity.recent_profile_activity",
        category: "activity_freshness",
        title: "Recent profile activity",
        status: isNewBusiness ? "warning" : "fail",
        severity: isNewBusiness ? "low" : "medium",
        summary: "No dated posts or owner photos were found.",
        whyItMatters:
          "A quiet profile can look abandoned. New businesses are not expected to have a long activity log.",
        recommendation: "Publish a post or owner photo from recent work.",
        evidence: { postAt, photoAt, isNewBusiness },
      });
    }

    if (newest <= THRESHOLDS.recentActivityDaysPass) {
      return createGbpFinding({
        id: "activity.recent_profile_activity",
        category: "activity_freshness",
        title: "Recent profile activity",
        status: "pass",
        summary: `Most recent post or owner photo was ${newest} day(s) ago.`,
        whyItMatters:
          "Combined activity shows the profile is being maintained. Same underlying dates as the channel-specific rules.",
        recommendation: "Keep a light monthly cadence.",
        evidence: { daysSinceActivity: newest },
      });
    }

    if (newest <= THRESHOLDS.recentActivityDaysWarning) {
      return createGbpFinding({
        id: "activity.recent_profile_activity",
        category: "activity_freshness",
        title: "Recent profile activity",
        status: "warning",
        summary: `Most recent post or owner photo was ${newest} day(s) ago.`,
        whyItMatters: "Activity has slowed across posts and photos.",
        recommendation: "Add one recent update this month.",
        evidence: { daysSinceActivity: newest },
      });
    }

    return createGbpFinding({
      id: "activity.recent_profile_activity",
      category: "activity_freshness",
      title: "Recent profile activity",
      status: isNewBusiness ? "warning" : "fail",
      severity: isNewBusiness ? "low" : "high",
      summary: `Most recent post or owner photo was ${newest} day(s) ago.`,
      whyItMatters: "Long inactivity is a maintenance gap customers can see.",
      recommendation: "Resume posting from real completed jobs.",
      evidence: { daysSinceActivity: newest, isNewBusiness },
    });
  },
};

export const activityRules: GbpAuditRule[] = [
  recentPostsRule,
  recentOwnerPhotosRule,
  recentProfileActivityRule,
];
