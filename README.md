# Weather Accuracy Comparison App

A web application that compares weather forecasts from multiple services (NOAA, OpenWeatherMap, and WeatherAPI.com) to determine which service is most accurate for a user's location.

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

The app uses the following tables:

- **locations**: Stores anonymous user locations
- **forecasts**: Stores weather forecasts from different services
- **actual_weather**: Stores actual weather observations
- **accuracy_metrics**: Stores calculated accuracy scores

## API Endpoints

- `POST /api/location` - Store anonymous user location
- `GET /api/weather/compare?lat={lat}&lon={lon}` - Fetch and compare current forecasts from all services
- `POST /api/weather/forecast` - Store forecast data
- `POST /api/weather/actual` - Store actual weather observations
- `GET /api/accuracy/:locationId` - Get accuracy metrics for a location

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
