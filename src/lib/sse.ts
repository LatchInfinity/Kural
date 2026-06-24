type SSEClient = {
  id: string;
  controller: ReadableStreamDefaultController;
};

class SSEManager {
  private clients: Map<string, SSEClient> = new Map();

  addClient(id: string, controller: ReadableStreamDefaultController): void {
    this.clients.set(id, { id, controller });
    controller.enqueue(`data: ${JSON.stringify({ type: "connected", clientId: id })}\n\n`);
  }

  removeClient(id: string): void {
    this.clients.delete(id);
  }

  broadcast(data: Record<string, unknown>): void {
    const message = `data: ${JSON.stringify(data)}\n\n`;
    for (const [id, client] of this.clients) {
      try {
        client.controller.enqueue(message);
      } catch {
        this.clients.delete(id);
      }
    }
  }

  getClientCount(): number {
    return this.clients.size;
  }
}

export const sseManager = new SSEManager();
