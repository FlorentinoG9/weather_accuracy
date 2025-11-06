export type WeatherData = {
  temperature: number;
  humidity: number;
  pressure: number;
  windSpeed: number;
  windDirection?: number;
  condition: string;
  description?: string;
  icon?: string;
  timestamp: Date;
};

export interface ForecastData extends WeatherData {
  forecastHours?: number;
}

export type LocationData = {
  latitude: number;
  longitude: number;
  city?: string;
  state?: string;
  country?: string;
};

export type WeatherServiceResponse = {
  service: string; // Allow any service name for extensibility
  current: WeatherData;
  forecast?: ForecastData[];
  location: LocationData;
};

export type ComparisonResult = {
  location: LocationData;
  services: WeatherServiceResponse[];
  timestamp: Date;
};
