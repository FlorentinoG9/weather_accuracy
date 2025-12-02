# Weather Accuracy Comparison App

A web application that compares weather forecasts from multiple services (NOAA, OpenWeatherMap, and WeatherAPI.com) to determine which service is most accurate for a user's location.

## Table of Contents

- [Application Architecture](#application-architecture)
- [How It Works](#how-it-works)
- [Accuracy Comparison Algorithm](#accuracy-comparison-algorithm)
- [Service Architecture](#service-architecture)
- [Component Structure](#component-structure)
- [Database Schema](#database-schema)
- [API Endpoints](#api-endpoints)
- [Tech Stack](#tech-stack)
- [Features](#features)
- [Prerequisites](#prerequisites)
- [Setup](#setup)
- [Project Structure](#project-structure)
- [Development](#development)
- [License](#license)

## Application Architecture

The application follows a modern full-stack architecture with clear separation of concerns:

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     Frontend (Astro + React)                │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐       │
│  │ WeatherApp   │  │ WeatherComp  │  │ AccuracyChart│       │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘       │
└─────────┼─────────────────┼─────────────────┼───────────────┘
          │                 │                 │
          └─────────────────┼─────────────────┘
                            │
          ┌─────────────────▼─────────────────┐
          │      API Routes (Hono)            │
          │  ┌────────┐ ┌────────┐ ┌────────┐ │
          │  │Location│ │Weather │ │Accuracy│ │
          │  └───┬────┘ └───┬────┘ └───┬────┘ │
          └──────┼──────────┼──────────┼──────┘
                 │          │          │
                 │          │          │
          ┌──────▼──────────▼──────────▼──────┐
          │    Weather Service Registry       │
          │  ┌──────┐ ┌──────┐ ┌───────┐      │
          │  │ NOAA │ │OpenW │ │WthrAPI│      │
          │  └───┬──┘ └───┬──┘ └───┬───┘      │
          └──────┼────────┼────────┼──────────┘
                 │        │        │
          ┌──────▼────────▼────────▼──────┐
          │    External Weather APIs      │
          └───────────────────────────────┘
                 │
          ┌──────▼──────┐
          │   Database  │
          │  (Turso)    │
          └─────────────┘
```

### Architecture Layers

1. **Frontend Layer** (`src/`)

   - Astro pages for routing and SSR
   - React components for interactive UI
   - TailwindCSS for styling
   - Client-side state management with React hooks

2. **API Layer** (`server/routes/`)

   - Hono-based REST API
   - Route handlers for location, weather, and accuracy endpoints
   - Request validation with Zod
   - Error handling and response formatting

3. **Service Layer** (`server/services/`)

   - Weather service registry pattern
   - Standardized service interface
   - Parallel API fetching
   - Data transformation to common format

4. **Data Layer** (`server/db/`)
   - Drizzle ORM for type-safe database access
   - SQLite database (Turso)
   - Schema definitions and migrations

## How It Works

The application follows a multi-step process to collect, store, and compare weather data:

### Step-by-Step Data Flow

1. **User Location Request**

   - User grants browser geolocation permission
   - `LocationRequest` component captures coordinates
   - Location is stored in database with session ID
   - Location ID is returned for tracking

2. **Weather Data Fetching**

   - `WeatherComparison` component requests weather data
   - API endpoint `/api/weather/compare` is called with coordinates
   - Weather Service Registry fetches from all configured services in parallel:
     - NOAA (public API, no key required)
     - OpenWeatherMap (requires API key)
     - WeatherAPI.com (requires API key)
   - Each service returns standardized weather data format

3. **Data Storage**

   - Current weather from each service is stored as a "forecast" in the `forecasts` table
   - First service's current weather is also stored as "actual weather" in `actual_weather` table
   - Future forecasts (if available) are also stored
   - All data is linked to the location via `locationId`

4. **Accuracy Calculation**

   - When accuracy metrics are requested (`/api/accuracy/:locationId`):
     - System retrieves all forecasts for the location
     - System retrieves all actual weather observations
     - For each forecast, finds the closest actual weather observation (within 1 hour window)
     - Calculates accuracy score using weighted algorithm
     - Stores accuracy metrics in `accuracy_metrics` table

5. **Visualization**
   - `AccuracyChart` component fetches accuracy metrics
   - Displays historical accuracy trends over time
   - Shows average accuracy per service
   - Visualizes error breakdowns (temperature, humidity, etc.)

### Data Flow Diagram

```
User Browser
    │
    ├─► Request Location Permission
    │
    ├─► POST /api/location
    │   └─► Store location → Database
    │       └─► Return locationId
    │
    ├─► GET /api/weather/compare?lat=X&lon=Y
    │   │
    │   ├─► Weather Service Registry
    │   │   ├─► Fetch from NOAA (parallel)
    │   │   ├─► Fetch from OpenWeather (parallel)
    │   │   └─► Fetch from WeatherAPI (parallel)
    │   │
    │   ├─► Transform responses to standard format
    │   │
    │   ├─► Store forecasts → Database
    │   ├─► Store actual weather → Database
    │   │
    │   └─► Return comparison data
    │
    └─► GET /api/accuracy/:locationId
        │
        ├─► Retrieve forecasts from Database
        ├─► Retrieve actual weather from Database
        │
        ├─► Match forecasts with actual weather (1-hour window)
        │
        ├─► Calculate accuracy scores
        │   ├─► Temperature error (40% weight)
        │   ├─► Humidity error (20% weight)
        │   ├─► Pressure error (20% weight)
        │   └─► Wind speed error (20% weight)
        │
        ├─► Store accuracy metrics → Database
        │
        └─► Return accuracy metrics
```

## Accuracy Comparison Algorithm

The accuracy calculation uses a weighted scoring system that evaluates multiple weather parameters:

### Scoring Formula

The accuracy score is calculated using a weighted average of individual parameter scores:

```
Accuracy Score = (TempScore × 0.4) + (HumidityScore × 0.2) +
                 (PressureScore × 0.2) + (WindScore × 0.2)
```

### Parameter Weights

1. **Temperature (40% weight)**

   - Most important metric for user experience
   - Scoring: `100 - (|forecast - actual| × 2)`
   - Each 1°F error = 2 point deduction
   - Example: 2°F error = 96% score

2. **Humidity (20% weight)**

   - Scoring: `100 - |forecast - actual|`
   - Each 1% error = 1 point deduction
   - Example: 5% error = 95% score

3. **Pressure (20% weight)**

   - Scoring: `100 - (|forecast - actual| × 2)`
   - Each 0.5 hPa error = 1 point deduction
   - Example: 1 hPa error = 98% score

4. **Wind Speed (20% weight)**
   - Scoring: `100 - (|forecast - actual| × 5)`
   - Each 0.2 mph error = 1 point deduction
   - Example: 1 mph error = 95% score

### Forecast Matching

Forecasts are matched with actual weather observations using a time-based algorithm:

- **Time Window**: 1 hour (3,600,000 ms)
- **Matching Logic**: Find the actual weather observation closest in time to the forecast timestamp
- **Priority**: Only matches within the 1-hour window are considered valid

### Example Calculation

Given:

- Forecast: Temp=72°F, Humidity=60%, Pressure=1013 hPa, Wind=10 mph
- Actual: Temp=74°F, Humidity=58%, Pressure=1012 hPa, Wind=11 mph

Calculation:

- Temperature: |72-74| = 2°F → Score = 100 - (2 × 2) = 96 → Weighted = 96 × 0.4 = 38.4
- Humidity: |60-58| = 2% → Score = 100 - 2 = 98 → Weighted = 98 × 0.2 = 19.6
- Pressure: |1013-1012| = 1 hPa → Score = 100 - (1 × 2) = 98 → Weighted = 98 × 0.2 = 19.6
- Wind: |10-11| = 1 mph → Score = 100 - (1 × 5) = 95 → Weighted = 95 × 0.2 = 19.0

**Final Accuracy Score**: 38.4 + 19.6 + 19.6 + 19.0 = **96.6%**

### Stored Metrics

For each accuracy calculation, the system stores:

- Overall accuracy score (0-100)
- Individual error values:
  - `temperatureError`: Absolute difference in °F
  - `humidityError`: Absolute difference in %
  - `pressureError`: Absolute difference in hPa
  - `windSpeedError`: Absolute difference in mph

## Service Architecture

The application uses a **Service Registry Pattern** to manage multiple weather service integrations:

### Service Interface

All weather services implement a common interface (`WeatherService`):

```typescript
interface WeatherService {
  getName(): string; // Unique identifier (e.g., 'noaa')
  getDisplayName(): string; // Human-readable name (e.g., 'NOAA')
  fetchWeather(lat, lon): Promise<WeatherServiceResponse>;
  isConfigured(): boolean; // Check if API keys are set
  getConfig(): WeatherServiceConfig | null;
}
```

### Service Registry

The `WeatherServiceRegistry` class manages all registered services:

- **Registration**: Services are registered at application startup
- **Parallel Fetching**: All configured services fetch data simultaneously
- **Error Handling**: Failed services don't block successful ones
- **Configuration Check**: Only configured services are used

### Service Implementation

Each weather service follows a consistent structure:

```
server/services/
├── noaa/
│   ├── noaa-api.ts          # Raw API calls
│   ├── noaa-service.ts      # Service implementation
│   ├── noaa-transform.ts    # Data transformation
│   └── noaa-types.ts        # TypeScript types
├── openweather/
│   └── [same structure]
└── weatherapi/
    └── [same structure]
```

### Data Transformation

Each service transforms its API response to a standardized format:

```typescript
interface WeatherServiceResponse {
  service: string;
  current: WeatherData;
  forecast?: ForecastData[];
  location: LocationData;
}
```

This ensures consistent data structure regardless of the source API.

### Parallel Fetching

When fetching weather data:

1. Registry gets all configured services
2. Creates parallel fetch promises for each service
3. Waits for all promises to resolve
4. Collects successful results and errors separately
5. Returns combined results with error information

This approach ensures:

- Fast response times (no sequential waiting)
- Resilience (one service failure doesn't affect others)
- Complete error reporting

## Component Structure

The frontend is built with React components within Astro pages:

### Component Hierarchy

```
Layout (Astro)
└── WeatherApp (React)
    ├── LocationRequest (React)
    │   └── Requests browser geolocation
    │
    ├── WeatherComparison (React)
    │   ├── Fetches weather from API
    │   ├── WeatherServiceCard (internal)
    │   └── ServiceErrorsList (internal)
    │
    └── AccuracyChart (React)
        ├── Fetches accuracy metrics
        └── Displays charts using Recharts
```

### Component Responsibilities

1. **WeatherApp** (`src/components/weather-app.tsx`)

   - Main container component
   - Manages location state
   - Coordinates child components
   - Handles location ID tracking

2. **LocationRequest** (`src/components/location-request.tsx`)

   - Requests browser geolocation permission
   - Handles permission grants/denials
   - Calls location API to store coordinates
   - Triggers weather fetch on success

3. **WeatherComparison** (`src/components/weather-comparison.tsx`)

   - Fetches weather data from all services
   - Displays side-by-side comparison cards
   - Shows service errors with helpful tips
   - Displays comparison summary (ranges)
   - Handles refresh functionality

4. **AccuracyChart** (`src/components/accuracy-chart.tsx`)
   - Fetches historical accuracy metrics
   - Displays average accuracy per service
   - Shows accuracy trends over time (line chart)
   - Displays error analysis breakdowns
   - Uses Recharts for visualization

### Component Communication

- **Props**: Data flows down from parent to child
- **Callbacks**: Events flow up via callback functions
- **API Calls**: Components fetch data independently
- **State Management**: React hooks (useState, useEffect, useCallback)

## Tech Stack

- **Frontend**: Astro with React components
- **Styling**: TailwindCSS
- **API**: Hono (REST API)
- **Database**: Turso (SQLite)
- **ORM**: Drizzle ORM
- **Location**: Browser Geolocation API
- **Weather APIs**: NOAA, OpenWeatherMap, WeatherAPI.com

## Features

- Real-time weather comparison from 3+ weather services
- Historical accuracy tracking
- Anonymous user location tracking
- Visual accuracy metrics and charts
- Responsive design with TailwindCSS

## Prerequisites

- Node.js 18+
- npm or yarn
- Turso database account (free tier available)
- API keys for:
  - OpenWeatherMap (free tier available)
  - WeatherAPI.com (free tier available)
  - NOAA (no key required)

## Setup

1. **Clone and install dependencies**:

   ```bash
   npm install
   ```

2. **Set up environment variables**:
   Create a `.env` file in the root directory:

   ```env
   # Turso Database
   TURSO_DATABASE_URL=libsql://your-database-url.turso.io
   TURSO_AUTH_TOKEN=your-auth-token-here

   # Weather API Keys
   OPENWEATHER_API_KEY=your-openweather-api-key
   WEATHERAPI_KEY=your-weatherapi-key

   # Server
   PORT=4321
   ```

3. **Set up Turso database**:

   - Create an account at [Turso](https://turso.tech)
   - Create a new database
   - Get your database URL and auth token
   - Add them to your `.env` file

4. **Get API keys**:

   - **OpenWeatherMap**: Sign up at [OpenWeatherMap](https://openweathermap.org/api) (free tier)
   - **WeatherAPI.com**: Sign up at [WeatherAPI.com](https://www.weatherapi.com/) (free tier)
   - **NOAA**: No API key required (public API)

5. **Run database migrations**:

   ```bash
   npm run db:push
   ```

6. **Start development server**:

   ```bash
   npm run dev
   ```

   The app will be available at `http://localhost:4321`

## Database Schema

The application uses SQLite (via Turso) with four main tables that track locations, forecasts, actual weather, and accuracy metrics.

### Schema Overview

```
locations (1) ──< (many) forecasts
    │
    └──< (many) actual_weather
            │
forecasts (1) ──< (many) accuracy_metrics
            │
actual_weather (1) ──< (many) accuracy_metrics
```

### Table Descriptions

#### 1. `locations` Table

Stores anonymous user location data with session tracking.

| Column       | Type                | Description                                           |
| ------------ | ------------------- | ----------------------------------------------------- |
| `id`         | INTEGER (PK)        | Auto-incrementing primary key                         |
| `session_id` | TEXT                | Anonymous session identifier (stored in localStorage) |
| `latitude`   | REAL                | Latitude coordinate (-90 to 90)                       |
| `longitude`  | REAL                | Longitude coordinate (-180 to 180)                    |
| `created_at` | INTEGER (timestamp) | When the location was recorded                        |

**Purpose**:

- Tracks user locations without requiring authentication
- Links all weather data to a specific location
- Enables location-based accuracy analysis

**Relationships**:

- One location can have many forecasts
- One location can have many actual weather observations

#### 2. `forecasts` Table

Stores weather forecasts from different weather services.

| Column               | Type                | Description                                                |
| -------------------- | ------------------- | ---------------------------------------------------------- |
| `id`                 | INTEGER (PK)        | Auto-incrementing primary key                              |
| `location_id`        | INTEGER (FK)        | References `locations.id`                                  |
| `service_name`       | TEXT                | Service identifier: 'noaa', 'openweather', or 'weatherapi' |
| `forecast_data`      | TEXT (JSON)         | Standardized weather data (temperature, humidity, etc.)    |
| `forecast_timestamp` | INTEGER (timestamp) | When the forecast was made                                 |
| `created_at`         | INTEGER (timestamp) | When the record was created                                |

**Purpose**:

- Stores current weather and future forecasts from each service
- Enables historical comparison of forecast accuracy
- Links forecasts to specific locations and services

**Relationships**:

- Many forecasts belong to one location
- One forecast can have many accuracy metrics (if matched with multiple actual observations)

**JSON Structure** (`forecast_data`):

```json
{
  "temperature": 72.5,
  "humidity": 65.0,
  "pressure": 1013.2,
  "windSpeed": 10.5,
  "windDirection": 180,
  "condition": "Clear",
  "description": "Clear sky",
  "timestamp": "2024-01-15T12:00:00Z"
}
```

#### 3. `actual_weather` Table

Stores actual observed weather conditions for comparison.

| Column               | Type                | Description                            |
| -------------------- | ------------------- | -------------------------------------- |
| `id`                 | INTEGER (PK)        | Auto-incrementing primary key          |
| `location_id`        | INTEGER (FK)        | References `locations.id`              |
| `weather_data`       | TEXT (JSON)         | Actual weather observation data        |
| `observed_timestamp` | INTEGER (timestamp) | When the weather was actually observed |
| `created_at`         | INTEGER (timestamp) | When the record was created            |

**Purpose**:

- Stores ground truth weather data for accuracy comparison
- Typically uses the first service's current weather as the "actual" observation
- Enables retrospective accuracy analysis

**Relationships**:

- Many actual weather records belong to one location
- One actual weather record can be matched with many forecasts (within time window)

**JSON Structure** (`weather_data`):

```json
{
  "temperature": 73.0,
  "humidity": 63.0,
  "pressure": 1012.8,
  "windSpeed": 11.2,
  "windDirection": 175,
  "condition": "Clear",
  "timestamp": "2024-01-15T12:05:00Z"
}
```

#### 4. `accuracy_metrics` Table

Stores calculated accuracy scores comparing forecasts to actual weather.

| Column              | Type                | Description                          |
| ------------------- | ------------------- | ------------------------------------ |
| `id`                | INTEGER (PK)        | Auto-incrementing primary key        |
| `forecast_id`       | INTEGER (FK)        | References `forecasts.id`            |
| `actual_weather_id` | INTEGER (FK)        | References `actual_weather.id`       |
| `accuracy_score`    | REAL                | Overall accuracy score (0-100)       |
| `temperature_error` | REAL                | Absolute temperature difference (°F) |
| `humidity_error`    | REAL                | Absolute humidity difference (%)     |
| `pressure_error`    | REAL                | Absolute pressure difference (hPa)   |
| `wind_speed_error`  | REAL                | Absolute wind speed difference (mph) |
| `created_at`        | INTEGER (timestamp) | When the metric was calculated       |

**Purpose**:

- Stores pre-calculated accuracy metrics for performance
- Enables historical accuracy analysis and trending
- Provides detailed error breakdowns per parameter

**Relationships**:

- Many accuracy metrics reference one forecast
- Many accuracy metrics reference one actual weather observation
- Represents a many-to-many relationship between forecasts and actual weather

**Calculation**:

- Metrics are calculated on-demand when `/api/accuracy/:locationId` is called
- Only calculated if forecast and actual weather are within 1 hour of each other
- Metrics are stored to avoid recalculation on subsequent requests

### Data Flow Through Schema

1. **Location Creation**: User location → `locations` table
2. **Forecast Storage**: Weather service response → `forecasts` table (linked to location)
3. **Actual Weather Storage**: Current weather → `actual_weather` table (linked to location)
4. **Accuracy Calculation**: Forecast + Actual Weather → `accuracy_metrics` table
5. **Retrieval**: All tables queried together to display historical accuracy trends

## API Endpoints

The API is built with Hono and exposed through Astro's API routes at `/api/*`. All endpoints return JSON responses.

### Base URL

- Development: `http://localhost:4321/api`
- Production: `https://your-domain.com/api`

### Endpoints

#### 1. POST `/api/location`

Store an anonymous user location in the database.

**Request Body**:

```json
{
  "latitude": 40.7128,
  "longitude": -74.006,
  "sessionId": "session_1234567890_abc123" // Optional
}
```

**Response** (201 Created):

```json
{
  "success": true,
  "location": {
    "id": 1,
    "sessionId": "session_1234567890_abc123",
    "latitude": 40.7128,
    "longitude": -74.006,
    "createdAt": "2024-01-15T12:00:00.000Z"
  }
}
```

**Error Response** (400 Bad Request):

```json
{
  "success": false,
  "error": "Invalid request data",
  "details": [
    {
      "path": ["latitude"],
      "message": "Expected number, received string"
    }
  ]
}
```

**Error Response** (500 Internal Server Error):

```json
{
  "success": false,
  "error": "Database authentication failed",
  "message": "Unable to authenticate with the database. Please check your TURSO_AUTH_TOKEN environment variable."
}
```

**Notes**:

- If `sessionId` is not provided, one will be generated
- Location is used to link all weather data for a specific coordinate
- Returns the location ID which is used for subsequent API calls

---

#### 2. GET `/api/weather/compare`

Fetch and compare current weather forecasts from all configured services.

**Query Parameters**:

- `lat` (required): Latitude coordinate (-90 to 90)
- `lon` (required): Longitude coordinate (-180 to 180)
- `locationId` (optional): Existing location ID to link data
- `sessionId` (optional): Session ID for anonymous tracking

**Example Request**:

```
GET /api/weather/compare?lat=40.7128&lon=-74.0060&sessionId=session_123
```

**Response** (200 OK):

```json
{
  "success": true,
  "comparison": {
    "location": {
      "latitude": 40.7128,
      "longitude": -74.006,
      "city": "New York",
      "state": "NY",
      "country": "US"
    },
    "services": [
      {
        "service": "noaa",
        "current": {
          "temperature": 72.5,
          "humidity": 65.0,
          "pressure": 1013.2,
          "windSpeed": 10.5,
          "windDirection": 180,
          "condition": "Clear",
          "description": "Clear sky",
          "timestamp": "2024-01-15T12:00:00.000Z"
        },
        "forecast": [
          {
            "temperature": 75.0,
            "humidity": 60.0,
            "pressure": 1012.0,
            "windSpeed": 12.0,
            "condition": "Partly Cloudy",
            "timestamp": "2024-01-15T15:00:00.000Z",
            "forecastHours": 3
          }
        ],
        "location": {
          "latitude": 40.7128,
          "longitude": -74.006
        }
      },
      {
        "service": "openweather",
        "current": {
          /* ... */
        },
        "forecast": [
          /* ... */
        ],
        "location": {
          /* ... */
        }
      }
    ],
    "timestamp": "2024-01-15T12:00:00.000Z"
  },
  "locationId": 1,
  "debug": {
    "configuredServices": ["noaa", "openweather", "weatherapi"],
    "errors": [
      {
        "service": "weatherapi",
        "error": "Invalid API key"
      }
    ]
  }
}
```

**Error Response** (400 Bad Request):

```json
{
  "success": false,
  "error": "Latitude and longitude are required"
}
```

**Error Response** (500 Internal Server Error):

```json
{
  "success": false,
  "error": "All weather services failed"
}
```

**Notes**:

- Fetches from all configured services in parallel
- Stores forecasts and actual weather in database if `locationId` is provided
- Returns debug information about configured services and any errors
- Failed services are included in the `errors` array but don't block successful ones

---

#### 3. POST `/api/weather/forecast`

Manually store forecast data (typically called automatically by `/weather/compare`).

**Request Body**:

```json
{
  "locationId": 1,
  "serviceName": "noaa",
  "forecastData": {
    "temperature": 72.5,
    "humidity": 65.0,
    "pressure": 1013.2,
    "windSpeed": 10.5,
    "windDirection": 180,
    "condition": "Clear",
    "timestamp": "2024-01-15T12:00:00.000Z"
  },
  "forecastTimestamp": "2024-01-15T12:00:00.000Z"
}
```

**Response** (201 Created):

```json
{
  "success": true,
  "forecast": {
    "id": 1,
    "locationId": 1,
    "serviceName": "noaa",
    "forecastData": {
      /* ... */
    },
    "forecastTimestamp": "2024-01-15T12:00:00.000Z",
    "createdAt": "2024-01-15T12:00:00.000Z"
  }
}
```

**Error Response** (400 Bad Request):

```json
{
  "success": false,
  "error": "Invalid request data",
  "details": [
    {
      "path": ["serviceName"],
      "message": "Invalid enum value. Expected 'noaa' | 'openweather' | 'weatherapi', received 'invalid'"
    }
  ]
}
```

---

#### 4. POST `/api/weather/actual`

Manually store actual weather observations (typically called automatically by `/weather/compare`).

**Request Body**:

```json
{
  "locationId": 1,
  "weatherData": {
    "temperature": 73.0,
    "humidity": 63.0,
    "pressure": 1012.8,
    "windSpeed": 11.2,
    "windDirection": 175,
    "condition": "Clear",
    "timestamp": "2024-01-15T12:05:00.000Z"
  },
  "observedTimestamp": "2024-01-15T12:05:00.000Z"
}
```

**Response** (201 Created):

```json
{
  "success": true,
  "actualWeather": {
    "id": 1,
    "locationId": 1,
    "weatherData": {
      /* ... */
    },
    "observedTimestamp": "2024-01-15T12:05:00.000Z",
    "createdAt": "2024-01-15T12:05:00.000Z"
  }
}
```

---

#### 5. GET `/api/accuracy/:locationId`

Get accuracy metrics for a specific location. Calculates accuracy scores by matching forecasts with actual weather observations.

**Path Parameters**:

- `locationId` (required): The location ID to get accuracy metrics for

**Example Request**:

```
GET /api/accuracy/1
```

**Response** (200 OK):

```json
{
  "success": true,
  "metrics": [
    {
      "id": 1,
      "forecastId": 1,
      "accuracyScore": 96.6,
      "temperatureError": 1.5,
      "humidityError": 2.0,
      "pressureError": 0.4,
      "windSpeedError": 0.7,
      "createdAt": "2024-01-15T12:10:00.000Z",
      "serviceName": "noaa"
    },
    {
      "id": 2,
      "forecastId": 2,
      "accuracyScore": 94.2,
      "temperatureError": 2.3,
      "humidityError": 3.5,
      "pressureError": 0.8,
      "windSpeedError": 1.2,
      "createdAt": "2024-01-15T12:10:00.000Z",
      "serviceName": "openweather"
    }
  ]
}
```

**Error Response** (400 Bad Request):

```json
{
  "success": false,
  "error": "Invalid location ID"
}
```

**Error Response** (500 Internal Server Error):

```json
{
  "success": false,
  "error": "Failed to calculate accuracy metrics",
  "message": "Database connection error"
}
```

**Notes**:

- Automatically calculates accuracy scores if they don't exist
- Matches forecasts with actual weather within a 1-hour time window
- Stores calculated metrics in the database for future requests
- Returns metrics grouped by service for easy comparison

### Error Handling

All endpoints follow a consistent error response format:

```json
{
  "success": false,
  "error": "Error message",
  "message": "Detailed error message (optional)",
  "details": [
    /* Validation errors (optional) */
  ]
}
```

**HTTP Status Codes**:

- `200 OK`: Successful GET request
- `201 Created`: Successful POST request (resource created)
- `400 Bad Request`: Invalid request data or parameters
- `500 Internal Server Error`: Server-side error (database, API, etc.)

## Project Structure

```
weather_accuracy/
├── src/
│   ├── components/          # React components
│   ├── layouts/             # Astro layouts
│   ├── pages/               # Astro pages and API routes
│   ├── lib/                 # Utilities and types
│   └── styles/              # Global styles
├── server/                  # Hono API
│   ├── routes/              # API route handlers
│   ├── db/                  # Database schema and client
│   └── services/            # Weather API integrations
├── drizzle/                 # Drizzle migrations
└── public/                  # Static assets
```

## Development

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run db:generate` - Generate database migrations
- `npm run db:push` - Push schema changes to database
- `npm run db:studio` - Open Drizzle Studio

## License

MIT
