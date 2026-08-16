import { NextResponse } from "next/server";

import { createProfessionalAuditCheckout } from "@/lib/payments/professional-audit";

export const runtime = "nodejs";

export async function POST(
  request: Request,
  context: {
    params: Promise<{
      id: string;
    }>;
  },
) {
  const { id } = await context.params;
  const result = await createProfessionalAuditCheckout(id);
  const origin = new URL(request.url).origin;

  if (result.status === "invalid-id" || result.status === "not-found") {
    return NextResponse.json(
      { error: "Report not found." },
      { status: 404 },
    );
  }

  if (result.status === "already-unlocked") {
    return NextResponse.redirect(new URL(`/report/${id}`, origin), 303);
  }

  if (result.status === "unavailable") {
    return NextResponse.redirect(
      new URL(`/report/${id}/purchase/unavailable`, origin),
      303,
    );
  }

  return NextResponse.redirect(result.url, 303);
}
