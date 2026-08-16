export class AiGenerationTimeoutError extends Error {
  constructor() {
    super("AI generation timed out.");
    this.name = "AiGenerationTimeoutError";
  }
}

export class InvalidAiOutputError extends Error {
  readonly reason: string;

  constructor(reason: string) {
    super(`invalid-ai-output:${reason}`);
    this.name = "InvalidAiOutputError";
    this.reason = reason;
  }
}

export async function withTimeout<T>(
  promise: Promise<T>,
  timeoutMs: number,
): Promise<T> {
  let timer: ReturnType<typeof setTimeout> | undefined;

  try {
    return await Promise.race([
      promise,
      new Promise<T>((_, reject) => {
        timer = setTimeout(() => {
          reject(new AiGenerationTimeoutError());
        }, timeoutMs);
        timer.unref?.();
      }),
    ]);
  } finally {
    if (timer) {
      clearTimeout(timer);
    }
  }
}
