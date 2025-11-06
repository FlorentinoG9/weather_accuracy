import { createClient } from "@libsql/client";
import { config } from "dotenv";
import { drizzle } from "drizzle-orm/libsql";
import * as schema from "./schema";

// Load environment variables
config();

const databaseUrl = process.env.TURSO_DATABASE_URL;
const authToken = process.env.TURSO_AUTH_TOKEN;

if (!databaseUrl) {
  throw new Error(
    "TURSO_DATABASE_URL is not set. Please create a .env file with your Turso database credentials."
  );
}

const tursoClient = createClient({
  url: databaseUrl,
  authToken,
});

export const db = drizzle(tursoClient, { schema });
