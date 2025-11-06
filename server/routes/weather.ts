import { and, eq } from "drizzle-orm";
import { Hono } from "hono";
import { z } from "zod";
import type { ComparisonResult } from "../../src/lib/weather-types.js";
import { db } from "../db/client.js";
import { actualWeather, forecasts, locations } from "../db/schema.js";
import { weatherServiceRegistry } from "../services/index.js";

const weatherRouter = new Hono();

// Helper function to get or create location
async function getOrCreateLocation(
  latitude: number,
  longitude: number,
  locationIdParam: string | undefined,
  sessionId: string | undefined
): Promise<number | null> {
  if (locationIdParam) {
    const id = Number.parseInt(locationIdParam, 10);
    if (!Number.isNaN(id)) {
      return id;
    }
  }

  if (sessionId) {
    const existingLocation = await db
      .select()
      .from(locations)
      .where(
        and(
          eq(locations.sessionId, sessionId),
          eq(locations.latitude, latitude),
          eq(locations.longitude, longitude)
        )
      )
      .limit(1);

    if (existingLocation.length > 0) {
      return existingLocation[0].id;
    }

    const newLocation = await db
      .insert(locations)
      .values({
        sessionId,
        latitude,
        longitude,
        createdAt: new Date(),
      })
      .returning();
    return newLocation[0].id;
  }

  // Try to find location by coordinates only
  const existingLocation = await db
    .select()
    .from(locations)
    .where(
      and(eq(locations.latitude, latitude), eq(locations.longitude, longitude))
    )
    .limit(1);

  if (existingLocation.length > 0) {
    return existingLocation[0].id;
  }

  return null;
}

// Helper function to save weather data
async function saveWeatherData(
  locationId: number,
  services: ComparisonResult["services"]
): Promise<void> {
  const now = new Date();

  // Save current weather as actual weather observations
  // Use the first service's current weather as the "actual" observation
  if (services.length > 0 && services[0].current) {
    const actualData = services[0].current;
    await db.insert(actualWeather).values({
      locationId,
      weatherData: actualData,
      observedTimestamp: actualData.timestamp || now,
      createdAt: now,
    });
  }

  // Save forecasts for each service
  for (const service of services) {
    // Save current weather as a forecast (for future accuracy comparison)
    if (service.current) {
      await db.insert(forecasts).values({
        locationId,
        serviceName: service.service as "noaa" | "openweather" | "weatherapi",
        forecastData: service.current,
        forecastTimestamp: service.current.timestamp || now,
        createdAt: now,
      });
    }

    // Save future forecasts if available
    if (service.forecast && Array.isArray(service.forecast)) {
      for (const forecast of service.forecast) {
        await db.insert(forecasts).values({
          locationId,
          serviceName: service.service as "noaa" | "openweather" | "weatherapi",
          forecastData: forecast,
          forecastTimestamp: forecast.timestamp || now,
          createdAt: now,
        });
      }
    }
  }
}

// Helper function to fetch weather from services
async function fetchWeatherServices(
  latitude: number,
  longitude: number
): Promise<{
  services: ComparisonResult["services"];
  errors: Array<{ service: string; error: string }>;
}> {
  // Log which services are configured
  const allServices = weatherServiceRegistry.getAll();
  const configuredServices = weatherServiceRegistry.getConfigured();
  console.log(
    `Registered services: ${allServices.map((s) => s.getName()).join(", ")}`
  );
  console.log(
    `Configured services: ${configuredServices.map((s) => s.getName()).join(", ")}`
  );

  // Check configuration status for each service
  for (const service of allServices) {
    const isConfigured = service.isConfigured();
    console.log(
      `${service.getDisplayName()} (${service.getName()}): ${
        isConfigured ? "configured" : "NOT configured"
      }`
    );
    if (!isConfigured) {
      const config = service.getConfig();
      console.log(
        `  - API key present: ${!!config?.apiKey || !!process.env.OPENWEATHER_API_KEY || !!process.env.WEATHERAPI_KEY}`
      );
    }
  }

  // Fetch weather from all configured services using the SDK
  const results = await weatherServiceRegistry.fetchFromAll(
    latitude,
    longitude,
    true // Only fetch from configured services
  );

  const services: ComparisonResult["services"] = [];
  const errors: Array<{ service: string; error: string }> = [];

  // Collect successful results and log errors
  for (const result of results) {
    if (result.success) {
      services.push(result.data);
    } else {
      const errorMsg = result.error.message;
      console.error(`${result.serviceName} API error:`, errorMsg);
      errors.push({ service: result.serviceName, error: errorMsg });
    }
  }

  return { services, errors };
}

// GET /api/weather/compare - Fetch and compare current forecasts from all services
weatherRouter.get("/compare", async (c) => {
  try {
    const latitude = Number.parseFloat(c.req.query("lat") || "");
    const longitude = Number.parseFloat(c.req.query("lon") || "");
    const locationIdParam = c.req.query("locationId");
    const sessionId = c.req.query("sessionId");

    if (Number.isNaN(latitude) || Number.isNaN(longitude)) {
      return c.json(
        {
          success: false,
          error: "Latitude and longitude are required",
        },
        400
      );
    }

    const { services, errors } = await fetchWeatherServices(
      latitude,
      longitude
    );

    if (services.length === 0) {
      return c.json(
        {
          success: false,
          error: "All weather services failed",
        },
        500
      );
    }

    const comparison: ComparisonResult = {
      location: services[0]?.location || { latitude, longitude },
      services,
      timestamp: new Date(),
    };

    // Get or create location for saving weather data
    const locationId = await getOrCreateLocation(
      latitude,
      longitude,
      locationIdParam,
      sessionId
    );

    if (locationId) {
      // Save weather data if we have a locationId
      await saveWeatherData(locationId, services);
    }

    return c.json({
      success: true,
      comparison,
      locationId: locationId || undefined,
      debug: {
        configuredServices: weatherServiceRegistry
          .getConfigured()
          .map((s) => s.getName()),
        errors: errors.length > 0 ? errors : undefined,
      },
    });
  } catch (error) {
    console.error("Weather comparison error:", error);
    return c.json(
      {
        success: false,
        error: "Failed to compare weather services",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      500
    );
  }
});

// POST /api/weather/forecast - Store forecast data
weatherRouter.post("/forecast", async (c) => {
  try {
    const body = await c.req.json();
    const schema = z.object({
      locationId: z.number(),
      serviceName: z.enum(["noaa", "openweather", "weatherapi"]),
      forecastData: z.any(),
      forecastTimestamp: z.string().or(z.date()),
    });

    const validated = schema.parse(body);

    const result = await db
      .insert(forecasts)
      .values({
        locationId: validated.locationId,
        serviceName: validated.serviceName,
        forecastData: validated.forecastData,
        forecastTimestamp:
          typeof validated.forecastTimestamp === "string"
            ? new Date(validated.forecastTimestamp)
            : validated.forecastTimestamp,
        createdAt: new Date(),
      })
      .returning();

    return c.json(
      {
        success: true,
        forecast: result[0],
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

    console.error("Forecast storage error:", error);
    return c.json(
      {
        success: false,
        error: "Failed to store forecast",
      },
      500
    );
  }
});

// POST /api/weather/actual - Store actual weather observations
weatherRouter.post("/actual", async (c) => {
  try {
    const body = await c.req.json();
    const schema = z.object({
      locationId: z.number(),
      weatherData: z.any(),
      observedTimestamp: z.string().or(z.date()),
    });

    const validated = schema.parse(body);

    const result = await db
      .insert(actualWeather)
      .values({
        locationId: validated.locationId,
        weatherData: validated.weatherData,
        observedTimestamp:
          typeof validated.observedTimestamp === "string"
            ? new Date(validated.observedTimestamp)
            : validated.observedTimestamp,
        createdAt: new Date(),
      })
      .returning();

    return c.json(
      {
        success: true,
        actualWeather: result[0],
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

    console.error("Actual weather storage error:", error);
    return c.json(
      {
        success: false,
        error: "Failed to store actual weather",
      },
      500
    );
  }
});

export { weatherRouter };
