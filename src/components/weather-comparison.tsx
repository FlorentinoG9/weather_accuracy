import type { JSX } from "react";
import { useCallback, useEffect, useState } from "react";
import type {
  ComparisonResult,
  WeatherServiceResponse,
} from "../lib/weather-types";

type ServiceError = {
  service: string;
  error: string;
};

const serviceEnvKeys: Record<string, string> = {
  openweather: "OPENWEATHER_API_KEY",
  weatherapi: "WEATHERAPI_KEY",
};

const getServiceEnvKey = (service: string): string => {
  if (serviceEnvKeys[service]) {
    return serviceEnvKeys[service];
  }
  return "API key";
};

const getServiceName = (service: string): string => {
  switch (service) {
    case "noaa":
      return "NOAA";
    case "openweather":
      return "OpenWeather";
    case "weatherapi":
      return "WeatherAPI";
    default:
      return service;
  }
};

const getServiceColor = (service: string): string => {
  switch (service) {
    case "noaa":
      return "border-blue-500 bg-blue-50";
    case "openweather":
      return "border-green-500 bg-green-50";
    case "weatherapi":
      return "border-purple-500 bg-purple-50";
    default:
      return "border-gray-500 bg-gray-50";
  }
};

const renderServiceSupportTip = (err: ServiceError): JSX.Element | null => {
  const envKey = getServiceEnvKey(err.service);
  if (err.error.includes("Invalid API key")) {
    return (
      <div className="mt-1 text-red-600 text-xs">
        💡 Check your {envKey} in your .env file
      </div>
    );
  }
  if (err.error.includes("not configured")) {
    return (
      <div className="mt-1 text-red-600 text-xs">
        💡 Add your {envKey} to your .env file and restart the server
      </div>
    );
  }
  return null;
};

const formatHumidity = (humidity: number | null | undefined): string => {
  if (typeof humidity !== "number" || Number.isNaN(humidity)) {
    return "N/A";
  }
  return humidity.toFixed(2);
};

const WeatherServiceCard = ({
  service,
}: {
  service: WeatherServiceResponse;
}): JSX.Element => (
  <div
    className={`rounded-lg border-2 p-6 ${getServiceColor(service.service)} shadow-md`}
  >
    <div className="mb-4 flex items-center justify-between">
      <h3 className="font-bold text-gray-800 text-xl">
        {getServiceName(service.service)}
      </h3>
      <span className="text-gray-500 text-sm">
        {new Date(service.current.timestamp).toLocaleTimeString()}
      </span>
    </div>

    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-gray-600">Temperature</span>
        <span className="font-bold text-2xl text-gray-800">
          {service.current.temperature}°F
        </span>
      </div>

      <div className="flex items-center justify-between">
        <span className="text-gray-600">Humidity</span>
        <span className="font-semibold text-gray-800">
          {`${formatHumidity(service.current.humidity)}%`}
        </span>
      </div>

      <div className="flex items-center justify-between">
        <span className="text-gray-600">Pressure</span>
        <span className="font-semibold text-gray-800">
          {service.current.pressure} hPa
        </span>
      </div>

      <div className="flex items-center justify-between">
        <span className="text-gray-600">Wind Speed</span>
        <span className="font-semibold text-gray-800">
          {service.current.windSpeed} mph
        </span>
      </div>

      {service.current.windDirection !== undefined && (
        <div className="flex items-center justify-between">
          <span className="text-gray-600">Wind Direction</span>
          <span className="font-semibold text-gray-800">
            {service.current.windDirection}°
          </span>
        </div>
      )}

      <div className="border-gray-300 border-t pt-3">
        <p className="mb-1 font-semibold text-gray-700 text-sm">Condition</p>
        <p className="text-gray-600">{service.current.condition}</p>
        {service.current.description && (
          <p className="mt-1 text-gray-500 text-xs">
            {service.current.description}
          </p>
        )}
      </div>
    </div>
  </div>
);

const ServiceErrorsList = ({
  errors,
}: {
  errors: ServiceError[];
}): JSX.Element | null => {
  if (errors.length === 0) {
    return null;
  }
  return (
    <div className="mt-4 rounded-lg border border-red-200 bg-red-50 p-4">
      <h3 className="mb-2 font-semibold text-red-800">
        Service Errors ({errors.length})
      </h3>
      <ul className="space-y-2 text-sm">
        {errors.map((err) => {
          const supportTip = renderServiceSupportTip(err);
          const key = `${err.service}-${err.error}`;
          return (
            <li className="text-red-700" key={key}>
              <strong>{getServiceName(err.service)}:</strong> {err.error}
              {supportTip}
            </li>
          );
        })}
      </ul>
    </div>
  );
};

const ensureSessionId = (): string => {
  const existingSessionId = localStorage.getItem("weather_app_session_id");
  if (existingSessionId) {
    return existingSessionId;
  }
  const newSessionId = `session_${Date.now()}_${Math.random()
    .toString(36)
    .substr(2, 9)}`;
  localStorage.setItem("weather_app_session_id", newSessionId);
  return newSessionId;
};

type WeatherComparisonProps = {
  latitude: number;
  longitude: number;
  onLocationId?: (locationId: number) => void;
};

export function WeatherComparison({
  latitude,
  longitude,
  onLocationId,
}: WeatherComparisonProps) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [comparison, setComparison] = useState<ComparisonResult | null>(null);
  const [serviceErrors, setServiceErrors] = useState<ServiceError[]>([]);

  const fetchComparison = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const sessionId = ensureSessionId();

      const response = await fetch(
        `/api/weather/compare?lat=${latitude}&lon=${longitude}&sessionId=${encodeURIComponent(sessionId)}`
      );

      if (!response.ok) {
        throw new Error("Failed to fetch weather comparison");
      }

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error || "Failed to compare weather");
      }

      setComparison(data.comparison);
      setServiceErrors(data.debug?.errors ?? []);
      if (typeof data.locationId === "number") {
        onLocationId?.(data.locationId);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  }, [latitude, longitude, onLocationId]);

  useEffect(() => {
    fetchComparison();
  }, [fetchComparison]);

  if (loading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <div className="text-center">
          <div className="mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-blue-600 border-b-2" />
          <p className="text-gray-600">
            Fetching weather data from multiple services...
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-lg border border-red-200 bg-red-50 p-6">
        <p className="mb-2 font-semibold text-red-800">Error</p>
        <p className="text-red-600">{error}</p>
        <button
          className="mt-4 rounded bg-red-600 px-4 py-2 text-white hover:bg-red-700"
          onClick={fetchComparison}
          type="button"
        >
          Retry
        </button>
      </div>
    );
  }

  if (!comparison || comparison.services.length === 0) {
    return (
      <div className="rounded-lg border border-yellow-200 bg-yellow-50 p-6">
        <p className="text-yellow-800">
          No weather data available from any service.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="font-bold text-2xl text-gray-800">Weather Comparison</h2>
        <button
          className="rounded-lg bg-blue-600 px-4 py-2 text-white transition-colors hover:bg-blue-700"
          onClick={fetchComparison}
          type="button"
        >
          Refresh
        </button>
      </div>

      {comparison.location.city && (
        <div className="mb-4 text-gray-600 text-lg">
          📍 {comparison.location.city}
          {comparison.location.state && `, ${comparison.location.state}`}
          {comparison.location.country && `, ${comparison.location.country}`}
        </div>
      )}

      <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
        {comparison.services.map((service: WeatherServiceResponse) => (
          <WeatherServiceCard key={service.service} service={service} />
        ))}
      </div>

      <ServiceErrorsList errors={serviceErrors} />

      <div className="mt-6 rounded-lg bg-gray-50 p-4">
        <h3 className="mb-2 font-semibold text-gray-800">Comparison Summary</h3>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-gray-600">Temperature Range:</span>
            <span className="font-semibold">
              {Math.min(
                ...comparison.services.map((s) => s.current.temperature)
              ).toFixed(1)}
              °F -{" "}
              {Math.max(
                ...comparison.services.map((s) => s.current.temperature)
              ).toFixed(1)}
              °F
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Humidity Range:</span>
            <span className="font-semibold">
              {`${Math.min(
                ...comparison.services.map((s) => s.current.humidity)
              ).toFixed(2)}% - ${Math.max(
                ...comparison.services.map((s) => s.current.humidity)
              ).toFixed(2)}%`}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Pressure Range:</span>
            <span className="font-semibold">
              {Math.min(
                ...comparison.services.map((s) => s.current.pressure)
              ).toFixed(1)}{" "}
              -{" "}
              {Math.max(
                ...comparison.services.map((s) => s.current.pressure)
              ).toFixed(1)}{" "}
              hPa
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
