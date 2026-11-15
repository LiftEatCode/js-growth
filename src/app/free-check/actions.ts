"use server";

import { z } from "zod";

import { submitContactForm, type ContactFormState } from "@/app/contact/actions";
import { FREE_CHECK_SERVICE } from "@/content/free-check";

const freeCheckSchema = z.object({
  businessName: z.string().trim().min(2, "Enter your business name.").max(100),
  city: z.string().trim().min(2, "Enter your city.").max(100),
  email: z.string().trim().max(254).email("Enter a valid email address."),
  website: z.string().trim().max(200),
});

export async function requestFreeCheck(
  previousState: ContactFormState,
  formData: FormData,
): Promise<ContactFormState> {
  if (formData.get("companyWebsite")) {
    return { success: true, message: "Your request has been received." };
  }

  const result = freeCheckSchema.safeParse({
    businessName: formData.get("businessName"),
    city: formData.get("city"),
    email: formData.get("email"),
    website: formData.get("website") ?? "",
  });

  if (!result.success) {
    return {
      success: false,
      message: "Please check the fields below.",
      errors: result.error.flatten().fieldErrors,
    };
  }

  const { businessName, city, email, website } = result.data;
  const submission = new FormData();
  submission.set("name", businessName);
  submission.set("businessName", businessName);
  submission.set("email", email);
  submission.set("website", website);
  submission.set("service", FREE_CHECK_SERVICE);
  submission.set("message", `Free website and Google Business Profile check.\nCity: ${city}`);
  submission.set("phone", "");
  submission.set("budget", "");
  submission.set("companyWebsite", "");

  const attribution = formData.get("growth_attribution");
  if (typeof attribution === "string" && attribution.length <= 8192) {
    submission.set("growth_attribution", attribution);
  }

  return submitContactForm(previousState, submission);
}
