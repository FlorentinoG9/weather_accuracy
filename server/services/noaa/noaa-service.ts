import type { WeatherServiceResponse } from "../../../src/lib/weather-types.js";
import type { WeatherService, WeatherServiceConfig } from "../sdk.js";
import {
  fetchForecast,
  fetchNOAAPoint,
  fetchObservation,
  getNearestStation,
} from "./noaa-api.js";
import {
  extractLocation,
  transformForecast,
  transformObservation,
} from "./noaa-transform.js";

/**
 * NOAA Weather Service implementation
 * National Weather Service API - Public, no API key required
 */
export class NOAAService implements WeatherService {
  private readonly config: WeatherServiceConfig;

  constructor(config: WeatherServiceConfig = {}) {
    this.config = config;
  }

  getName(): string {
    return "noaa";
  }

  getDisplayName(): string {
    return "NOAA";
  }

  isConfigured(): boolean {
    // NOAA doesn't require API keys - always configured
    return true;
  }

  getConfig(): WeatherServiceConfig | null {
    return this.config;
  }

  async fetchWeather(
    latitude: number,
    longitude: number
  ): Promise<WeatherServiceResponse> {
    const timeout = this.config.timeout || 10_000;

    try {
      // Fetch point data
      const pointData = await fetchNOAAPoint(latitude, longitude, timeout);

      // Get nearest station
      const nearestStation = await getNearestStation(
        pointData.properties.observationStations,
        timeout
      );

      // Fetch observation and forecast in parallel
      const [obsData, forecastData] = await Promise.all([
        fetchObservation(nearestStation, timeout),
        fetchForecast(pointData.properties.forecast, timeout),
      ]);

      // Transform data
      const current = transformObservation(
        obsData.properties,
        forecastData.properties.periods[0] || null,
        obsData.properties.timestamp
      );

      const forecast = transformForecast(forecastData.properties.periods);
      const location = extractLocation(pointData, latitude, longitude);

      return {
        service: "noaa",
        current,
        forecast,
        location,
      };
    } catch (error) {
      throw new Error(
        `NOAA API error: ${error instanceof Error ? error.message : "Unknown error"}`
      );
    }
  }
}
