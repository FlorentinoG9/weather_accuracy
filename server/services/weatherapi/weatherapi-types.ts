/**
 * Type definitions for WeatherAPI.com API responses
 */

export type WeatherAPICurrentResponse = {
  location: {
    name: string;
    region: string;
    country: string;
    lat: number;
    lon: number;
  };
  current: {
    temp_f: number;
    humidity: number;
    pressure_in: number;
    wind_mph: number;
    wind_degree: number;
    condition: {
      text: string;
      icon: string;
    };
    last_updated_epoch: number;
  };
};

export type WeatherAPIForecastDay = {
  date_epoch: number;
  day: {
    maxtemp_f: number;
    mintemp_f: number;
    avghumidity: number;
    maxwind_mph: number;
    condition: {
      text: string;
      icon: string;
    };
  };
  hour: Array<{
    time_epoch: number;
    temp_f: number;
    humidity: number;
    pressure_in: number;
    wind_mph: number;
    wind_degree: number;
    condition: {
      text: string;
      icon: string;
    };
  }>;
};

export type WeatherAPIForecastResponse = {
  location: {
    name: string;
    region: string;
    country: string;
    lat: number;
    lon: number;
  };
  current: WeatherAPICurrentResponse["current"];
  forecast: {
    forecastday: WeatherAPIForecastDay[];
  };
};

