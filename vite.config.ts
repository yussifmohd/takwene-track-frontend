import path from "node:path";
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: { "@": path.resolve(import.meta.dirname, "src") },
  },
  server: {
    port: 5173,
    strictPort: true,
    // Same-origin /api in development, like nginx does in Docker.
    proxy: { "/api": { target: "http://localhost:8080", changeOrigin: true } },
  },
  build: {
    sourcemap: false,
  },
});
