import type {
  NOAAForecastResponse,
  NOAAObservationResponse,
  NOAAPointResponse,
  NOAAStationsResponse,
} from "./noaa-types.js";

/**
 * Fetch NOAA point data for a given location
 */
export async function fetchNOAAPoint(
  latitude: number,
  longitude: number,
  timeout: number
): Promise<NOAAPointResponse> {
  const response = await fetch(
    `https://api.weather.gov/points/${latitude.toFixed(4)},${longitude.toFixed(4)}`,
    {
      signal: AbortSignal.timeout(timeout),
    }
  );

  if (!response.ok) {
    throw new Error(`NOAA API error: ${response.statusText}`);
  }

  return response.json();
}

/**
 * Get the nearest observation station
 */
export async function getNearestStation(
  observationUrl: string,
  timeout: number
): Promise<string> {
  const response = await fetch(observationUrl, {
    signal: AbortSignal.timeout(timeout),
  });

  if (!response.ok) {
    throw new Error("Failed to fetch observation stations");
  }

  const data: NOAAStationsResponse = await response.json();
  const nearestStation = data.features[0]?.properties?.stationIdentifier;

  if (!nearestStation) {
    throw new Error("No observation station found");
  }

  return nearestStation;
}

/**
 * Fetch latest observation from a station
 */
export async function fetchObservation(
  stationId: string,
  timeout: number
): Promise<NOAAObservationResponse> {
  const response = await fetch(
    `https://api.weather.gov/stations/${stationId}/observations/latest`,
    {
      signal: AbortSignal.timeout(timeout),
    }
  );

  if (!response.ok) {
    throw new Error("Failed to fetch observations");
  }

  return response.json();
}

/**
 * Fetch forecast data
 */
export async function fetchForecast(
  forecastUrl: string,
  timeout: number
): Promise<NOAAForecastResponse> {
  const response = await fetch(forecastUrl, {
    signal: AbortSignal.timeout(timeout),
  });

  if (!response.ok) {
    throw new Error("Failed to fetch forecast");
  }

  return response.json();
}
