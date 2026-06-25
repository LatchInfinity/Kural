import type { NextRequest } from "next/server";
import { GET as getNews } from "@/app/api/news/route";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;
export const maxDuration = 120;

export async function GET(request: NextRequest) {
  return getNews(request);
}
