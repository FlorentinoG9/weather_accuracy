CREATE TABLE `accuracy_metrics` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`forecast_id` integer NOT NULL,
	`actual_weather_id` integer NOT NULL,
	`accuracy_score` real NOT NULL,
	`temperature_error` real,
	`humidity_error` real,
	`pressure_error` real,
	`wind_speed_error` real,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`forecast_id`) REFERENCES `forecasts`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`actual_weather_id`) REFERENCES `actual_weather`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `actual_weather` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`location_id` integer NOT NULL,
	`weather_data` text NOT NULL,
	`observed_timestamp` integer NOT NULL,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`location_id`) REFERENCES `locations`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `forecasts` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`location_id` integer NOT NULL,
	`service_name` text NOT NULL,
	`forecast_data` text NOT NULL,
	`forecast_timestamp` integer NOT NULL,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`location_id`) REFERENCES `locations`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `locations` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`session_id` text NOT NULL,
	`latitude` real NOT NULL,
	`longitude` real NOT NULL,
	`created_at` integer NOT NULL
);
