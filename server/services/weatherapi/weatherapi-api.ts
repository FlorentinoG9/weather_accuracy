import type { WeatherAPIForecastResponse } from "./weatherapi-types.js";

/**
 * Fetch weather forecast from WeatherAPI.com
 * Note: WeatherAPI returns both current and forecast in a single response
 */
export async function fetchWeatherAPIForecast(
  baseUrl: string,
  apiKey: string,
  latitude: number,
  longitude: number,
): Promise<WeatherAPIForecastResponse> {
  const response = await fetch(
    `${baseUrl}/forecast.json?key=${apiKey}&q=${latitude},${longitude}&days=3&aqi=no&alerts=no`,
    {
      signal: AbortSignal.timeout(10_000),
    }
  );

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    const errorMessage =
      errorData.error?.message ||
      errorData.message ||
      response.statusText ||
      "Unknown error";
    
    // Handle specific error cases
    if (response.status === 401 || errorMessage.includes("API key")) {
      throw new Error(
        `WeatherAPI error: Invalid API key - ${errorMessage}. Please check your WEATHERAPI_KEY in your .env file`
      );
    }
    
    throw new Error(`WeatherAPI error: ${response.statusText} - ${errorMessage}`);
  }

  return response.json();
}

