import { loadEnvIfNeeded } from "../lib/env-loader.js";
import { NOAAService } from "./noaa/noaa-service.js";
import { OpenWeatherService } from "./openweather/openweather-service.js";
import { weatherServiceRegistry } from "./sdk.js";
import { WeatherAPIService } from "./weatherapi/weatherapi-service.js";

// Load environment variables first (before instantiating services)
// Only works in Node.js, not in Cloudflare Workers
loadEnvIfNeeded();

// Log API key status for debugging (without exposing actual keys)
console.log("Environment check:");
console.log(
  `  OPENWEATHER_API_KEY: ${process.env.OPENWEATHER_API_KEY ? "✓ Set" : "✗ Not set"}`
);
console.log(
  `  WEATHERAPI_KEY: ${process.env.WEATHERAPI_KEY ? "✓ Set" : "✗ Not set"}`
);

// Register all weather services
const noaaService = new NOAAService({ timeout: 10_000 });
const openWeatherService = new OpenWeatherService({ timeout: 10_000 });
const weatherAPIService = new WeatherAPIService({ timeout: 10_000 });

weatherServiceRegistry.registerAll([
  noaaService,
  openWeatherService,
  weatherAPIService,
]);

export { NOAAService } from "./noaa/noaa-service.js";
export {
  fetchOpenWeatherCurrent,
  fetchOpenWeatherForecast,
} from "./openweather/openweather-api.js";
export { OpenWeatherService } from "./openweather/openweather-service.js";
export type {
  OpenWeatherCurrentResponse,
  OpenWeatherForecastItem,
  OpenWeatherForecastResponse,
} from "./openweather/openweather-types.js";
// Export SDK types and classes
export type {
  ServiceFetchResult,
  WeatherService,
  WeatherServiceConfig,
} from "./sdk.js";
// Export the registry and individual services
export { WeatherServiceRegistry, weatherServiceRegistry } from "./sdk.js";
export { WeatherAPIService } from "./weatherapi/weatherapi-service.js";
