/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  webpack: (config) => {
    // duckdb-wasm ships a Node-only build that webpack scans but the browser never uses.
    config.ignoreWarnings = [
      ...(config.ignoreWarnings ?? []),
      { module: /@duckdb[\\/]duckdb-wasm[\\/]dist[\\/]duckdb-node/ },
    ];
    return config;
  },
};

export default nextConfig;
