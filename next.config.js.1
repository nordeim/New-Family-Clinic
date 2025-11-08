// next.config.js

/**
 * Run `build` or `dev` with `SKIP_ENV_VALIDATION` to skip env validation.
 * This is especially useful for Docker builds.
 */
import "./src/env.js";

import withBundleAnalyzer from "@next/bundle-analyzer";
import withPWA from "next-pwa";

// =================================================================
// 1. BASE NEXT.JS CONFIGURATION
// All core Next.js settings go here.
// =================================================================
/** @type {import('next').NextConfig} */
const baseConfig = {
  reactStrictMode: true,
  
  // Image Optimization configuration
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "*.supabase.co", // Allows images from your Supabase storage bucket
      },
    ],
    formats: ["image/avif", "image/webp"], // Serve modern, optimized image formats
  },

  // Enable Gzip compression for server-rendered pages and assets
  compress: true,

  // Remove the "x-powered-by" header for security
  poweredByHeader: false,
};

// =================================================================
// 2. PWA PLUGIN CONFIGURATION
// This wraps the base config to add PWA capabilities.
// =================================================================
const withPWAConfig = withPWA({
  dest: "public",
  register: true,
  skipWaiting: true,
  disable: process.env.NODE_ENV === "development", // Disable PWA in dev for faster reloads
  runtimeCaching: [
    // Add your runtime caching strategies here if needed.
    // Example for caching API calls:
    // {
    //   urlPattern: /^https?.*/api\/.*/,
    //   handler: 'NetworkFirst',
    //   options: {
    //     cacheName: 'api-cache',
    //     expiration: {
    //       maxEntries: 10,
    //       maxAgeSeconds: 60 * 60, // 1 hour
    //     },
    //   },
    // },
  ],
});

// =================================================================
// 3. BUNDLE ANALYZER PLUGIN CONFIGURATION
// This wraps the PWA-enabled config to add bundle analysis.
// =================================================================
const bundleAnalyzer = withBundleAnalyzer({
  enabled: process.env.ANALYZE === "true",
});

// =================================================================
// 4. EXPORT THE FINAL, CHAINED CONFIGURATION
// The plugins are chained: bundleAnalyzer(pwaConfig(baseConfig))
// =================================================================
export default bundleAnalyzer(withPWAConfig(baseConfig));
