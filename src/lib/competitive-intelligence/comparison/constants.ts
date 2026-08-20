import { MAX_SELECTED_COMPETITORS_PER_PROSPECT } from "../constants";

/** Algorithm version for competitive comparison snapshots. */
export const COMPETITIVE_COMPARISON_VERSION = 1;

/** Max SELECTED competitors included in a comparison. */
export const MAX_COMPETITORS_COMPARED = MAX_SELECTED_COMPETITORS_PER_PROSPECT;

/** Gap vs competitor average thresholds (percentage points on 0–100 scale). */
export const MAJOR_ADVANTAGE_GAP = 15;
export const ADVANTAGE_GAP = 5;
export const PARITY_GAP = 5; // |gap| < PARITY_GAP → PARITY
export const MAJOR_GAP_THRESHOLD = 15;

export const MAX_OPPORTUNITIES_SHOWN = 5;
export const MAX_ADVANTAGES_SHOWN = 5;
