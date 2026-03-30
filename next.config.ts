import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  outputFileTracingRoot: path.join(__dirname),
  allowedDevOrigins: ["192.168.100.162", "localhost", "127.0.0.1"],
};

export default nextConfig;
