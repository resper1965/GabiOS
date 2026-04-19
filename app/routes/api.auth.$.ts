import type { ActionFunctionArgs, LoaderFunctionArgs } from "react-router";
import { createAuth } from "~/lib/auth.server";

/**
 * Catch-all route for Better Auth API.
 * Handles: /api/auth/sign-in, /api/auth/sign-up, /api/auth/session, etc.
 */

export async function loader({ request, context }: LoaderFunctionArgs) {
  const auth = createAuth(
    context.cloudflare.env,
    context.cloudflare.ctx.waitUntil.bind(context.cloudflare.ctx)
  );
  return auth.handler(request);
}

export async function action({ request, context }: ActionFunctionArgs) {
  const auth = createAuth(
    context.cloudflare.env,
    context.cloudflare.ctx.waitUntil.bind(context.cloudflare.ctx)
  );
  return auth.handler(request);
}
