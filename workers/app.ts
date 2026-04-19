import { createRequestHandler } from "react-router";
import { api } from "../server/index";

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
} satisfies ExportedHandler<Env>;
