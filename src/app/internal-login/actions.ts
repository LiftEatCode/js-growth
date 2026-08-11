"use server";

import { redirect } from "next/navigation";

import {
  createInternalSession,
  deleteInternalSession,
  validateInternalCredentials,
} from "@/lib/internal-auth";

export interface InternalLoginState {
  success: boolean;
  message?: string;
}

function normalizeString(
  value: FormDataEntryValue | null,
): string {
  return typeof value === "string"
    ? value.trim()
    : "";
}

export async function internalLogin(
  _previousState: InternalLoginState,
  formData: FormData,
): Promise<InternalLoginState> {
  const email =
    normalizeString(
      formData.get("email"),
    );

  const password =
    normalizeString(
      formData.get("password"),
    );

  if (
    !email ||
    !password
  ) {
    return {
      success: false,
      message:
        "Enter your email and password.",
    };
  }

  try {
    const valid =
      validateInternalCredentials(
        email,
        password,
      );

    if (!valid) {
      return {
        success: false,
        message:
          "Invalid email or password.",
      };
    }

    await createInternalSession(
      email,
    );
  } catch (error) {
    console.error(
      "Internal login failed:",
      error,
    );

    return {
      success: false,
      message:
        "Internal login is not configured correctly.",
    };
  }

  redirect("/reports");
}

export async function internalLogout(): Promise<void> {
  await deleteInternalSession();

  redirect(
    "/internal-login",
  );
}