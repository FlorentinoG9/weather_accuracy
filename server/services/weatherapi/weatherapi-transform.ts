import type {
  ForecastData,
  LocationData,
  WeatherData,
} from "@/lib/weather-types";
import type {
  WeatherAPIForecastDay,
  WeatherAPIForecastResponse,
} from "./weatherapi-types.js";

/**
 * Convert pressure from inches to hPa
 */
function convertPressure(pressureInches: number): number {
  return pressureInches * 33.8639;
}

/**
 * Transform WeatherAPI current data to WeatherData
 */
export function transformCurrent(
  currentData: WeatherAPIForecastResponse["current"]
): WeatherData {
  const pressureHpa = convertPressure(currentData.pressure_in);

  return {
    temperature: Math.round(currentData.temp_f * 10) / 10,
    humidity: currentData.humidity,
    pressure: Math.round(pressureHpa * 10) / 10,
    windSpeed: Math.round(currentData.wind_mph * 10) / 10,
    windDirection: currentData.wind_degree,
    condition: currentData.condition.text,
    description: currentData.condition.text,
    icon: currentData.condition.icon,
    timestamp: new Date(currentData.last_updated_epoch * 1000),
  };
}

/**
 * Extract hourly forecasts from forecast days
 */
export function transformForecast(
  forecastDays: WeatherAPIForecastDay[]
): ForecastData[] {
  const forecast: ForecastData[] = [];
  let hourOffset = 0;

  for (const day of forecastDays) {
    for (const hour of day.hour) {
      const hourPressureHpa = convertPressure(hour.pressure_in);
      forecast.push({
        temperature: Math.round(hour.temp_f * 10) / 10,
        humidity: hour.humidity,
        pressure: Math.round(hourPressureHpa * 10) / 10,
        windSpeed: Math.round(hour.wind_mph * 10) / 10,
        windDirection: hour.wind_degree,
        condition: hour.condition.text,
        description: hour.condition.text,
        icon: hour.condition.icon,
        forecastHours: hourOffset,
        timestamp: new Date(hour.time_epoch * 1000),
      });
      hourOffset += 1;
      if (forecast.length >= 24) {
        break;
      }
    }
    if (forecast.length >= 24) {
      break;
    }
  }

  return forecast;
}

/**
 * Extract location data from WeatherAPI response
 */
export function extractLocation(
  data: WeatherAPIForecastResponse,
  latitude: number,
  longitude: number
): LocationData {
  return {
    latitude,
    longitude,
    city: data.location.name,
    state: data.location.region,
    country: data.location.country,
  };
}
