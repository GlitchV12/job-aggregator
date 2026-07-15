import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    port: 5174,
    proxy: {
      "/api": {
        target: "http://localhost:8000",
        changeOrigin: true,
      },
    },
  },
  // In production builds, VITE_API_URL is prepended to all /api calls
  // Set this in Vercel environment variables to your Railway backend URL
  define: {
    __API_BASE__: JSON.stringify(process.env.VITE_API_URL ?? ""),
  },
});
