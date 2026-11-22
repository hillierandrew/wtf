import { fileURLToPath, URL } from "node:url";
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

/** Static build for GitHub Pages at hillierandrew.github.io/wtf/ */
export default defineConfig({
  base: "/wtf/",
  publicDir: false,
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
    },
  },
  build: {
    outDir: "dist-pages",
    emptyOutDir: true,
    rollupOptions: {
      input: fileURLToPath(new URL("./pages/index.html", import.meta.url)),
    },
  },
});
