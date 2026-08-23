/**
 * External service mocks for commercial tests.
 * Real paid calls are forbidden.
 */

export const externalMockState = {
  resendCalls: 0,
  stripeCalls: 0,
  openaiCalls: 0,
  placesCalls: 0,
};

export function resetExternalMockState(): void {
  externalMockState.resendCalls = 0;
  externalMockState.stripeCalls = 0;
  externalMockState.openaiCalls = 0;
  externalMockState.placesCalls = 0;
}

export function assertNoPaidExternalCalls(options?: {
  allowResend?: number;
}): void {
  if (externalMockState.stripeCalls !== 0) {
    throw new Error(`Unexpected Stripe calls: ${externalMockState.stripeCalls}`);
  }
  if (externalMockState.openaiCalls !== 0) {
    throw new Error(`Unexpected OpenAI calls: ${externalMockState.openaiCalls}`);
  }
  if (externalMockState.placesCalls !== 0) {
    throw new Error(`Unexpected Places calls: ${externalMockState.placesCalls}`);
  }
  const allowed = options?.allowResend ?? 0;
  if (externalMockState.resendCalls > allowed) {
    throw new Error(
      `Unexpected Resend calls: ${externalMockState.resendCalls} (allowed ${allowed})`,
    );
  }
}

export function createMockResend() {
  return {
    emails: {
      send: async () => {
        externalMockState.resendCalls += 1;
        return { data: { id: `mock-${externalMockState.resendCalls}` }, error: null };
      },
    },
  };
}

export function createMockStripe() {
  return new Proxy(
    {},
    {
      get() {
        return () => {
          externalMockState.stripeCalls += 1;
          throw new Error("Stripe must not be called during commercial Sprint 8 tests.");
        };
      },
    },
  );
}

export function createMockOpenAI() {
  return new Proxy(
    {},
    {
      get() {
        return () => {
          externalMockState.openaiCalls += 1;
          throw new Error("OpenAI must not be called during commercial tests.");
        };
      },
    },
  );
}

export function createMockPlaces() {
  return new Proxy(
    {},
    {
      get() {
        return () => {
          externalMockState.placesCalls += 1;
          throw new Error("Google Places must not be called during commercial tests.");
        };
      },
    },
  );
}
