import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  base: "/HeritageCraft/",
  plugins: [react()],
  server: {
    host: true,
    port: 6006,
    hmr: {
      overlay: false,
    },
  },
  build: {
    sourcemap: false,
    minify: "esbuild",
    cssCodeSplit: false,
  },
});
