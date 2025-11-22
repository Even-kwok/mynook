/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: false,
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
    ],
    unoptimized: true,
  },
  // 确保 api/ 目录下的 Serverless Functions 可以被访问
  async rewrites() {
    return {
      beforeFiles: [
        // 保留根目录 api/ 文件夹的 serverless functions
        // Vercel 会自动处理这些文件
      ],
    };
  },
  experimental: {
    serverComponentsExternalPackages: ['onnxruntime-node', '@google/genai', 'sharp'],
  },
  webpack: (config, { isServer }) => {
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        path: false,
        crypto: false,
        os: false,
        net: false,
        tls: false,
        child_process: false,
        "onnxruntime-node": false,
      };
    }

    // 强制处理 .mjs 文件为模块
    config.module.rules.push({
      test: /\.mjs$/,
      include: /node_modules/,
      type: "javascript/auto",
    });

    // 启用 asyncWebAssembly 支持
    config.experiments = {
      ...config.experiments,
      asyncWebAssembly: true,
      layers: true,
    };
    
    return config;
  },
};

export default nextConfig;
