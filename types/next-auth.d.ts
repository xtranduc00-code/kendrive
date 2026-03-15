import "next-auth";

declare module "next-auth" {
  interface Session {
    accessToken?: string;
    /** Google token expiry (seconds since epoch). */
    expiresAt?: number;
    /** Set when refresh failed; layout redirects to sign-in. */
    error?: "RefreshTokenError";
  }
}
