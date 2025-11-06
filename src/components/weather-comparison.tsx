import { useCallback, useEffect, useState } from "react";
import type {
  ComparisonResult,
  WeatherServiceResponse,
} from "../lib/weather-types";

type WeatherComparisonProps = {
  latitude: number;
  longitude: number;
};

export function WeatherComparison({
  latitude,
  longitude,
}: WeatherComparisonProps) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [comparison, setComparison] = useState<ComparisonResult | null>(null);
  const [serviceErrors, setServiceErrors] = useState<
    Array<{ service: string; error: string }>
  >([]);

  const fetchComparison = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(
        `/api/weather/compare?lat=${latitude}&lon=${longitude}`
      );

      if (!response.ok) {
        throw new Error("Failed to fetch weather comparison");
      }

      const data = await response.json();

      if (data.success) {
        setComparison(data.comparison);
        // Store service errors if any
        if (data.debug?.errors) {
          setServiceErrors(data.debug.errors);
        } else {
          setServiceErrors([]);
        }
      } else {
        throw new Error(data.error || "Failed to compare weather");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  }, [latitude, longitude]);

  useEffect(() => {
    fetchComparison();
  }, [fetchComparison]);

  const getServiceName = (service: string) => {
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

  const getServiceColor = (service: string) => {
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
          <div
            className={`rounded-lg border-2 p-6 ${getServiceColor(service.service)} shadow-md`}
            key={service.service}
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
                  {service.current.humidity}%
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
                <p className="mb-1 font-semibold text-gray-700 text-sm">
                  Condition
                </p>
                <p className="text-gray-600">{service.current.condition}</p>
                {service.current.description && (
                  <p className="mt-1 text-gray-500 text-xs">
                    {service.current.description}
                  </p>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {serviceErrors.length > 0 && (
        <div className="mt-4 rounded-lg border border-red-200 bg-red-50 p-4">
          <h3 className="mb-2 font-semibold text-red-800">
            Service Errors ({serviceErrors.length})
          </h3>
          <ul className="space-y-2 text-sm">
            {serviceErrors.map((err, idx) => (
              <li key={idx} className="text-red-700">
                <strong>{getServiceName(err.service)}:</strong> {err.error}
                {err.error.includes("Invalid API key") && (
                  <div className="mt-1 text-xs text-red-600">
                    💡 Check your{" "}
                    {err.service === "openweather"
                      ? "OPENWEATHER_API_KEY"
                      : err.service === "weatherapi"
                        ? "WEATHERAPI_KEY"
                        : "API key"}{" "}
                    in your .env file
                  </div>
                )}
                {err.error.includes("not configured") && (
                  <div className="mt-1 text-xs text-red-600">
                    💡 Add your{" "}
                    {err.service === "openweather"
                      ? "OPENWEATHER_API_KEY"
                      : err.service === "weatherapi"
                        ? "WEATHERAPI_KEY"
                        : "API key"}{" "}
                    to your .env file and restart the server
                  </div>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}

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
              {Math.min(...comparison.services.map((s) => s.current.humidity))}%
              -{" "}
              {Math.max(...comparison.services.map((s) => s.current.humidity))}%
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
