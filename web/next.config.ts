import path from "node:path";
import type { NextConfig } from "next";

const raizDoRepositorio = path.join(import.meta.dirname, "..");

const nextConfig: NextConfig = {
  cacheComponents: true,
  partialPrefetching: true,
  // web/ depende de ../shared (@natal/shared via file:). No App Hosting o web é
  // instalado sozinho, então a raiz do Turbopack precisa ser a pasta-mãe.
  outputFileTracingRoot: raizDoRepositorio,
  turbopack: {
    root: raizDoRepositorio,
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
