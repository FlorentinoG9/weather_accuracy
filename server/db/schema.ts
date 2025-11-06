import { integer, real, sqliteTable, text } from "drizzle-orm/sqlite-core";

export const locations = sqliteTable("locations", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  sessionId: text("session_id").notNull(),
  latitude: real("latitude").notNull(),
  longitude: real("longitude").notNull(),
  createdAt: integer("created_at", { mode: "timestamp" })
    .notNull()
    .$defaultFn(() => new Date()),
});

export const forecasts = sqliteTable("forecasts", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  locationId: integer("location_id")
    .notNull()
    .references(() => locations.id, { onDelete: "cascade" }),
  serviceName: text("service_name").notNull(), // 'noaa', 'openweather', 'weatherapi'
  forecastData: text("forecast_data", { mode: "json" }).notNull(),
  forecastTimestamp: integer("forecast_timestamp", {
    mode: "timestamp",
  }).notNull(),
  createdAt: integer("created_at", { mode: "timestamp" })
    .notNull()
    .$defaultFn(() => new Date()),
});

export const actualWeather = sqliteTable("actual_weather", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  locationId: integer("location_id")
    .notNull()
    .references(() => locations.id, { onDelete: "cascade" }),
  weatherData: text("weather_data", { mode: "json" }).notNull(),
  observedTimestamp: integer("observed_timestamp", {
    mode: "timestamp",
  }).notNull(),
  createdAt: integer("created_at", { mode: "timestamp" })
    .notNull()
    .$defaultFn(() => new Date()),
});

export const accuracyMetrics = sqliteTable("accuracy_metrics", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  forecastId: integer("forecast_id")
    .notNull()
    .references(() => forecasts.id, { onDelete: "cascade" }),
  actualWeatherId: integer("actual_weather_id")
    .notNull()
    .references(() => actualWeather.id, { onDelete: "cascade" }),
  accuracyScore: real("accuracy_score").notNull(), // 0-100
  temperatureError: real("temperature_error"),
  humidityError: real("humidity_error"),
  pressureError: real("pressure_error"),
  windSpeedError: real("wind_speed_error"),
  createdAt: integer("created_at", { mode: "timestamp" })
    .notNull()
    .$defaultFn(() => new Date()),
});
