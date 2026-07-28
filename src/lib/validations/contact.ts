import { z } from "zod";

export const contactFormSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "Please enter your name.")
    .max(100, "Name must be 100 characters or fewer."),

  businessName: z
    .string()
    .trim()
    .max(150, "Business name must be 150 characters or fewer.")
    .optional(),

  email: z
    .string()
    .trim()
    .email("Please enter a valid email address."),

  phone: z
    .string()
    .trim()
    .max(30, "Phone number must be 30 characters or fewer.")
    .optional(),

  website: z
    .string()
    .trim()
    .max(200, "Website must be 200 characters or fewer.")
    .optional(),

  service: z
    .string()
    .min(1, "Please select a service."),

  budget: z
    .string()
    .optional(),

  message: z
    .string()
    .trim()
    .min(20, "Please provide at least 20 characters.")
    .max(3000, "Project details must be 3,000 characters or fewer."),

  companyWebsite: z.string().max(0).optional(),
});

export type ContactFormValues = z.infer<typeof contactFormSchema>;