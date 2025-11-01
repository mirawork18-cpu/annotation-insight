import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  base: "/annotation-insight/", // 👈 Important for GitHub Pages
  build: {
    outDir: "dist", // GitHub Pages expects files in dist
  },
});
