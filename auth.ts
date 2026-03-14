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
      }
      return token;
    },
    async session({ session, token }) {
      return {
        ...session,
        accessToken: token.accessToken as string | undefined,
        expiresAt: token.expiresAt as number | undefined,
      };
    },
  },
  pages: {
    signIn: "/sign-in",
  },
});
