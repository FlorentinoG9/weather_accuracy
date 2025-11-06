/**
 * Type definitions for OpenWeatherMap API responses
 */

export type OpenWeatherCurrentResponse = {
  main: {
    temp: number; // Kelvin
    humidity: number;
    pressure: number; // hPa
  };
  wind: {
    speed: number; // m/s
    deg: number;
  };
  weather: Array<{
    main: string;
    description: string;
    icon: string;
  }>;
  dt: number;
  coord: {
    lat: number;
    lon: number;
  };
  name: string;
  sys: {
    country: string;
  };
};

export type OpenWeatherForecastItem = {
  main: {
    temp: number;
    humidity: number;
    pressure: number;
  };
  wind: {
    speed: number;
    deg: number;
  };
  weather: Array<{
    main: string;
    description: string;
    icon: string;
  }>;
  dt: number;
};

export type OpenWeatherForecastResponse = {
  list: OpenWeatherForecastItem[];
  city: {
    name: string;
    country: string;
    coord: {
      lat: number;
      lon: number;
    };
  };
};

