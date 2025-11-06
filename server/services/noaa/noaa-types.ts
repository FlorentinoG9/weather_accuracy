/**
 * Type definitions for NOAA API responses
 */

export type NOAAObservation = {
  temperature: { value: number; unitCode: string };
  relativeHumidity: { value: number; unitCode: string };
  barometricPressure: { value: number; unitCode: string };
  windSpeed: { value: number; unitCode: string };
  windDirection: { value: number; unitCode: string };
  textDescription: string;
};

export type NOAAForecast = {
  temperature: number;
  temperatureUnit: string;
  relativeHumidity: { value: number };
  windSpeed: string;
  windDirection: string;
  shortForecast: string;
  detailedForecast: string;
  startTime: string;
  endTime: string;
};

export type NOAAPointResponse = {
  properties: {
    forecast: string;
    observationStations: string;
    relativeLocation?: {
      properties?: {
        city?: string;
        state?: string;
      };
    };
  };
};

export type NOAAStationsResponse = {
  features: Array<{
    properties?: {
      stationIdentifier?: string;
    };
  }>;
};

export type NOAAObservationResponse = {
  properties: {
    timestamp: string;
    temperature: { value: number; unitCode: string };
    relativeHumidity: { value: number; unitCode: string };
    barometricPressure: { value: number; unitCode: string };
    windSpeed: { value: number; unitCode: string };
    windDirection: { value: number; unitCode: string };
    textDescription: string;
  };
};

export type NOAAForecastResponse = {
  properties: {
    periods: NOAAForecast[];
  };
};

