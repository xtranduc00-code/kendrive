import NextAuth from "next-auth";
import Google from "next-auth/providers/google";

const baseUrl = process.env.AUTH_URL || process.env.NEXTAUTH_URL;

export const { handlers, auth, signIn, signOut } = NextAuth({
  trustHost: true,
  ...(baseUrl && { url: baseUrl }),
  providers: [
    Google({
      clientId: process.env.AUTH_GOOGLE_ID!,
      clientSecret: process.env.AUTH_GOOGLE_SECRET!,
      authorization: {
        params: {
          scope: "openid email profile https://www.googleapis.com/auth/drive",
          prompt: "consent",
          access_type: "offline",
          response_type: "code",
        },
      },
    }),
  ],
  session: { strategy: "jwt", maxAge: 30 * 24 * 60 * 60 },
  callbacks: {
    async jwt({ token, account }) {
      if (account) {
        token.accessToken = account.access_token;
        token.refreshToken = account.refresh_token;
        token.expiresAt = account.expires_at;
        return token;
      }
      // Refresh Google access token when expired (or expiring in 5 min)
      const now = Date.now() / 1000;
      const expiresAt = token.expiresAt as number | undefined;
      const refreshToken = token.refreshToken as string | undefined;
      if (refreshToken && expiresAt != null && now >= expiresAt - 300) {
        try {
          const res = await fetch("https://oauth2.googleapis.com/token", {
            method: "POST",
            headers: { "Content-Type": "application/x-www-form-urlencoded" },
            body: new URLSearchParams({
              grant_type: "refresh_token",
              client_id: process.env.AUTH_GOOGLE_ID!,
              client_secret: process.env.AUTH_GOOGLE_SECRET!,
              refresh_token: refreshToken,
            }),
          });
          if (res.ok) {
            const data = (await res.json()) as { access_token: string; expires_in?: number };
            token.accessToken = data.access_token;
            token.expiresAt = Math.floor(now) + (data.expires_in ?? 3600);
            delete token.error;
          } else {
            (token as { error?: string }).error = "RefreshTokenError";
          }
        } catch {
          (token as { error?: string }).error = "RefreshTokenError";
        }
      }
      return token;
    },
    async session({ session, token }) {
      return {
        ...session,
        accessToken: token.accessToken as string | undefined,
        expiresAt: token.expiresAt as number | undefined,
        error: (token as { error?: string }).error,
      };
    },
  },
  pages: {
    signIn: "/sign-in",
  },
});
