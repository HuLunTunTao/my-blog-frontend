import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    headers: {
      "Access-Control-Allow-Origin": "*",
    },
  },
  preview: {
    headers: {
      "Access-Control-Allow-Origin": "*",
    },
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    rollupOptions: {
      output: {
        // SSR HTML intentionally loads /assets/index.js as a stable entry.
        // Generate that file directly so async chunks import the same module
        // instance instead of a copied hashed entry plus the original hash.
        entryFileNames: "assets/[name].js",
        manualChunks(id) {
          if (!id.includes("node_modules")) return;
          // Keep manual grouping minimal. Heavy markdown libs (katex,
          // react-syntax-highlighter, mermaid, the remark/rehype stack) are
          // only reached through the lazy PostPage route, so we let Rollup
          // auto-split them into that async subgraph rather than forcing named
          // chunks — forcing them caused Rollup to hoist one into the eager
          // entry. Only split the clearly-shared react runtime and the
          // analytics-only geo libs.
          if (/[\\/]node_modules[\\/](react|react-dom|react-router|react-router-dom|scheduler)[\\/]/.test(id)) return "react-vendor";
          if (/[\\/]node_modules[\\/](d3-geo|topojson-client|world-atlas|china-map-geojson)[\\/]/.test(id)) return "geo";
          return undefined;
        },
      },
    },
  },
})
