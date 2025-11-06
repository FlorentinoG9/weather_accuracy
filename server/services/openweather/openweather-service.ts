import type { WeatherServiceResponse } from "../../../src/lib/weather-types.js";
import { loadEnvIfNeeded } from "../../lib/env-loader.js";
import type { WeatherService, WeatherServiceConfig } from "../sdk.js";
import {
  fetchOpenWeatherCurrent,
  fetchOpenWeatherForecast,
} from "./openweather-api.js";
import {
  extractLocation,
  transformCurrent,
  transformForecast,
} from "./openweather-transform.js";

// Load environment variables (only in Node.js, not in Cloudflare Workers)
loadEnvIfNeeded();

/**
 * OpenWeatherMap Service implementation
 */
export class OpenWeatherService implements WeatherService {
  private readonly config: WeatherServiceConfig;

  constructor(config: WeatherServiceConfig = {}) {
    this.config = {
      apiKey: process.env.OPENWEATHER_API_KEY,
      baseUrl: "https://api.openweathermap.org/data/2.5",
      ...config,
    };
  }

  getName(): string {
    return "openweather";
  }

  getDisplayName(): string {
    return "OpenWeatherMap";
  }

  isConfigured(): boolean {
    return !!this.config.apiKey;
  }

  getConfig(): WeatherServiceConfig | null {
    return this.isConfigured() ? this.config : null;
  }

  async fetchWeather(
    latitude: number,
    longitude: number
  ): Promise<WeatherServiceResponse> {
    const apiKey = this.config.apiKey;

    if (!apiKey) {
      throw new Error("OpenWeatherMap API key not configured");
    }

    const baseUrl =
      this.config.baseUrl || "https://api.openweathermap.org/data/2.5";

    try {
      // Fetch current weather and forecast in parallel
      const [currentData, forecastData] = await Promise.all([
        fetchOpenWeatherCurrent(baseUrl, apiKey, latitude, longitude),
        fetchOpenWeatherForecast(baseUrl, apiKey, latitude, longitude),
      ]);

      // Transform data
      const current = transformCurrent(currentData);
      const forecast = transformForecast(forecastData.list);
      const location = extractLocation(
        currentData,
        forecastData,
        latitude,
        longitude
      );

      return {
        service: "openweather",
        current,
        forecast,
        location,
      };
    } catch (error) {
      throw new Error(
        `OpenWeatherMap API error: ${error instanceof Error ? error.message : "Unknown error"}`
      );
    }
  }
}
