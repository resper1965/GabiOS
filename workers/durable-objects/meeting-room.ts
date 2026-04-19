import type { Env } from "../worker-configuration";

interface MeetingState {
  participants: string[];
  topic: string | null;
}

export class MeetingRoom {
  state: DurableObjectState;
  env: Env;
  meetingState: MeetingState;

  constructor(state: DurableObjectState, env: Env) {
    this.state = state;
    this.env = env;
    this.meetingState = { participants: [], topic: null };

    // I7 FIX: Initialize state before handling requests
    this.state.blockConcurrencyWhile(async () => {
      const stored = await this.state.storage.get<MeetingState>("meetingState");
      if (stored) {
        this.meetingState = stored;
      }
    });
  }

  async fetch(request: Request) {
    // Basic websocket upgrade implementation for AI meeting rooms
    const upgradeHeader = request.headers.get("Upgrade");
    if (!upgradeHeader || upgradeHeader !== "websocket") {
      return new Response("Expected Upgrade: websocket", { status: 426 });
    }

    const webSocketPair = new WebSocketPair();
    const [client, server] = Object.values(webSocketPair);

    this.state.acceptWebSocket(server);

    return new Response(null, {
      status: 101,
      webSocket: client,
    });
  }

  // Hibernation API handlers
  async webSocketMessage(ws: WebSocket, message: string | ArrayBuffer) {
    try {
      const data = JSON.parse(message as string);

      if (data.type === "join") {
        this.meetingState.participants.push(data.agentId);
        await this.state.storage.put("meetingState", this.meetingState);
      }

      if (data.type === "set_topic") {
        this.meetingState.topic = data.topic;
        await this.state.storage.put("meetingState", this.meetingState);
      }

      // Broadcast to all connected websockets
      for (const socket of this.state.getWebSockets()) {
        if (socket !== ws) {
          socket.send(JSON.stringify(data));
        }
      }
    } catch (err) {
      ws.send(JSON.stringify({ error: "Invalid message format" }));
    }
  }

  async webSocketClose(ws: WebSocket, code: number, reason: string) {
    ws.close(code, reason);
  }

  async webSocketError(ws: WebSocket, error: unknown) {
    console.error("MeetingRoom WebSocket error:", error);
    ws.close(1011, "Internal error");
  }
}
