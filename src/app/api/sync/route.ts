import type { NextRequest } from "next/server";
import { GET as refreshGet, POST as refreshPost } from "@/app/api/refresh/route";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 120;

export async function GET(request: NextRequest) {
  return refreshGet(request);
}

export async function POST(request: NextRequest) {
  return refreshPost(request);
}
