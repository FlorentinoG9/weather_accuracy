import { useState } from "react";
import { AccuracyChart } from "./accuracy-chart";
import { LocationRequest } from "./location-request";
import { WeatherComparison } from "./weather-comparison";

export function WeatherApp() {
  const [location, setLocation] = useState<{
    latitude: number;
    longitude: number;
  } | null>(null);
  const [locationId, setLocationId] = useState<number | null>(null);

  const handleLocationGranted = async (loc: {
    latitude: number;
    longitude: number;
  }) => {
    setLocation(loc);

    // Get the location ID from the stored location
    try {
      const response = await fetch("/api/location", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          latitude: loc.latitude,
          longitude: loc.longitude,
          sessionId: localStorage.getItem("weather_app_session_id"),
        }),
      });

      if (response.ok) {
        const data = await response.json();
        if (data.location) {
          setLocationId(data.location.id);
        }
      }
    } catch (error) {
      console.error("Failed to get location ID:", error);
    }
  };

  return (
    <div className="min-h-screen bg-linear-to-br from-blue-50 via-white to-indigo-50">
      <div className="container mx-auto max-w-7xl px-4 py-8">
        <header className="mb-8 text-center">
          <h1 className="mb-2 font-bold text-4xl text-gray-800">
            Weather Accuracy Comparison
          </h1>
          <p className="text-gray-600">
            Compare weather forecasts from multiple services to find the most
            accurate one for your location
          </p>
        </header>

        {location ? (
          <div className="flex flex-col gap-4">
            <div className="flex-1 rounded-lg bg-white p-6 shadow-lg">
              <WeatherComparison
                latitude={location.latitude}
                longitude={location.longitude}
                onLocationId={setLocationId}
              />
            </div>

            {locationId && (
              <div className="flex-1 rounded-lg bg-white p-6 shadow-lg">
                <AccuracyChart locationId={locationId} />
              </div>
            )}
          </div>
        ) : (
          <LocationRequest onLocationGranted={handleLocationGranted} />
        )}
      </div>
    </div>
  );
}
