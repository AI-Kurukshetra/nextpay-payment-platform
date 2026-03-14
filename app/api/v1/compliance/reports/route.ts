import { requireMerchant } from "@/lib/api/auth";
import { jsonError, jsonOk } from "@/lib/api/http";
import { enforceRateLimit } from "@/lib/api/route-guard";
import { generateComplianceReport } from "@/lib/services/compliance-service";

export async function GET(request: Request) {
  try {
    await enforceRateLimit();
    const merchant = await requireMerchant();
    const { searchParams } = new URL(request.url);
    const framework = (searchParams.get("framework") ?? "pci") as "pci" | "gdpr" | "sox";
    if (!["pci", "gdpr", "sox"].includes(framework)) {
      return jsonOk({ error: "validation_error", details: "framework_invalid" }, 400);
    }

    const report = await generateComplianceReport(merchant, framework);
    return jsonOk(report);
  } catch (error) {
    return jsonError(error);
  }
}
