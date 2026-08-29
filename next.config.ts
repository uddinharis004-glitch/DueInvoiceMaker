import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ["googleapis", "pdfkit", "sharp"],
};

export default nextConfig;
