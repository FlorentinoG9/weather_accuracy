# Weather Service SDK

This directory contains the SDK architecture for weather service integrations. The SDK makes it easy to add new weather services without modifying core application code.

## Architecture

### Core Components

- **`sdk.ts`** - Defines the `WeatherService` interface and `WeatherServiceRegistry` class
- **`index.ts`** - Service registration and exports
- **Service Implementations** - Each weather service is in its own directory (e.g., `noaa/`, `openweather/`, `weatherapi/`)

## Adding a New Weather Service

To add a new weather service, follow these steps:

### 1. Create Service Implementation

Create a new directory and file: `server/services/your-service/your-service.ts`

```typescript
import type {
  LocationData,
  WeatherData,
  WeatherServiceResponse,
} from "../../../src/lib/weather-types.js";
import type {
  WeatherService,
  WeatherServiceConfig,
} from "../sdk.js";

export class YourService implements WeatherService {
  private config: WeatherServiceConfig;

  constructor(config: WeatherServiceConfig = {}) {
    this.config = {
      apiKey: process.env.YOUR_SERVICE_API_KEY,
      baseUrl: "https://api.yourservice.com",
      timeout: 10000,
      ...config,
    };
  }

  getName(): string {
    return "your-service"; // Unique identifier
  }

  getDisplayName(): string {
    return "Your Service Name"; // Human-readable name
  }

  isConfigured(): boolean {
    return !!this.config.apiKey; // Check if API key is set
  }

  getConfig(): WeatherServiceConfig | null {
    return this.isConfigured() ? this.config : null;
  }

  async fetchWeather(
    latitude: number,
    longitude: number
  ): Promise<WeatherServiceResponse> {
    // Your API implementation here
    // Must return data in the standardized WeatherServiceResponse format
    
    const current: WeatherData = {
      temperature: 72.5, // in Fahrenheit
      humidity: 65, // percentage
      pressure: 1013.25, // in hPa
      windSpeed: 10.5, // in mph
      windDirection: 180, // degrees (optional)
      condition: "Sunny",
      description: "Clear sky",
      timestamp: new Date(),
    };

    const location: LocationData = {
      latitude,
      longitude,
      city: "City Name",
      country: "US",
    };

    return {
      service: this.getName(),
      current,
      forecast: [], // Optional forecast data
      location,
    };
  }
}
```

### 2. Register the Service

Add your service to `server/services/index.ts`:

```typescript
import { YourService } from "./your-service/your-service.js";

const yourService = new YourService();
weatherServiceRegistry.register(yourService);
```

### 3. Add Environment Variable

Add your API key to `.env.example` and `.env`:

```env
YOUR_SERVICE_API_KEY=your-api-key-here
```

### 4. Update Schema (if needed)

If you need to store service-specific data, update `server/db/schema.ts` to include your service name in any relevant enums.

## Usage

The SDK automatically handles:
- ✅ Parallel fetching from all services
- ✅ Error handling (one service failure doesn't break others)
- ✅ Configuration checking (only configured services are used)
- ✅ Type safety
- ✅ Easy service management (register/unregister at runtime)

### Example: Fetch from All Services

```typescript
import { weatherServiceRegistry } from "./services/index.js";

// Fetch from all configured services
const results = await weatherServiceRegistry.fetchFromAll(lat, lon);

// Or get only successful results
const successful = await weatherServiceRegistry.fetchSuccessful(lat, lon);
```

### Example: Fetch from Specific Service

```typescript
const result = await weatherServiceRegistry.fetchFromService(
  "noaa",
  latitude,
  longitude
);

if (result.success) {
  console.log(result.data);
} else {
  console.error(result.error);
}
```

## Service Interface Requirements

All services must implement:

- `getName()` - Unique service identifier
- `getDisplayName()` - Human-readable name
- `isConfigured()` - Check if service is ready to use
- `getConfig()` - Get service configuration
- `fetchWeather(lat, lon)` - Fetch weather data (must return `WeatherServiceResponse`)

## Data Format

All services must return data in the standardized format:

- **Temperature**: Fahrenheit
- **Humidity**: Percentage (0-100)
- **Pressure**: hPa (hectopascals)
- **Wind Speed**: mph (miles per hour)
- **Wind Direction**: Degrees (0-360, optional)
- **Location**: Latitude, longitude, and optional city/state/country

## Error Handling

The registry automatically:
- Catches errors from individual services
- Logs errors without breaking the entire request
- Returns partial results (successful services only)
- Provides detailed error information in `ServiceFetchResult`

## Testing

To test a new service:

```typescript
import { YourService } from "./your-service/your-service.js";

const service = new YourService();
const result = await service.fetchWeather(40.7128, -74.0060);
console.log(result);
```

