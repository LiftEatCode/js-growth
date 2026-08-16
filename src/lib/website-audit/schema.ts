import { z } from "zod";

const BLOCKED_HOSTNAMES = new Set([
  "localhost",
  "0.0.0.0",
  "127.0.0.1",
  "::1",
]);

const PRIVATE_IPV4_PATTERNS = [
  /^10\./,
  /^127\./,
  /^169\.254\./,
  /^192\.168\./,
  /^172\.(1[6-9]|2\d|3[01])\./,
];

function isPrivateHostname(hostname: string): boolean {
  const normalizedHostname = hostname.toLowerCase().replace(/\.$/, "");

  if (BLOCKED_HOSTNAMES.has(normalizedHostname)) {
    return true;
  }

  return PRIVATE_IPV4_PATTERNS.some((pattern) =>
    pattern.test(normalizedHostname),
  );
}

function normalizeUrl(value: string): string {
  const trimmedValue = value.trim();

  if (!trimmedValue) {
    return trimmedValue;
  }

  if (/^https?:\/\//i.test(trimmedValue)) {
    return trimmedValue;
  }

  return `https://${trimmedValue}`;
}

export const publicHttpUrlSchema = z
  .string()
  .trim()
  .min(1, "Enter a website URL.")
  .max(2_048, "The URL is too long.")
  .transform(normalizeUrl)
  .pipe(
    z
      .string()
      .url("Enter a valid website URL.")
      .refine((value) => {
        const url = new URL(value);

        return url.protocol === "http:" || url.protocol === "https:";
      }, "Only HTTP and HTTPS URLs are supported.")
      .refine((value) => {
        const url = new URL(value);

        return !url.username && !url.password;
      }, "URLs containing credentials are not supported.")
      .refine((value) => {
        const url = new URL(value);

        return !isPrivateHostname(url.hostname);
      }, "Private and local network addresses are not supported."),
  )
  .transform((url) => {
    const parsedUrl = new URL(url);
    parsedUrl.hash = "";
    return parsedUrl.toString();
  });

export const websiteAuditInputSchema = z
  .object({
    url: publicHttpUrlSchema,
  });

export type WebsiteAuditInput = z.infer<typeof websiteAuditInputSchema>;

export function parseWebsiteAuditInput(input: unknown):
  | {
      success: true;
      data: WebsiteAuditInput;
    }
  | {
      success: false;
      error: string;
    } {
  const result = websiteAuditInputSchema.safeParse(input);

  if (!result.success) {
    return {
      success: false,
      error:
        result.error.issues[0]?.message ??
        "Enter a valid public website URL.",
    };
  }

  return {
    success: true,
    data: result.data,
  };
}

export function parsePublicWebsiteUrl(input: unknown):
  | {
      success: true;
      url: string;
    }
  | {
      success: false;
      error: string;
    } {
  const result = publicHttpUrlSchema.safeParse(input);

  if (!result.success) {
    return {
      success: false,
      error:
        result.error.issues[0]?.message ??
        "Enter a valid public website URL.",
    };
  }

  return {
    success: true,
    url: result.data,
  };
}
