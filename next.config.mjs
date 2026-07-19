import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin("./src/lib/i18n.ts");

/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ["mapbox-gl"],
  typescript: { ignoreBuildErrors: true },
  eslint: { ignoreDuringBuilds: true },
  staticPageGenerationTimeout: 1000,

  images: {
    remotePatterns: [
      { protocol: "https", hostname: "images.unsplash.com" },
      { protocol: "https", hostname: "cdn.e3lani.com" },
    ],
    formats: ["image/avif", "image/webp"],
  },

  async headers() {
    const supabaseHost = "cgpisiscqpqhdprkuldo.supabase.co";
    const cloudinaryHost = "res.cloudinary.com";

    const csp = [
      "default-src 'self'",
      `connect-src 'self' https://${supabaseHost} https://api.${supabaseHost} wss://${supabaseHost} https://api.mapbox.com https://events.mapbox.com https://nominatim.openstreetmap.org https://*.tile.openstreetmap.org https://tile.openstreetmap.org https://tiles.stadiamaps.com https://cdn.jsdelivr.net`,
      `img-src 'self' data: blob: https://${cloudinaryHost} https://res.cloudinary.com https://lh3.googleusercontent.com https://images.unsplash.com https://*.mapbox.com https://tile.openstreetmap.org https://*.tile.openstreetmap.org https://tiles.stadiamaps.com`,
      "font-src 'self' https://fonts.gstatic.com https://fonts.googleapis.com",
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com https://api.mapbox.com",
      "script-src 'self' 'unsafe-eval' 'unsafe-inline' https://api.mapbox.com https://cdn.jsdelivr.net",
      "worker-src 'self' blob: https://cdn.jsdelivr.net",
      "frame-src 'self' https://www.openstreetmap.org https://openstreetmap.org",
      "frame-ancestors 'none'",
      "base-uri 'self'",
      "form-action 'self'",
    ].join("; ");

    return [
      {
        source: "/(.*)",
        headers: [
          { key: "X-DNS-Prefetch-Control",       value: "on" },
          { key: "X-Content-Type-Options",        value: "nosniff" },
          { key: "X-Frame-Options",               value: "SAMEORIGIN" },
          { key: "Referrer-Policy",               value: "strict-origin-when-cross-origin" },
          { key: "Permissions-Policy",            value: "camera=(), microphone=(), geolocation=(self), payment=()" },
          { key: "Strict-Transport-Security",     value: "max-age=63072000; includeSubDomains; preload" },
          { key: "Content-Security-Policy",       value: csp },
        ],
      },
      // Only immutable-cache static chunks in production (where filenames are content-hashed).
      // In dev, chunk names are predictable — caching them prevents code changes from reaching the browser.
      ...(process.env.NODE_ENV === "production" ? [{
        source: "/_next/static/(.*)",
        headers: [
          { key: "Cache-Control", value: "public, max-age=31536000, immutable" },
        ],
      }] : []),
    ];
  },

  async redirects() {
    return [
      { source: "/products", destination: "/ar/products/cnc", permanent: false },
    ];
  },


  experimental: {
    missingSuspenseWithCSRBailout: false,
    workerThreads: false,
    cpus: 1,
  },

  logging: {
    fetches: { fullUrl: process.env.NODE_ENV === "development" },
  },
};

export default withNextIntl(nextConfig);