// src/server/auth/config.ts
import { PrismaAdapter } from "@auth/prisma-adapter";
import type { NextAuthOptions } from "next-auth";
import { type DefaultSession } from "next-auth";
import DiscordProvider from "next-auth/providers/discord";

import { db } from "~/server/db";

/**
 * Module augmentation for `next-auth` types. Allows us to add custom properties to the `session`
 * object and keep type safety.
 *
 * @see https://next-auth.js.org/getting-started/typescript#module-augmentation
 */
declare module "next-auth" {
  interface Session extends DefaultSession {
    user: {
      id: string;
      // ...other properties
      // role: UserRole;
    } & DefaultSession["user"];
  }

  // interface User {
  //   // ...other properties
  //   // role: UserRole;
  // }
}

/**
 * Options for NextAuth.js used to configure adapters, providers, callbacks, etc.
 *
 * @see https://next-auth.js.org/configuration/options
 */
export const authConfig: NextAuthOptions = {
  adapter: PrismaAdapter(db),

  providers: [
    DiscordProvider({
      clientId: process.env.AUTH_DISCORD_ID!,
      clientSecret: process.env.AUTH_DISCORD_SECRET!,
    }),
    // Add more providers here as needed
  ],

  callbacks: {
    session: ({ session, user }: { session: any; user: any }) => ({
      ...session,
      user: {
        ...session.user,
        id: user.id,
      },
    }),
  },

  // NOTE: `trustHost` and `basePath` are not part of NextAuthOptions type in
  // the installed `next-auth` version. If you need custom routing or host
  // trust configuration, set those in the NextAuth handler or framework-level
  // configuration instead of here.
};

