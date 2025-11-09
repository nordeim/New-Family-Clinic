// next.config.js
// ESM-style Next config (project package.json sets "type": "module")
import "./src/env.js";

import withBundleAnalyzerFactory from "@next/bundle-analyzer";
import withPWAFactory from "next-pwa";
import path from "path";

/**
 * Content Security Policy string built once and normalized
 */
const cspHeader = `
    default-src 'self';
    script-src 'self' 'unsafe-eval' 'unsafe-inline';
    style-src 'self' 'unsafe-inline';
    img-src 'self' blob: data: *.supabase.co;
    font-src 'self';
    object-src 'none';
    base-uri 'self';
    form-action 'self';
    frame-ancestors 'none';
    upgrade-insecure-requests;
`;

/** @type {import('next').NextConfig} */
const baseConfig = {
  reactStrictMode: true,
  compress: true,
  poweredByHeader: false,

  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "*.supabase.co",
      },
    ],
    formats: ["image/avif", "image/webp"],
  },

  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          {
            key: "Content-Security-Policy",
            value: cspHeader.replace(/\s{2,}/g, " ").trim(),
          },
          {
            key: "X-Content-Type-Options",
            value: "nosniff",
          },
          {
            key: "X-Frame-Options",
            value: "DENY",
          },
          {
            key: "X-XSS-Protection",
            value: "1; mode=block",
          },
          {
            key: "Referrer-Policy",
            value: "origin-when-cross-origin",
          },
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=()",
          },
        ],
      },
    ];
  },

  /**
   * Provide a webpack alias guard so runtime resolution matches tsconfig paths.
   * This helps resolve both t3-style "~" imports and "@/..." imports at runtime.
   */
  webpack(config) {
    config.resolve = config.resolve || {};
    config.resolve.alias = {
      ...(config.resolve.alias || {}),
      // Map t3-style ~ alias to src
      "~": path.resolve(process.cwd(), "src"),
      // Mirror TypeScript path aliases to runtime
      "@/components": path.resolve(process.cwd(), "components"),
      "@/lib": path.resolve(process.cwd(), "lib"),
      "@/styles": path.resolve(process.cwd(), "styles"),
      "@/hooks": path.resolve(process.cwd(), "hooks"),
      "@/types": path.resolve(process.cwd(), "types"),
      // Also map src variants to be tolerant during migration
      "@/components/src": path.resolve(process.cwd(), "src/components"),
      "@/lib/src": path.resolve(process.cwd(), "src/lib"),
      "@/styles/src": path.resolve(process.cwd(), "src/styles"),
    };
    return config;
  },
};

/**
 * Plugin factories: create configured wrappers.
 * Use factories (not the raw import) per plugin docs.
 */
const withPWA = withPWAFactory({
  dest: "public",
  register: true,
  skipWaiting: true,
  disable: process.env.NODE_ENV === "development",
});

const withBundleAnalyzer = withBundleAnalyzerFactory({
  enabled: process.env.ANALYZE === "true",
});

/**
 * Chain plugins: bundle analyzer wraps PWA which wraps the base config.
 * Export as default ESM export (package.json: "type": "module").
 */
export default withBundleAnalyzer(withPWA(baseConfig));
