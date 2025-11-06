import type {
  ForecastData,
  LocationData,
  WeatherData,
} from "../../../src/lib/weather-types.js";
import type {
  OpenWeatherCurrentResponse,
  OpenWeatherForecastItem,
  OpenWeatherForecastResponse,
} from "./openweather-types.js";

/**
 * Convert wind speed from m/s to mph
 */
function convertWindSpeed(windSpeedMs: number): number {
  return windSpeedMs * 2.237;
}

/**
 * Transform OpenWeather current data to WeatherData
 */
export function transformCurrent(
  currentData: OpenWeatherCurrentResponse
): WeatherData {
  return {
    temperature: Math.round(currentData.main.temp * 10) / 10,
    humidity: currentData.main.humidity,
    pressure: Math.round(currentData.main.pressure * 10) / 10,
    windSpeed: Math.round(convertWindSpeed(currentData.wind.speed) * 10) / 10,
    windDirection: currentData.wind.deg,
    condition: currentData.weather[0]?.main || "Unknown",
    description: currentData.weather[0]?.description || "",
    icon: currentData.weather[0]?.icon || "",
    timestamp: new Date(currentData.dt * 1000),
  };
}

/**
 * Transform OpenWeather forecast items to ForecastData array
 */
export function transformForecast(
  forecastItems: OpenWeatherForecastItem[]
): ForecastData[] {
  return forecastItems.slice(0, 24).map((item, index) => ({
    temperature: Math.round(item.main.temp * 10) / 10,
    humidity: item.main.humidity,
    pressure: Math.round(item.main.pressure * 10) / 10,
    windSpeed: Math.round(convertWindSpeed(item.wind.speed) * 10) / 10,
    windDirection: item.wind.deg,
    condition: item.weather[0]?.main || "Unknown",
    description: item.weather[0]?.description || "",
    icon: item.weather[0]?.icon || "",
    forecastHours: index * 3, // OpenWeatherMap provides 3-hour forecasts
    timestamp: new Date(item.dt * 1000),
  }));
}

/**
 * Extract location data from OpenWeather responses
 */
export function extractLocation(
  currentData: OpenWeatherCurrentResponse,
  forecastData: OpenWeatherForecastResponse,
  latitude: number,
  longitude: number
): LocationData {
  return {
    latitude,
    longitude,
    city: currentData.name || forecastData.city.name,
    country: currentData.sys.country || forecastData.city.country,
  };
}

