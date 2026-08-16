import "server-only";

import Stripe from "stripe";

import { siteConfig } from "@/config/site";

function requiredEnv(name: string): string {
  const value = process.env[name]?.trim();

  if (!value) {
    throw new Error(`${name} is not configured.`);
  }

  return value;
}

export function getAppBaseUrl(): string {
  const value =
    process.env.NEXT_PUBLIC_SITE_URL?.trim() || siteConfig.url;

  return value.replace(/\/+$/, "");
}

export function isStripeConfigured(): boolean {
  return Boolean(
    process.env.STRIPE_SECRET_KEY?.trim() &&
      process.env.STRIPE_PROFESSIONAL_AUDIT_PRICE_ID?.trim(),
  );
}

export function getStripeSecretKey(): string {
  return requiredEnv("STRIPE_SECRET_KEY");
}

export function getStripeWebhookSecret(): string {
  return requiredEnv("STRIPE_WEBHOOK_SECRET");
}

export function getProfessionalAuditPriceId(): string {
  return requiredEnv("STRIPE_PROFESSIONAL_AUDIT_PRICE_ID");
}

let stripeClient: Stripe | null = null;

export function getStripe(): Stripe {
  if (!stripeClient) {
    stripeClient = new Stripe(getStripeSecretKey());
  }

  return stripeClient;
}
