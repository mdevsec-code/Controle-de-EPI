import path from "node:path";
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vitest/config";
import pkg from "./package.json" with { type: "json" };

export default defineConfig({
  plugins: [react(), tailwindcss()],
  define: {
    __APP_VERSION__: JSON.stringify(pkg.version),
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  server: {
    port: 5173,
    // Mesmo site em dev: o navegador fala so com o Vite, que repassa /api para a API.
    // Isso permite cookie de refresh SameSite=Strict sem CORS.
    proxy: {
      "/api": {
        target: process.env.API_PROXY_TARGET ?? "http://localhost:3333",
        changeOrigin: false,
      },
    },
  },
  test: {
    environment: "jsdom",
    include: ["src/**/*.test.{ts,tsx}"],
    setupFiles: ["src/test/setup.ts"],
    css: false,
    // Testes com userEvent + jsdom ficam lentos em CI com builds em paralelo; 5s padrao gera falso negativo.
    testTimeout: 15_000,
  },
});
