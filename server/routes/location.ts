import { Hono } from "hono";
import { z } from "zod";
import { db } from "../db/client.js";
import { locations } from "../db/schema.js";

const locationSchema = z.object({
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
  sessionId: z.string().optional(),
});

export const locationRouter = new Hono();

// POST /api/location - Store anonymous user location
locationRouter.post("/", async (c) => {
  try {
    // Check if database is accessible
    if (!process.env.TURSO_DATABASE_URL) {
      console.error("TURSO_DATABASE_URL is not set");
      return c.json(
        {
          success: false,
          error: "Database configuration error",
          message: "TURSO_DATABASE_URL environment variable is not set",
        },
        500
      );
    }

    if (!process.env.TURSO_AUTH_TOKEN) {
      console.error("TURSO_AUTH_TOKEN is not set");
      return c.json(
        {
          success: false,
          error: "Database authentication error",
          message:
            "TURSO_AUTH_TOKEN environment variable is not set. This will cause 401 authentication errors.",
        },
        500
      );
    }

    const body = await c.req.json();
    const validated = locationSchema.parse(body);

    // Generate session ID if not provided
    const sessionId =
      validated.sessionId ||
      `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    const result = await db
      .insert(locations)
      .values({
        sessionId,
        latitude: validated.latitude,
        longitude: validated.longitude,
        createdAt: new Date(),
      })
      .returning();

    return c.json(
      {
        success: true,
        location: result[0],
      },
      201
    );
  } catch (error) {
    if (error instanceof z.ZodError) {
      return c.json(
        {
          success: false,
          error: "Invalid request data",
          details: error.errors,
        },
        400
      );
    }

    // Log detailed error for debugging (in production, check Cloudflare logs)
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";
    const errorStack = error instanceof Error ? error.stack : undefined;

    // Check for 401 authentication errors specifically
    const isAuthError =
      errorMessage.includes("401") ||
      errorMessage.includes("SERVER_ERROR") ||
      (error instanceof Error &&
        "cause" in error &&
        typeof error.cause === "object" &&
        error.cause !== null &&
        "code" in error.cause &&
        error.cause.code === "SERVER_ERROR");

    if (isAuthError) {
      console.error("Location storage authentication error:", {
        message: errorMessage,
        hint: "Check that TURSO_AUTH_TOKEN is set correctly in your .env file",
        stack: errorStack,
        error,
      });
      return c.json(
        {
          success: false,
          error: "Database authentication failed",
          message:
            "Unable to authenticate with the database. Please check your TURSO_AUTH_TOKEN environment variable.",
          ...(process.env.NODE_ENV === "development" && {
            details: errorMessage,
          }),
        },
        500
      );
    }

    console.error("Location storage error:", {
      message: errorMessage,
      stack: errorStack,
      error,
    });

    // Return more detailed error in development, generic in production
    const isDevelopment =
      typeof process !== "undefined" && process.env.NODE_ENV === "development";

    return c.json(
      {
        success: false,
        error: "Failed to store location",
        ...(isDevelopment && { details: errorMessage }),
      },
      500
    );
  }
});
