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

const EXPLICIT_SCHEME_PATTERN = /^[a-z][a-z0-9+.-]*:/i;

const CUSTOMER_URL_ERROR = "Enter a valid public website URL.";

function isPrivateHostname(hostname: string): boolean {
  const normalizedHostname = hostname.toLowerCase().replace(/\.$/, "");

  if (BLOCKED_HOSTNAMES.has(normalizedHostname)) {
    return true;
  }

  return PRIVATE_IPV4_PATTERNS.some((pattern) =>
    pattern.test(normalizedHostname),
  );
}

function tryParseUrl(value: string): URL | null {
  try {
    return new URL(value);
  } catch {
    return null;
  }
}

function hasExplicitScheme(value: string): boolean {
  return EXPLICIT_SCHEME_PATTERN.test(value);
}

function isHttpOrHttpsScheme(value: string): boolean {
  return /^https?:$/i.test(value);
}

export type PublicWebsiteUrlParseResult =
  | {
      success: true;
      url: string;
    }
  | {
      success: false;
      error: string;
    };

export function interpretPublicWebsiteUrl(
  input: unknown,
): PublicWebsiteUrlParseResult {
  if (typeof input !== "string") {
    return {
      success: false,
      error: "Enter a website URL.",
    };
  }

  const trimmedValue = input.trim();

  if (!trimmedValue) {
    return {
      success: false,
      error: "Enter a website URL.",
    };
  }

  if (trimmedValue.length > 2_048) {
    return {
      success: false,
      error: "The URL is too long.",
    };
  }

  if (hasExplicitScheme(trimmedValue)) {
    const scheme = trimmedValue.match(EXPLICIT_SCHEME_PATTERN)?.[0] ?? "";

    if (!/^https?:$/i.test(scheme)) {
      return {
        success: false,
        error: "Only HTTP and HTTPS URLs are supported.",
      };
    }
  }

  const candidate = hasExplicitScheme(trimmedValue)
    ? trimmedValue
    : `https://${trimmedValue}`;
  const url = tryParseUrl(candidate);

  if (!url || !url.hostname) {
    return {
      success: false,
      error: "Enter a valid website URL.",
    };
  }

  if (!isHttpOrHttpsScheme(url.protocol)) {
    return {
      success: false,
      error: "Only HTTP and HTTPS URLs are supported.",
    };
  }

  if (url.username || url.password) {
    return {
      success: false,
      error: "URLs containing credentials are not supported.",
    };
  }

  if (isPrivateHostname(url.hostname)) {
    return {
      success: false,
      error: "Private and local network addresses are not supported.",
    };
  }

  url.hash = "";
  return {
    success: true,
    url: url.toString(),
  };
}

export const publicHttpUrlSchema = z
  .string()
  .superRefine((value, ctx) => {
    const parsed = interpretPublicWebsiteUrl(value);

    if (!parsed.success) {
      ctx.addIssue({
        code: "custom",
        message: parsed.error,
      });
    }
  })
  .transform((value) => {
    const parsed = interpretPublicWebsiteUrl(value);
    return parsed.success ? parsed.url : value;
  });

export const websiteAuditInputSchema = z.object({
  url: publicHttpUrlSchema,
});

export type WebsiteAuditInput = z.infer<typeof websiteAuditInputSchema>;

function firstIssueMessage(error: z.ZodError): string {
  return error.issues[0]?.message ?? CUSTOMER_URL_ERROR;
}

export function parseWebsiteAuditInput(input: unknown):
  | {
      success: true;
      data: WebsiteAuditInput;
    }
  | {
      success: false;
      error: string;
    } {
  try {
    const result = websiteAuditInputSchema.safeParse(input);

    if (!result.success) {
      return {
        success: false,
        error: firstIssueMessage(result.error),
      };
    }

    return {
      success: true,
      data: result.data,
    };
  } catch {
    return {
      success: false,
      error: CUSTOMER_URL_ERROR,
    };
  }
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
  try {
    return interpretPublicWebsiteUrl(input);
  } catch {
    return {
      success: false,
      error: CUSTOMER_URL_ERROR,
    };
  }
}
