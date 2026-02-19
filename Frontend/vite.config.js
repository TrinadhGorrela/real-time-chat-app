import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  define: {
    global: "globalThis",
  },
  server: {
    port: 3000,
    proxy: {
      "/chatapp": {
        target: "https://localhost:8081",
        changeOrigin: true,
        secure: false,
      },
      "/files": {
        target: "https://localhost:8081",
        changeOrigin: true,
        secure: false,
      },
      "/ws": {
        target: "https://localhost:8081",
        changeOrigin: true,
        ws: true,
        secure: false,
      },
    },
  },
});
