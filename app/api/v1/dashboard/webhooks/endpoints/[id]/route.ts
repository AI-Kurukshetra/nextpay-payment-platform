import { NextResponse } from "next/server";
import { getDashboardSessionMerchant } from "@/lib/auth/dashboard-session";
import { deleteWebhookEndpoint, updateWebhookEndpoint } from "@/lib/services/webhook-service";
import { updateWebhookEndpointSchema } from "@/lib/validations/webhook";

type RouteContext = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, context: RouteContext) {
  const merchant = await getDashboardSessionMerchant();
  if (!merchant) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const payload = await request.json();
  const parsed = updateWebhookEndpointSchema.safeParse(payload);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "validation_error", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  try {
    const { id } = await context.params;
    const endpoint = await updateWebhookEndpoint(merchant, id, parsed.data);
    return NextResponse.json(endpoint);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "update_failed" },
      { status: 400 }
    );
  }
}

export async function DELETE(_request: Request, context: RouteContext) {
  const merchant = await getDashboardSessionMerchant();
  if (!merchant) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  try {
    const { id } = await context.params;
    const deleted = await deleteWebhookEndpoint(merchant, id);
    return NextResponse.json(deleted);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "delete_failed" },
      { status: 400 }
    );
  }
}
