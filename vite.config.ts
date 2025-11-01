import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// This base path is REQUIRED for GitHub Pages
export default defineConfig({
  plugins: [react()],
  base: "/annotation-insight/",
});
