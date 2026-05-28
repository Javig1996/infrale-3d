/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: [
    "@thatopen/components",
    "@thatopen/fragments",
    "camera-controls",
  ],
  webpack: (config, { dev }) => {
    config.experiments = { ...config.experiments, asyncWebAssembly: true };

    // Tratar .mjs de @thatopen como ESM (evita error de Terser con worker.mjs)
    config.module.rules.push({
      test: /\.mjs$/,
      include: /node_modules[\\/]@thatopen/,
      type: "javascript/auto",
    });

    // Indicar a Terser que los archivos .mjs son módulos ES
    if (!dev && config.optimization?.minimizer) {
      config.optimization.minimizer.forEach((plugin) => {
        if (plugin?.constructor?.name === "TerserPlugin") {
          plugin.options.terserOptions ??= {};
          plugin.options.terserOptions.module = true;
        }
      });
    }

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
