import { type RouteConfig, index, route, layout } from "@react-router/dev/routes";

export default [
  // Landing page
  index("routes/home.tsx"),

  // Auth routes
  route("auth/sign-in", "routes/auth/sign-in.tsx"),
  route("auth/sign-up", "routes/auth/sign-up.tsx"),

  // Better Auth API (catch-all)
  route("api/auth/*", "routes/api.auth.$.ts"),

  // Dashboard (protected layout)
  layout("routes/dashboard/layout.tsx", [
    route("dashboard", "routes/dashboard/index.tsx"),
    route("dashboard/tasks", "routes/dashboard/tasks.tsx"),
    route("dashboard/organization", "routes/dashboard/organization.tsx"),
  ]),

  // WebChat demo
  route("webchat", "routes/webchat.tsx"),
] satisfies RouteConfig;
