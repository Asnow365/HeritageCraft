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
    rollupOptions: {
      output: {
        manualChunks: {
          react: ["react", "react-dom", "react-router", "react-router-dom"],
          three: ["three", "@react-three/fiber", "@react-three/drei"],
          antd: ["antd"],
          echarts: ["echarts", "echarts-for-react"],
          d3: ["d3", "d3-cloud", "d3-sankey", "d3-dispatch", "react-d3-cloud"],
          leaflet: ["leaflet", "react-leaflet", "leaflet-draw", "react-leaflet-draw"],
        },
      },
    },
  },
});
