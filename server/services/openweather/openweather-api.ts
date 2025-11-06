import type {
  OpenWeatherCurrentResponse,
  OpenWeatherForecastResponse,
} from "./openweather-types.js";

/**
 * Fetch current weather from OpenWeatherMap
 */
export async function fetchOpenWeatherCurrent(
  baseUrl: string,
  apiKey: string,
  latitude: number,
  longitude: number,
): Promise<OpenWeatherCurrentResponse> {
  const response = await fetch(
    `${baseUrl}/weather?lat=${latitude}&lon=${longitude}&appid=${apiKey}&units=imperial`,
    {
      signal: AbortSignal.timeout(10_000),
    }
  );

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(
      `OpenWeatherMap API error: ${response.statusText} - ${errorData.message || ""}`
    );
  }

  return response.json();
}

/**
 * Fetch forecast from OpenWeatherMap
 */
export async function fetchOpenWeatherForecast(
  baseUrl: string,
  apiKey: string,
  latitude: number,
  longitude: number,
): Promise<OpenWeatherForecastResponse> {
  const response = await fetch(
    `${baseUrl}/forecast?lat=${latitude}&lon=${longitude}&appid=${apiKey}&units=imperial`,
    {
      signal: AbortSignal.timeout(10_000),
    }
  );

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(
      `OpenWeatherMap API error: ${response.statusText} - ${errorData.message || ""}`
    );
  }

  return response.json();
}

