import { NextRequest } from "next/server";
import { sseManager } from "@/lib/sse";

export const dynamic = "force-dynamic";
export const maxDuration = 300;

export async function GET(request: NextRequest) {
  const clientId = crypto.randomUUID();

  const stream = new ReadableStream({
    start(controller) {
      sseManager.addClient(clientId, controller);
      request.signal.addEventListener("abort", () => {
        sseManager.removeClient(clientId);
      });
    },
    cancel() {
      sseManager.removeClient(clientId);
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      "Connection": "keep-alive",
      "X-Accel-Buffering": "no",
    },
  });
}
