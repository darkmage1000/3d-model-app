import { readFileSync } from "node:fs";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { viteSingleFile } from "vite-plugin-singlefile";

// Keep this separate from the web build: a file opened from disk cannot fetch
// JS chunks, styles, fonts, or icons from a web server.
export default defineConfig({
  base: "./",
  publicDir: false,
  plugins: [
    react(),
    {
      name: "inline-app-icon",
      transformIndexHtml: {
        order: "pre",
        handler(html) {
          const icon = readFileSync(
            new URL("./public/favicon.svg", import.meta.url),
          );
          return html.replace(
            'href="/favicon.svg"',
            `href="data:image/svg+xml;base64,${icon.toString("base64")}"`,
          );
        },
      },
    },
    viteSingleFile({ removeViteModuleLoader: true }),
  ],
  build: {
    outDir: "release",
    emptyOutDir: true,
  },
});
