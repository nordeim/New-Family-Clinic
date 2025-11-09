import NextAuth from "next-auth/next";
import { authConfig } from "~/server/auth/config";

const handler = NextAuth(authConfig as any);

export const { GET, POST } = handler;
