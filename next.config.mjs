/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  experimental: {
    optimizePackageImports: ["antd"],
    optimizeCss: true,
    cssChunking: "strict", // Better CSS chunking
  },
  transpilePackages: ["antd"],
  modularizeImports: {
    antd: {
      transform: "antd/es/{{member}}",
    },
  },
  compiler: {
    // Remove console logs in production
    removeConsole: process.env.NODE_ENV === "production",
  },
  // Optimize CSS loading
  webpack: (config, { dev, isServer }) => {
    if (!dev && !isServer) {
      // Optimize CSS chunks
      config.optimization.splitChunks.cacheGroups.antd = {
        name: "antd",
        test: /[\\/]node_modules[\\/]antd[\\/]/,
        chunks: "all",
        priority: 10,
        reuseExistingChunk: true,
      };
    }
    return config;
  },
};

export default nextConfig;
