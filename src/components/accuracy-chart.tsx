import { useCallback, useEffect, useState } from "react";
import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

type AccuracyMetric = {
  id: number;
  forecastId: number;
  accuracyScore: number;
  temperatureError: number | null;
  humidityError: number | null;
  pressureError: number | null;
  windSpeedError: number | null;
  createdAt: string;
  serviceName: string;
};

type GroupedMetric = {
  createdAt: string;
  accuracyScore: number;
  temperatureError: number | null;
  humidityError: number | null;
  pressureError: number | null;
  windSpeedError: number | null;
};

type AccuracyChartProps = {
  locationId: number;
};

export function AccuracyChart({ locationId }: AccuracyChartProps) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [metrics, setMetrics] = useState<AccuracyMetric[]>([]);

  const fetchMetrics = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`/api/accuracy/${locationId}`);
      const data = await response.json();
      if (data.success) {
        setMetrics(data.metrics || []);
      } else {
        throw new Error(data.error || "Failed to load accuracy metrics");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  }, [locationId]);

  // Fetch metrics when the component mounts
  useEffect(() => {
    fetchMetrics();
  }, [fetchMetrics]);

  // Group metrics by service
  const groupedByService = metrics.reduce(
    (acc, metric) => {
      if (!acc[metric.serviceName]) {
        acc[metric.serviceName] = [];
      }
      acc[metric.serviceName].push({
        createdAt: new Date(metric.createdAt).toLocaleDateString(),
        accuracyScore: Math.round(metric.accuracyScore * 10) / 10,
        temperatureError: metric.temperatureError,
        humidityError: metric.humidityError,
        pressureError: metric.pressureError,
        windSpeedError: metric.windSpeedError,
      });
      return acc;
    },
    {} as Record<string, GroupedMetric[]>
  );

  const chartData =
    Object.keys(groupedByService).length > 0
      ? Object.values(groupedByService)[0].map((_, index) => {
          const dataPoint: {
            createdAt: string;
            [key: string]: number | string;
          } = {
            createdAt: Object.values(groupedByService)[0][index].createdAt,
          };
          for (const service of Object.keys(groupedByService)) {
            if (groupedByService[service][index]) {
              dataPoint[`${service}_accuracy`] =
                groupedByService[service][index].accuracyScore;
            }
          }
          return dataPoint;
        })
      : [];

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
        return "#3b82f6";
      case "openweather":
        return "#10b981";
      case "weatherapi":
        return "#a855f7";
      default:
        return "#6b7280";
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-[300px] items-center justify-center">
        <div className="text-center">
          <div className="mx-auto mb-2 h-8 w-8 animate-spin rounded-full border-blue-600 border-b-2" />
          <p className="text-gray-600">Loading accuracy metrics...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-lg border border-red-200 bg-red-50 p-4">
        <p className="mb-2 font-semibold text-red-800">Error</p>
        <p className="text-red-600">{error}</p>
        <button
          className="mt-2 rounded bg-red-600 px-4 py-2 text-white hover:bg-red-700"
          onClick={fetchMetrics}
          type="button"
        >
          Retry
        </button>
      </div>
    );
  }

  if (metrics.length === 0) {
    return (
      <div className="rounded-lg border border-gray-200 bg-gray-50 p-6">
        <p className="text-center text-gray-600">
          No accuracy metrics available yet. Metrics will appear after actual
          weather data is collected and compared with forecasts.
        </p>
      </div>
    );
  }

  // Calculate average accuracy by service
  const averageAccuracy = Object.keys(groupedByService).reduce(
    (acc, service) => {
      const serviceMetrics = groupedByService[service];
      const avg =
        serviceMetrics.reduce((sum, m) => sum + m.accuracyScore, 0) /
        serviceMetrics.length;
      acc[service] = Math.round(avg * 10) / 10;
      return acc;
    },
    {} as Record<string, number>
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="font-bold text-2xl text-gray-800">
          Historical Accuracy
        </h2>
        <button
          className="rounded-lg bg-blue-600 px-4 py-2 text-white transition-colors hover:bg-blue-700"
          onClick={fetchMetrics}
          type="button"
        >
          Refresh
        </button>
      </div>

      {Object.keys(averageAccuracy).length > 0 && (
        <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-3">
          {Object.entries(averageAccuracy).map(([service, avg]) => (
            <div
              className="rounded-lg border-2 bg-white p-4 shadow-sm"
              key={service}
              style={{ borderColor: getServiceColor(service) }}
            >
              <h3 className="mb-1 font-semibold text-gray-700">
                {getServiceName(service)}
              </h3>
              <p
                className="font-bold text-2xl"
                style={{ color: getServiceColor(service) }}
              >
                {avg}%
              </p>
              <p className="mt-1 text-gray-500 text-xs">Average Accuracy</p>
            </div>
          ))}
        </div>
      )}

      {chartData.length > 0 && (
        <div className="rounded-lg bg-white p-6 shadow-md">
          <h3 className="mb-4 font-semibold text-gray-800 text-lg">
            Accuracy Over Time
          </h3>
          <ResponsiveContainer height={300} width="100%">
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="createdAt" />
              <YAxis domain={[0, 100]} />
              <Tooltip />
              <Legend />
              {Object.keys(groupedByService).map((service) => (
                <Line
                  dataKey={`${service}_accuracy`}
                  dot={{ r: 4 }}
                  key={service}
                  name={getServiceName(service)}
                  stroke={getServiceColor(service)}
                  strokeWidth={2}
                  type="monotone"
                />
              ))}
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {Object.keys(groupedByService).map((service) => {
          const serviceMetrics = groupedByService[service];
          const avgTempError =
            serviceMetrics
              .filter((m) => m.temperatureError !== null)
              .reduce((sum, m) => sum + (m.temperatureError || 0), 0) /
            serviceMetrics.filter((m) => m.temperatureError !== null).length;

          const avgHumidityError =
            serviceMetrics
              .filter((m) => m.humidityError !== null)
              .reduce((sum, m) => sum + (m.humidityError || 0), 0) /
            serviceMetrics.filter((m) => m.humidityError !== null).length;

          return (
            <div
              className="rounded-lg border bg-white p-4 shadow"
              key={service}
              style={{ borderColor: getServiceColor(service) }}
            >
              <h3 className="mb-3 font-semibold text-gray-800">
                {getServiceName(service)} Error Analysis
              </h3>
              <div className="space-y-2 text-sm">
                {!Number.isNaN(avgTempError) && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Avg Temp Error:</span>
                    <span className="font-semibold">
                      {avgTempError.toFixed(2)}°F
                    </span>
                  </div>
                )}
                {!Number.isNaN(avgHumidityError) && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Avg Humidity Error:</span>
                    <span className="font-semibold">
                      {avgHumidityError.toFixed(2)}%
                    </span>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
