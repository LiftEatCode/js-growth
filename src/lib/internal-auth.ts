import {
    createHash,
    timingSafeEqual,
  } from "crypto";
  import { cookies } from "next/headers";
  import { redirect } from "next/navigation";
  import {
    jwtVerify,
    SignJWT,
  } from "jose";
  
  const SESSION_COOKIE_NAME =
    "js-growth-internal-session";
  
  const SESSION_DURATION_SECONDS =
    60 * 60 * 12;
  
  export interface InternalSession {
    email: string;
    expiresAt: string;
  }
  
  function getSessionSecret(): Uint8Array {
    const secret =
      process.env.REPORTS_SESSION_SECRET;
  
    if (!secret) {
      throw new Error(
        "REPORTS_SESSION_SECRET is not configured.",
      );
    }
  
    return new TextEncoder().encode(
      secret,
    );
  }
  
  function hashValue(
    value: string,
  ): Buffer {
    return createHash("sha256")
      .update(value)
      .digest();
  }
  
  function safeEqual(
    left: string,
    right: string,
  ): boolean {
    return timingSafeEqual(
      hashValue(left),
      hashValue(right),
    );
  }
  
  export function validateInternalCredentials(
    email: string,
    password: string,
  ): boolean {
    const configuredEmail =
      process.env.REPORTS_ADMIN_EMAIL;
  
    const configuredPassword =
      process.env.REPORTS_ADMIN_PASSWORD;
  
    if (
      !configuredEmail ||
      !configuredPassword
    ) {
      throw new Error(
        "Internal reports credentials are not configured.",
      );
    }
  
    const emailMatches =
      safeEqual(
        email
          .trim()
          .toLowerCase(),
        configuredEmail
          .trim()
          .toLowerCase(),
      );
  
    const passwordMatches =
      safeEqual(
        password,
        configuredPassword,
      );
  
    return (
      emailMatches &&
      passwordMatches
    );
  }
  
  export async function createInternalSession(
    email: string,
  ): Promise<void> {
    const expiresAt =
      new Date(
        Date.now() +
          SESSION_DURATION_SECONDS *
            1000,
      );
  
    const token =
      await new SignJWT({
        email:
          email
            .trim()
            .toLowerCase(),
  
        expiresAt:
          expiresAt.toISOString(),
      })
        .setProtectedHeader({
          alg: "HS256",
        })
        .setIssuedAt()
        .setExpirationTime(
          Math.floor(
            expiresAt.getTime() /
              1000,
          ),
        )
        .sign(
          getSessionSecret(),
        );
  
    const cookieStore =
      await cookies();
  
    cookieStore.set(
      SESSION_COOKIE_NAME,
      token,
      {
        httpOnly: true,
  
        secure:
          process.env.NODE_ENV ===
          "production",
  
        sameSite: "lax",
  
        path: "/",
  
        expires:
          expiresAt,
      },
    );
  }
  
  export async function getInternalSession(): Promise<
    InternalSession | null
  > {
    const cookieStore =
      await cookies();
  
    const token =
      cookieStore.get(
        SESSION_COOKIE_NAME,
      )?.value;
  
    if (!token) {
      return null;
    }
  
    try {
      const {
        payload,
      } =
        await jwtVerify(
          token,
          getSessionSecret(),
          {
            algorithms: [
              "HS256",
            ],
          },
        );
  
      if (
        typeof payload.email !==
          "string" ||
        typeof payload.expiresAt !==
          "string"
      ) {
        return null;
      }
  
      return {
        email:
          payload.email,
  
        expiresAt:
          payload.expiresAt,
      };
    } catch {
      return null;
    }
  }
  
  export async function requireInternalSession(): Promise<InternalSession> {
    const session =
      await getInternalSession();
  
    if (!session) {
      redirect(
        "/internal-login",
      );
    }
  
    return session;
  }
  
  export async function deleteInternalSession(): Promise<void> {
    const cookieStore =
      await cookies();
  
    cookieStore.delete(
      SESSION_COOKIE_NAME,
    );
  }