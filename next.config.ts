import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  transpilePackages: ["lucide-react"],
  allowedDevOrigins: ["10.10.70.8", "localhost"],
};

export default nextConfig;
