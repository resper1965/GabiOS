import { createAuthClient } from "better-auth/react";
import { twoFactorClient } from "better-auth/client/plugins";

export const authClient = createAuthClient({
  baseURL: "/api/auth",
  plugins: [
    twoFactorClient({
      twoFactorPage: "/auth/two-factor",
    }),
  ],
});

export const {
  signIn,
  signUp,
  signOut,
  useSession,
  getSession,
  twoFactor,
} = authClient;
