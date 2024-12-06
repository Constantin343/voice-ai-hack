import type { NextConfig } from "next";

const nextConfig: NextConfig = {
    images: {
        // Configure external image domains
        remotePatterns: [
            {
                protocol: "https",
                hostname: "gkdjaaitkcaphgqdhevy.supabase.co",
                pathname: "/storage/v1/object/public/web_assets/**",
            },
        ],
    },
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