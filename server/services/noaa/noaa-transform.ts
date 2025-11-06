import type {
  ForecastData,
  LocationData,
  WeatherData,
} from "@/lib/weather-types";
import type {
  NOAAForecast,
  NOAAObservation,
  NOAAPointResponse,
} from "./noaa-types.js";

/**
 * Convert temperature from various units to Fahrenheit
 */
function convertTemperature(tempC: number, unitCode: string): number {
  if (unitCode === "wmoUnit:degC") {
    return (tempC * 9) / 5 + 32;
  }
  return tempC;
}

/**
 * Convert pressure from Pa to hPa
 */
function convertPressure(pressurePa: number): number {
  return pressurePa / 100;
}

/**
 * Convert wind speed from m/s to mph
 */
function convertWindSpeed(windSpeedMs: number, unitCode: string): number {
  if (unitCode === "wmoUnit:m_s-1") {
    return windSpeedMs * 2.237;
  }
  return windSpeedMs;
}

/**
 * Transform NOAA observation to WeatherData
 */
export function transformObservation(
  observation: NOAAObservation,
  forecast: NOAAForecast | null,
  timestamp: string | Date
): WeatherData {
  const tempC = observation.temperature?.value || forecast?.temperature || 0;
  const tempF = convertTemperature(
    tempC,
    observation.temperature?.unitCode || ""
  );

  const pressurePa = observation.barometricPressure?.value || 1013.25 * 100;
  const pressureHpa = convertPressure(pressurePa);

  const windSpeedMs = observation.windSpeed?.value || 0;
  const windSpeedMph = convertWindSpeed(
    windSpeedMs,
    observation.windSpeed?.unitCode || ""
  );

  return {
    temperature: Math.round(tempF * 10) / 10,
    humidity:
      observation.relativeHumidity?.value ||
      forecast?.relativeHumidity?.value ||
      0,
    pressure: Math.round(pressureHpa * 10) / 10,
    windSpeed: Math.round(windSpeedMph * 10) / 10,
    windDirection: observation.windDirection?.value,
    condition:
      observation.textDescription || forecast?.shortForecast || "Unknown",
    description: forecast?.detailedForecast || observation.textDescription,
    timestamp: new Date(timestamp),
  };
}

/**
 * Transform NOAA forecast periods to ForecastData array
 */
export function transformForecast(periods: NOAAForecast[]): ForecastData[] {
  return periods.slice(0, 24).map((period, index) => ({
    temperature: period.temperature,
    humidity: period.relativeHumidity?.value || 0,
    pressure: 1013.25, // NOAA doesn't provide pressure in forecast
    windSpeed: Number.parseFloat(period.windSpeed) || 0,
    condition: period.shortForecast,
    description: period.detailedForecast,
    forecastHours: index * 12, // NOAA forecasts are typically 12-hour periods
    timestamp: new Date(period.startTime),
  }));
}

/**
 * Extract location data from NOAA point response
 */
export function extractLocation(
  pointData: NOAAPointResponse,
  latitude: number,
  longitude: number
): LocationData {
  return {
    latitude,
    longitude,
    city: pointData.properties.relativeLocation?.properties?.city,
    state: pointData.properties.relativeLocation?.properties?.state,
    country: "US",
  };
}
