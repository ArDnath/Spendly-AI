import { NextRequest } from 'next/server';
import { getServerSession } from 'next-auth/next';
import NextAuth from "next-auth";
import GitHubProvider from "next-auth/providers/github";
import GoogleProvider from "next-auth/providers/google";

export interface AuthenticatedRequest extends NextRequest {
  userId: string;
  userEmail: string;
}

const authOptions = {
  providers: [
    GitHubProvider({
      clientId: process.env.GITHUB_ID!,
      clientSecret: process.env.GITHUB_SECRET!,
    }),
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
  ],
  callbacks: {
    session: async ({ session, token }: any) => {
      if (session?.user && token?.sub) {
        (session.user as { id?: string }).id = token.sub;
      }
      return session;
    },
    jwt: async ({ user, token }: any) => {
      if (user) {
        token.uid = user.id;
      }
      return token;
    },
  },
  session: {
    strategy: "jwt" as const,
  },
  pages: {
    signIn: "/auth/signin",
    error: "/auth/error",
  },
};

export async function authenticateRequest(request: NextRequest): Promise<{ userId: string; userEmail: string } | null> {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return null;
    }

    // Import the helper function to find or create user
    const { findOrCreateUser } = await import('./db-helpers');
    
    // Ensure user exists in database
    const user = await findOrCreateUser(session.user.email, session.user.name || undefined);

    return {
      userId: user.id,
      userEmail: user.email
    };
  } catch (error) {
    console.error('Authentication error:', error);
    return null;
  }
}

export function createAuthResponse(status: number, message: string) {
  return new Response(JSON.stringify({ error: message }), {
    status,
    headers: { 'Content-Type': 'application/json' }
  });
}
