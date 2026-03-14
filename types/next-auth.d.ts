import "next-auth";

declare module "next-auth" {
  interface Session {
    accessToken?: string;
    /** Google token expiry (seconds since epoch). When past, redirect to sign-in. */
    expiresAt?: number;
  }
}
