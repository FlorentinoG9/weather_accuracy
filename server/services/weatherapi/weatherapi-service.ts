import { config } from "dotenv";
import type { WeatherServiceResponse } from "../../../src/lib/weather-types.js";
import type { WeatherService, WeatherServiceConfig } from "../sdk.js";
import { fetchWeatherAPIForecast } from "./weatherapi-api.js";
import {
  extractLocation,
  transformCurrent,
  transformForecast,
} from "./weatherapi-transform.js";

// Load environment variables
config();

/**
 * WeatherAPI.com Service implementation
 */
export class WeatherAPIService implements WeatherService {
  private readonly config: WeatherServiceConfig;

  constructor(config: WeatherServiceConfig = {}) {
    this.config = {
      apiKey: process.env.WEATHERAPI_KEY,
      baseUrl: "https://api.weatherapi.com/v1",
      timeout: 10_000,
      ...config,
    };
  }

  getName(): string {
    return "weatherapi";
  }

  getDisplayName(): string {
    return "WeatherAPI.com";
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
      throw new Error("WeatherAPI key not configured");
    }

    const baseUrl = this.config.baseUrl || "https://api.weatherapi.com/v1";

    try {
      // Fetch current weather and forecast (WeatherAPI returns both in one response)
      const data = await fetchWeatherAPIForecast(
        baseUrl,
        apiKey,
        latitude,
        longitude,
      );

      // Transform data
      const current = transformCurrent(data.current);
      const forecast = transformForecast(data.forecast.forecastday);
      const location = extractLocation(data, latitude, longitude);

      return {
        service: "weatherapi",
        current,
        forecast,
        location,
      };
    } catch (error) {
      throw new Error(
        `WeatherAPI error: ${error instanceof Error ? error.message : "Unknown error"}`
      );
    }
  }
}
