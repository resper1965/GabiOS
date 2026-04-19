import { createRequestHandler } from "react-router";
import { api } from "../server/index";
import { taskDispatcher } from "./task-dispatcher";
import { agentWorker } from "./agent-worker";
export { MeetingRoom } from "./durable-objects/meeting-room";

declare module "react-router" {
  export interface AppLoadContext {
    cloudflare: {
      env: Env;
      ctx: ExecutionContext;
    };
  }
}

const requestHandler = createRequestHandler(
  () => import("virtual:react-router/server-build"),
  import.meta.env.MODE
);

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);

    // Route /api/* requests to Hono (except /api/auth/* which is handled by React Router)
    if (url.pathname.startsWith("/api/") && !url.pathname.startsWith("/api/auth")) {
      return api.fetch(request, env, ctx);
    }

    // Everything else goes to React Router (SSR)
    return requestHandler(request, {
      cloudflare: { env, ctx },
    });
  },
  async scheduled(event, env, ctx) {
    await taskDispatcher(env, ctx);
  },
  async queue(batch, env, ctx) {
    await agentWorker(batch, env, ctx);
  }
} satisfies ExportedHandler<Env>;
