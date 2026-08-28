import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  // 部署在云 nginx 子路径 https://weirunjob.cn/phone-data/ 下
  basePath: "/phone-data",
  env: {
    // 客户端 fetch 需手动拼前缀（Next basePath 不会自动加到手写 fetch）
    NEXT_PUBLIC_BASE_PATH: "/phone-data",
  },
  /* config options here */
  typescript: {
    ignoreBuildErrors: true,
  },
  reactStrictMode: false,
};

export default nextConfig;
