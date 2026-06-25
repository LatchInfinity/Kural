import type { NextRequest } from "next/server";
import { GET as getLatest } from "@/app/api/latest/route";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 120;

export async function GET(request: NextRequest) {
  return getLatest(request);
}
