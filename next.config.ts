import type { NextConfig } from "next";

// Set only while previewing on the GitHub Pages project URL
// (NEXT_PUBLIC_BASE_PATH=/precision-painting-pro). Unset at domain cutover.
const basePath = process.env.NEXT_PUBLIC_BASE_PATH || "";

const nextConfig: NextConfig = {
  output: "export",
  basePath,
  images: { unoptimized: true },
  trailingSlash: true,
};

export default nextConfig;
