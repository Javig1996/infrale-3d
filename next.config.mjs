/** @type {import('next').NextConfig} */
const nextConfig = {
  webpack: (config) => {
    config.experiments = { ...config.experiments, asyncWebAssembly: true };
    return config;
  },
  async headers() {
    return [
      {
        // Headers necesarios para SharedArrayBuffer y WASM en el visor IFC
        source: "/ifc-viewer/:path*",
        headers: [
          { key: "Cross-Origin-Opener-Policy",   value: "same-origin" },
          { key: "Cross-Origin-Embedder-Policy",  value: "require-corp" },
          { key: "Cross-Origin-Resource-Policy",  value: "cross-origin" },
        ],
      },
    ];
  },
};

export default nextConfig;
