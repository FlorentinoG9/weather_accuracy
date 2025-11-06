/** biome-ignore-all lint/suspicious/noExplicitAny: biome is dumb */
import { and, eq } from "drizzle-orm";
import { Hono } from "hono";
import type { ForecastData, WeatherData } from "../../src/lib/weather-types.js";
import { db } from "../db/client.js";
import { accuracyMetrics, actualWeather, forecasts } from "../db/schema.js";

const accuracyRouter = new Hono();

// Calculate accuracy score between forecast and actual weather
function calculateAccuracyScore(
  forecast: ForecastData,
  actual: WeatherData
): number {
  let score = 0;
  let totalWeight = 0;

  // Temperature accuracy (weight: 40%)
  if (forecast.temperature !== undefined && actual.temperature !== undefined) {
    const tempError = Math.abs(forecast.temperature - actual.temperature);
    const tempScore = Math.max(0, 100 - tempError * 2); // 1°F = 2 points
    score += tempScore * 0.4;
    totalWeight += 0.4;
  }

  // Humidity accuracy (weight: 20%)
  if (forecast.humidity !== undefined && actual.humidity !== undefined) {
    const humidityError = Math.abs(forecast.humidity - actual.humidity);
    const humidityScore = Math.max(0, 100 - humidityError); // 1% = 1 point
    score += humidityScore * 0.2;
    totalWeight += 0.2;
  }

  // Pressure accuracy (weight: 20%)
  if (forecast.pressure !== undefined && actual.pressure !== undefined) {
    const pressureError = Math.abs(forecast.pressure - actual.pressure);
    const pressureScore = Math.max(0, 100 - pressureError * 2); // 0.5 hPa = 1 point
    score += pressureScore * 0.2;
    totalWeight += 0.2;
  }

  // Wind speed accuracy (weight: 20%)
  if (forecast.windSpeed !== undefined && actual.windSpeed !== undefined) {
    const windError = Math.abs(forecast.windSpeed - actual.windSpeed);
    const windScore = Math.max(0, 100 - windError * 5); // 0.2 mph = 1 point
    score += windScore * 0.2;
    totalWeight += 0.2;
  }

  // Return weighted average (0-100)
  return totalWeight > 0 ? Math.min(100, Math.max(0, score / totalWeight)) : 0;
}

// GET /api/accuracy/:locationId - Get accuracy metrics for a location
// biome-ignore lint/complexity/noExcessiveCognitiveComplexity: biome is dumb
accuracyRouter.get("/:locationId", async (c) => {
  try {
    const locationId = Number.parseInt(c.req.param("locationId"), 10);

    if (Number.isNaN(locationId)) {
      return c.json(
        {
          success: false,
          error: "Invalid location ID",
        },
        400
      );
    }

    // Get all forecasts for this location
    const locationForecasts = await db
      .select()
      .from(forecasts)
      .where(eq(forecasts.locationId, locationId));

    // Get all actual weather observations for this location
    const locationActuals = await db
      .select()
      .from(actualWeather)
      .where(eq(actualWeather.locationId, locationId));

    // Calculate accuracy metrics
    const metrics: Array<{
      forecastId: number;
      serviceName: string;
      accuracyScore: number;
      timestamp: Date;
    }> = [];

    for (const forecast of locationForecasts) {
      // Find actual weather closest in time to forecast
      const forecastTime = new Date(forecast.forecastTimestamp).getTime();
      let closestActual: typeof actualWeather.$inferSelect | null = null;
      let minTimeDiff = Number.POSITIVE_INFINITY;

      for (const actual of locationActuals) {
        const actualTime = new Date(actual.observedTimestamp).getTime();
        const timeDiff = Math.abs(actualTime - forecastTime);

        // Consider actual weather within 1 hour of forecast time
        if (timeDiff < 3_600_000 && timeDiff < minTimeDiff) {
          minTimeDiff = timeDiff;
          closestActual = actual;
        }
      }

      if (closestActual) {
        const forecastData = forecast.forecastData as any;
        const actualData = closestActual.weatherData as any;

        const accuracyScore = calculateAccuracyScore(forecastData, actualData);

        // Check if accuracy metric already exists
        const existingMetric = await db
          .select()
          .from(accuracyMetrics)
          .where(
            and(
              eq(accuracyMetrics.forecastId, forecast.id),
              eq(accuracyMetrics.actualWeatherId, closestActual.id)
            )
          )
          .limit(1);

        if (existingMetric.length === 0) {
          // Create new accuracy metric
          await db.insert(accuracyMetrics).values({
            forecastId: forecast.id,
            actualWeatherId: closestActual.id,
            accuracyScore,
            temperatureError:
              forecastData.temperature !== undefined &&
              actualData.temperature !== undefined
                ? Math.abs(forecastData.temperature - actualData.temperature)
                : null,
            humidityError:
              forecastData.humidity !== undefined &&
              actualData.humidity !== undefined
                ? Math.abs(forecastData.humidity - actualData.humidity)
                : null,
            pressureError:
              forecastData.pressure !== undefined &&
              actualData.pressure !== undefined
                ? Math.abs(forecastData.pressure - actualData.pressure)
                : null,
            windSpeedError:
              forecastData.windSpeed !== undefined &&
              actualData.windSpeed !== undefined
                ? Math.abs(forecastData.windSpeed - actualData.windSpeed)
                : null,
            createdAt: new Date(),
          });
        }

        metrics.push({
          forecastId: forecast.id,
          serviceName: forecast.serviceName,
          accuracyScore,
          timestamp: forecast.forecastTimestamp,
        });
      }
    }

    // Get stored accuracy metrics
    const storedMetrics = await db
      .select({
        id: accuracyMetrics.id,
        forecastId: accuracyMetrics.forecastId,
        accuracyScore: accuracyMetrics.accuracyScore,
        temperatureError: accuracyMetrics.temperatureError,
        humidityError: accuracyMetrics.humidityError,
        pressureError: accuracyMetrics.pressureError,
        windSpeedError: accuracyMetrics.windSpeedError,
        createdAt: accuracyMetrics.createdAt,
        serviceName: forecasts.serviceName,
      })
      .from(accuracyMetrics)
      .innerJoin(forecasts, eq(accuracyMetrics.forecastId, forecasts.id))
      .where(eq(forecasts.locationId, locationId));

    return c.json({
      success: true,
      metrics: storedMetrics,
    });
  } catch (error) {
    console.error("Accuracy calculation error:", error);
    return c.json(
      {
        success: false,
        error: "Failed to calculate accuracy metrics",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      500
    );
  }
});

export { accuracyRouter };
