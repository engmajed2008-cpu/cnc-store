import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin("./src/lib/i18n.ts");

/** @type {import('next').NextConfig} */
const nextConfig = {
  // ── Standalone output for Docker ──
  output: "standalone",
  typescript: { ignoreBuildErrors: true },
  eslint: { ignoreDuringBuilds: true },

  // ── Image optimization ────────────
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "images.unsplash.com" },
      { protocol: "https", hostname: "cdn.e3lani.com" },
    ],
    // Serve WebP/AVIF automatically
    formats: ["image/avif", "image/webp"],
  },

  // ── Headers (security + cache) ────
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "X-DNS-Prefetch-Control", value: "on" },
          { key: "X-Content-Type-Options",  value: "nosniff" },
          { key: "X-Frame-Options",         value: "SAMEORIGIN" },
        ],
      },
      {
        // Immutable cache for hashed Next.js static files
        source: "/_next/static/(.*)",
        headers: [
          { key: "Cache-Control", value: "public, max-age=31536000, immutable" },
        ],
      },
    ];
  },

  // ── Redirects ─────────────────────
  async redirects() {
    return [
      { source: "/products", destination: "/ar/products/cnc", permanent: false },
    ];
  },

  // ── Webpack optimizations ─────────
  webpack(config) {
    config.optimization = {
      ...config.optimization,
      moduleIds: "deterministic",
    };
    return config;
  },

  // ── Experimental ──────────────────
   experimental: {
    optimizePackageImports: ["lucide-react", "clsx"],
    missingSuspenseWithCSRBailout: false,
    workerThreads: false,
    cpus: 1,
  },
  // ── Logging ───────────────────────
  logging: {
    fetches: { fullUrl: process.env.NODE_ENV === "development" },
  },
};

export default withNextIntl(nextConfig);
