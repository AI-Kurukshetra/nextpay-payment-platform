import { NextResponse } from "next/server";
import { buildOpenApiSpec } from "@/lib/openapi/spec";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const origin = `${url.protocol}//${url.host}`;
  return NextResponse.json(buildOpenApiSpec(origin));
}
