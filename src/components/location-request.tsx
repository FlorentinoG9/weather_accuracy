import { useCallback, useEffect, useState } from "react";

type LocationRequestProps = {
  onLocationGranted: (location: {
    latitude: number;
    longitude: number;
  }) => void;
};

export function LocationRequest({ onLocationGranted }: LocationRequestProps) {
  const [status, setStatus] = useState<
    "idle" | "requesting" | "granted" | "denied" | "error"
  >("idle");
  const [error, setError] = useState<string | null>(null);
  const [sessionId, setSessionId] = useState<string | null>(null);

  useEffect(() => {
    // Load or create session ID
    const storedSessionId = localStorage.getItem("weather_app_session_id");
    if (storedSessionId) {
      setSessionId(storedSessionId);
    } else {
      const newSessionId = `session_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
      localStorage.setItem("weather_app_session_id", newSessionId);
      setSessionId(newSessionId);
    }
  }, []);

  const requestLocation = useCallback(() => {
    if (!navigator.geolocation) {
      setError("Geolocation is not supported by your browser");
      setStatus("error");
      return;
    }

    setStatus("requesting");
    setError(null);

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;

        try {
          // Store location in database
          const response = await fetch("/api/location", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              latitude,
              longitude,
              sessionId,
            }),
          });

          if (!response.ok) {
            throw new Error("Failed to store location");
          }

          setStatus("granted");
          onLocationGranted({ latitude, longitude });
        } catch (err) {
          setError(
            err instanceof Error ? err.message : "Failed to store location"
          );
          setStatus("error");
        }
      },
      (err) => {
        setError(err.message || "Failed to get location");
        setStatus("denied");
      },
      {
        enableHighAccuracy: true,
        timeout: 10_000,
        maximumAge: 0,
      }
    );
  }, [onLocationGranted, sessionId]);

  if (status === "granted") {
    return null;
  }

  return (
    <div className="flex min-h-[400px] flex-col items-center justify-center rounded-lg bg-linear-to-br from-blue-50 to-indigo-100 p-8 shadow-lg">
      <div className="space-y-4 text-center">
        <div className="mb-4 text-6xl">📍</div>
        <h2 className="font-bold text-2xl text-gray-800">
          Enable Location Access
        </h2>
        <p className="max-w-md text-gray-600">
          To compare weather accuracy, we need your location. Your location will
          be stored anonymously.
        </p>

        {error && (
          <div className="mt-4 rounded border border-red-400 bg-red-100 p-3 text-red-700">
            {error}
          </div>
        )}

        <button
          className="mt-6 rounded-lg bg-blue-600 px-6 py-3 font-semibold text-white shadow-md transition-colors duration-200 hover:bg-blue-700 disabled:bg-blue-400"
          disabled={status === "requesting"}
          onClick={requestLocation}
          type="button"
        >
          {status === "requesting"
            ? "Requesting Location..."
            : "Allow Location Access"}
        </button>

        {status === "denied" && (
          <button
            className="mt-2 px-4 py-2 text-blue-600 text-sm underline hover:text-blue-700"
            onClick={requestLocation}
            type="button"
          >
            Try Again
          </button>
        )}
      </div>
    </div>
  );
}
