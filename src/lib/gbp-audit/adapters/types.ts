import type { BusinessProfileData } from "../types";

/**
 * Maps an upstream snapshot into normalized BusinessProfileData.
 * Google API payloads must be translated here — never inside rules.
 */
export interface BusinessProfileAdapter {
  readonly source: "mock" | "google";
  toBusinessProfileData(input: unknown): BusinessProfileData;
}
