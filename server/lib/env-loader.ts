/**
 * Safely load environment variables from .env file
 * Only works in Node.js environments, not in Cloudflare Workers
 * In Cloudflare, environment variables are automatically available via process.env
 */
export function loadEnvIfNeeded(): void {
  // Skip in Cloudflare Workers/Pages
  if (
    typeof process === "undefined" ||
    !process.env ||
    "CF_PAGES" in process.env ||
    typeof globalThis.navigator !== "undefined"
  ) {
    return;
  }

  // Only load in Node.js environments
  if (typeof process.env.NODE_ENV !== "undefined") {
    try {
      // Dynamic import to avoid bundling dotenv in Cloudflare Workers
      import("dotenv")
        .then((dotenv) => {
          dotenv.config();
        })
        .catch(() => {
          // dotenv not available or not needed
        });
    } catch {
      // dotenv not available or not needed
    }
  }
}

