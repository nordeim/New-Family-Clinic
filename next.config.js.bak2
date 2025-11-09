// next.config.js

/**
 * Run `build` or `dev` with `SKIP_ENV_VALIDATION` to skip env validation.
 * This is especially useful for Docker builds.
 */
import "./src/env.js";

import withBundleAnalyzer from "@next/bundle-analyzer";
import withPWA from "next-pwa";

// =================================================================
// 1. SECURITY HEADERS CONFIGURATION (from Phase 9)
// Defines a strict Content Security Policy and other security headers.
// =================================================================
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

// =================================================================
// 2. BASE NEXT.JS CONFIGURATION (Consolidated)
// All core Next.js settings go here.
// =================================================================
/** @type {import('next').NextConfig} */
const baseConfig = {
  reactStrictMode: true,
  
  // Image Optimization configuration (from Phase 8)
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "*.supabase.co",
      },
    ],
    formats: ["image/avif", "image/webp"],
  },

  // Enable Gzip compression (from Phase 8)
  compress: true,

  // Remove the "x-powered-by" header for security (Best Practice)
  poweredByHeader: false,
  
  // Add security headers (from Phase 9)
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          {
            key: "Content-Security-Policy",
            value: cspHeader.replace(/\s{2,}/g, ' ').trim(),
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
            value: "camera=(), microphone=(), geolocation=()", // Restrict sensitive APIs by default
          },
        ],
      },
    ];
  },
};

// =================================================================
// 3. PWA PLUGIN CONFIGURATION (from Phase 8)
// This wraps the base config to add PWA capabilities.
// =================================================================
const pwaConfig = withPWA({
  dest: "public",
  register: true,
  skipWaiting: true,
  disable: process.env.NODE_ENV === "development",
});

// =================================================================
// 4. BUNDLE ANALYZER PLUGIN CONFIGURATION (from Phase 8)
// This wraps the PWA-enabled config to add bundle analysis.
// =================================================================
const bundleAnalyzer = withBundleAnalyzer({
  enabled: process.env.ANALYZE === "true",
});

// =================================================================
// 5. EXPORT THE FINAL, CHAINED CONFIGURATION
// The plugins are chained in order: bundleAnalyzer(pwaConfig(baseConfig))
// =================================================================
export default bundleAnalyzer(pwaConfig(baseConfig));
