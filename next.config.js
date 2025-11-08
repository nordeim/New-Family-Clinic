// next.config.js
/**
 * Run `build` or `dev` with `SKIP_ENV_VALIDATION` to skip env validation.
 * This is especially useful for Docker builds.
 */
import "./src/env.js";

/** @type {import("next").NextConfig} */
const config = {
  reactStrictMode: true,
  /**
   * If you have the Supabase instance beginning with a random string,
   * you may need to add it to the domains here.
   */
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "*.supabase.co",
      },
    ],
  },
};

export default config;
