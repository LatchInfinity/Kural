import { NextRequest, NextResponse } from "next/server";
import { generateTamilTtsNarration } from "@/lib/analyze-with-groq";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

interface NarrationBody {
  title?: string;
  summary?: string;
  content?: string;
  category?: string;
  source?: string;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({})) as NarrationBody;
    const narration = await generateTamilTtsNarration({
      title: body.title || "",
      summary: body.summary || "",
      content: body.content || "",
    });

    return NextResponse.json({ narration });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Unable to generate narration" },
      { status: 500 },
    );
  }
}
