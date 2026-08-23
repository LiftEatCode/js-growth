export function normalizeHostname(input: string | null | undefined): string | null {
  if (!input?.trim()) {
    return null;
  }
  const raw = input.trim();
  try {
    const withProto = raw.includes("://") ? raw : `https://${raw}`;
    return new URL(withProto).hostname.replace(/^www\./i, "").toLowerCase();
  } catch {
    return (
      raw
        .toLowerCase()
        .replace(/^https?:\/\//, "")
        .replace(/^www\./, "")
        .split("/")[0] || null
    );
  }
}

export function resolveInitialClientContact(options: {
  signerName: string | null;
  signerEmail: string | null;
  deliveryRecipientName: string | null;
  deliveryRecipientEmail: string | null;
  prospectContactName: string | null;
  prospectContactEmail: string | null;
}): { name: string | null; email: string | null; source: string } {
  if (options.signerEmail?.trim()) {
    return {
      name: options.signerName?.trim() || null,
      email: options.signerEmail.trim().toLowerCase(),
      source: "agreement_signer",
    };
  }
  if (options.deliveryRecipientEmail?.trim()) {
    return {
      name: options.deliveryRecipientName?.trim() || null,
      email: options.deliveryRecipientEmail.trim().toLowerCase(),
      source: "agreement_delivery_recipient",
    };
  }
  if (options.prospectContactEmail?.trim()) {
    return {
      name: options.prospectContactName?.trim() || null,
      email: options.prospectContactEmail.trim().toLowerCase(),
      source: "prospect_contact",
    };
  }
  return { name: null, email: null, source: "none" };
}
