import { createClient } from "@libsql/client";
import { drizzle } from "drizzle-orm/libsql";
import * as schema from "./schema";
import { loadEnvIfNeeded } from "../lib/env-loader.js";

// Load environment variables (only in Node.js, not in Cloudflare Workers)
loadEnvIfNeeded();

const databaseUrl = process.env.TURSO_DATABASE_URL;
const authToken = process.env.TURSO_AUTH_TOKEN;

if (!databaseUrl) {
  throw new Error(
    "TURSO_DATABASE_URL is not set. Please set it as an environment variable in Cloudflare Pages or in your .env file for local development."
  );
}

const tursoClient = createClient({
  url: databaseUrl,
  authToken,
});

export const db = drizzle(tursoClient, { schema });
