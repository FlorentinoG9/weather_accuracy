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

    console.error("Location storage error:", error);
    return c.json(
      {
        success: false,
        error: "Failed to store location",
      },
      500
    );
  }
});
