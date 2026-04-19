import { type RouteConfig, index, route } from "@react-router/dev/routes";

export default [
  // Landing page
  index("routes/home.tsx"),

  // Auth routes
  route("auth/sign-in", "routes/auth/sign-in.tsx"),
  route("auth/sign-up", "routes/auth/sign-up.tsx"),

  // Better Auth API (catch-all)
  route("api/auth/*", "routes/api.auth.$.ts"),
] satisfies RouteConfig;
