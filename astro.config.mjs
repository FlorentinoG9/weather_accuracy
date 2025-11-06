// @ts-check

import react from "@astrojs/react";
import vercel from "@astrojs/vercel";
import tailwindcss from "@tailwindcss/vite";
import { defineConfig } from "astro/config";

// https://astro.build/config
export default defineConfig({
  output: "server",
  adapter: vercel(),
  integrations: [react()],
  // Configure image service for Cloudflare (sharp only works at build time for prerendered pages)
  image: {
    service: {
      entrypoint: "astro/assets/services/sharp",
    },
  },

  vite: {
    plugins: [tailwindcss()],
  },
});
