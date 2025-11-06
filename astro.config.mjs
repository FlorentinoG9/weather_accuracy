// @ts-check

import cloudflare from "@astrojs/cloudflare";
import react from "@astrojs/react";
import tailwindcss from "@tailwindcss/vite";
import { defineConfig } from "astro/config";

// https://astro.build/config
export default defineConfig({
  output: "server",
  adapter: cloudflare({
    // Disable sessions to avoid needing KV binding
    // If you need sessions later, add a SESSION KV namespace in Cloudflare dashboard
    // and uncomment the kvNamespaces option below
    // kvNamespaces: ["SESSION"],
  }),
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
