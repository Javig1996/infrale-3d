/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: [
    "@thatopen/components",
    "@thatopen/fragments",
    "camera-controls",
  ],
  webpack: (config) => {
    config.experiments = { ...config.experiments, asyncWebAssembly: true };
    // Resolver .mjs para paquetes ESM de @thatopen
    config.resolve.extensionAlias = {
      ".js": [".js", ".ts", ".tsx"],
    };
    return config;
  },
  async headers() {
    return [
      {
        source: "/ifc-viewer/:path*.wasm",
        headers: [
          { key: "Content-Type", value: "application/wasm" },
          { key: "Cache-Control", value: "public, max-age=31536000, immutable" },
        ],
      },
    ];
  },
};

export default nextConfig;
