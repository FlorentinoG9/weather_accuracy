import { config as dotenvConfig } from "dotenv";

/**
 * Safely load environment variables from .env file.
 * Only works in Node.js environments, not in Cloudflare Workers.
 * In Cloudflare, environment variables are automatically available via process.env.
 */

let didLoadEnv = false;

export function loadEnvIfNeeded(): void {
  if (didLoadEnv) {
    return;
  }

  if (
    typeof process === "undefined" ||
    !process.env ||
    "CF_PAGES" in process.env ||
    typeof globalThis.navigator !== "undefined"
  ) {
    didLoadEnv = true;
    return;
  }

  try {
    dotenvConfig();
  } catch {
    // dotenv not available or not needed
  } finally {
    didLoadEnv = true;
  }
}
