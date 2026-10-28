/** @type {import('next').NextConfig} */
const nextConfig = {
  async redirects() {
    return [
      {
        source: "/:path*",
        has: [{ type: "host", value: "vanguard-console.vercel.app" }],
        destination: "https://estafotir.vercel.app/:path*",
        permanent: true,
      },
    ];
  },
};

export default nextConfig;
