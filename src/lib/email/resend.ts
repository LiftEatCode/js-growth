import { Resend } from "resend";

let resendClient: Resend | null = null;

type ResendSendResult = Awaited<ReturnType<Resend["emails"]["send"]>>;

export interface MockResendCall {
  payload: unknown;
  options: unknown;
}

const mockResendCalls: MockResendCall[] = [];

export function getMockResendCalls(): MockResendCall[] {
  return [...mockResendCalls];
}

export function clearMockResendCalls(): void {
  mockResendCalls.length = 0;
}

function createMockResendClient(): Resend {
  return {
    emails: {
      send: async (payload: unknown, options?: unknown) => {
        mockResendCalls.push({ payload, options });
        return {
          data: { id: `mock-resend-${mockResendCalls.length}` },
          error: null,
        } as ResendSendResult;
      },
    },
  } as unknown as Resend;
}

export function getResendClient(): Resend {
  if (process.env.COMMERCIAL_TEST_MOCK_RESEND === "1") {
    return createMockResendClient();
  }

  const apiKey = process.env.RESEND_API_KEY;

  if (!apiKey) {
    throw new Error("Missing RESEND_API_KEY");
  }

  if (!resendClient) {
    resendClient = new Resend(apiKey);
  }

  return resendClient;
}
