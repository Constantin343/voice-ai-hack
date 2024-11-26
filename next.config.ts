import type { NextConfig } from "next";

const nextConfig: NextConfig = {
    webpack: (config) => {
        // Add fallbacks for crypto and stream if using them in server-side packages
        config.resolve.fallback = {
            ...config.resolve.fallback,
            crypto: require.resolve("crypto-browserify"),
            stream: require.resolve("stream-browserify"),
        };
        return config;
    },
    serverExternalPackages: ["twitter-api-v2"], // Add the package here
};

export default nextConfig;