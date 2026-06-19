import type { NextAuthOptions } from 'next-auth';
import GoogleProvider from 'next-auth/providers/google';
import { getUserTier } from './user-store';

export const authOptions: NextAuthOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID ?? '',
      clientSecret: process.env.GOOGLE_CLIENT_SECRET ?? '',
    }),
  ],
  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60,
  },
  pages: {
    signIn: '/',
  },
  callbacks: {
    async jwt({ token, user, trigger }) {
      if (user) {
        token.id = user.id;
      }
      if (trigger === 'signIn' || trigger === 'update') {
        if (token.email) {
          token.tier = await getUserTier(token.email);
        }
      }
      if (!token.tier && token.email) {
        token.tier = await getUserTier(token.email);
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        (session.user as { id?: string; tier?: string }).id = token.id as string;
        (session.user as { id?: string; tier?: string }).tier = (token.tier as string) || 'free';
      }
      return session;
    },
  },
};
