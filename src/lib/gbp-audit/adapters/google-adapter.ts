import type { BusinessProfileAdapter } from "./types";

/**
 * Placeholder for a future Google Business Profile API adapter.
 * v0.1 must not parse Google response objects in the audit engine.
 */
export const googleBusinessProfileAdapter: BusinessProfileAdapter = {
  source: "google",
  toBusinessProfileData(input: unknown): never {
    void input;
    throw new Error(
      "Google Business Profile API adapter is not implemented in GBP Audit v0.1. Map API payloads to BusinessProfileData first.",
    );
  },
};
