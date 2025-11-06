import { createClient } from "@libsql/client";
import { drizzle } from "drizzle-orm/libsql";
import { loadEnvIfNeeded } from "../lib/env-loader.js";
import * as schema from "./schema";

// Load environment variables (only in Node.js, not in Cloudflare Workers)
loadEnvIfNeeded();

function createDatabaseClient() {
  const databaseUrl = process.env.TURSO_DATABASE_URL;
  const authToken = process.env.TURSO_AUTH_TOKEN;

  if (!databaseUrl) {
    throw new Error(
      "TURSO_DATABASE_URL is not set. Please set it as an environment variable in Cloudflare Pages or in your .env file for local development."
    );
  }

  try {
    const tursoClient = createClient({
      url: databaseUrl,
      authToken,
    });

    return drizzle(tursoClient, { schema });
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";
    throw new Error(
      `Failed to initialize database client: ${errorMessage}. Make sure TURSO_DATABASE_URL and TURSO_AUTH_TOKEN are set correctly.`
    );
  }
}

// Initialize database client lazily to avoid errors at module load time
let dbInstance: ReturnType<typeof drizzle> | null = null;

export const db = (() => {
  if (!dbInstance) {
    dbInstance = createDatabaseClient();
  }
  return dbInstance;
})();
