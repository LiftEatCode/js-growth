"use client";

import {
  useActionState,
} from "react";
import {
  AlertCircle,
  ArrowRight,
  LoaderCircle,
  LockKeyhole,
  Mail,
} from "lucide-react";

import {
  internalLogin,
  type InternalLoginState,
} from "@/app/internal-login/actions";
import {
  Button,
} from "@/components/ui";

const INITIAL_STATE: InternalLoginState =
  {
    success: false,
  };

export function InternalLoginForm() {
  const [
    state,
    formAction,
    pending,
  ] =
    useActionState(
      internalLogin,
      INITIAL_STATE,
    );

  return (
    <form
      action={
        formAction
      }
      className="space-y-5"
    >
      <div>
        <label
          htmlFor="internal-email"
          className="text-sm font-semibold text-brand"
        >
          Email
        </label>

        <div className="relative mt-2">
          <Mail
            aria-hidden="true"
            className="absolute left-4 top-1/2 size-4 -translate-y-1/2 text-muted"
          />

          <input
            id="internal-email"
            name="email"
            type="email"
            required
            autoComplete="email"
            disabled={
              pending
            }
            placeholder="you@js-growth.com"
            className="h-12 w-full rounded-xl border border-border bg-white pl-11 pr-4 text-sm text-brand outline-none transition placeholder:text-muted focus:border-brand-blue"
          />
        </div>
      </div>

      <div>
        <label
          htmlFor="internal-password"
          className="text-sm font-semibold text-brand"
        >
          Password
        </label>

        <div className="relative mt-2">
          <LockKeyhole
            aria-hidden="true"
            className="absolute left-4 top-1/2 size-4 -translate-y-1/2 text-muted"
          />

          <input
            id="internal-password"
            name="password"
            type="password"
            required
            autoComplete="current-password"
            disabled={
              pending
            }
            className="h-12 w-full rounded-xl border border-border bg-white pl-11 pr-4 text-sm text-brand outline-none transition focus:border-brand-blue"
          />
        </div>
      </div>

      {state.message ? (
        <div
          role="alert"
          className="flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 p-3 text-sm leading-6 text-red-700"
        >
          <AlertCircle
            aria-hidden="true"
            className="mt-1 size-4 shrink-0"
          />

          {
            state.message
          }
        </div>
      ) : null}

      <Button
        type="submit"
        size="lg"
        className="w-full"
        disabled={
          pending
        }
      >
        {pending ? (
          <>
            <LoaderCircle
              aria-hidden="true"
              className="size-4 animate-spin"
            />

            Signing In…
          </>
        ) : (
          <>
            Sign In

            <ArrowRight
              aria-hidden="true"
              className="size-4"
            />
          </>
        )}
      </Button>
    </form>
  );
}