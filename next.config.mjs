// resend-webui.vercel.app and the resend-webui-api backend are different sites, so a
// cookie set directly by the backend is cross-site: browsers that block third-party
// cookies (Safari/Firefox by default, Chrome Incognito by default) never store or send
// it, which broke login persistence. Proxying API calls through this same origin makes
// the auth cookie first-party for every browser.
const BACKEND_ORIGIN = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:4000';

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  experimental: {
    serverActions: {
      bodySizeLimit: '10mb',
    },
  },
  async rewrites() {
    return [
      {
        source: '/api-proxy/:path*',
        destination: `${BACKEND_ORIGIN}/:path*`,
      },
    ];
  },
};

export default nextConfig;
