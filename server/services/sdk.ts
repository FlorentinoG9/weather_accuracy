import type {
  WeatherServiceResponse,
} from "../../src/lib/weather-types.js";

/**
 * Configuration type for weather services
 */
export type WeatherServiceConfig = {
  apiKey?: string;
  baseUrl?: string;
  timeout?: number;
  [key: string]: unknown; // Allow additional service-specific config
};

/**
 * Core interface that all weather services must implement
 */
export type WeatherService = {
  /**
   * Unique identifier for the service (e.g., 'noaa', 'openweather', 'weatherapi')
   */
  getName(): string;

  /**
   * Human-readable name for the service (e.g., 'NOAA', 'OpenWeatherMap')
   */
  getDisplayName(): string;

  /**
   * Fetch weather data for a given location
   * @param latitude - Latitude coordinate
   * @param longitude - Longitude coordinate
   * @returns Promise resolving to standardized weather data
   */
  fetchWeather(
    latitude: number,
    longitude: number
  ): Promise<WeatherServiceResponse>;

  /**
   * Check if the service is properly configured (API keys, etc.)
   * @returns true if service can be used
   */
  isConfigured(): boolean;

  /**
   * Get service-specific configuration
   * @returns Configuration object or null if not configured
   */
  getConfig(): WeatherServiceConfig | null;
}

/**
 * Result of attempting to fetch from a weather service
 */
export type ServiceFetchResult =
  | { success: true; data: WeatherServiceResponse }
  | { success: false; error: Error; serviceName: string };

/**
 * Registry for managing and fetching from multiple weather services
 */
export class WeatherServiceRegistry {
  private readonly services: Map<string, WeatherService> = new Map();

  /**
   * Register a weather service
   * @param service - Service implementation
   */
  register(service: WeatherService): void {
    this.services.set(service.getName(), service);
  }

  /**
   * Register multiple services at once
   * @param services - Array of service implementations
   */
  registerAll(services: WeatherService[]): void {
    for (const service of services) {
      this.register(service);
    }
  }

  /**
   * Get a service by name
   * @param name - Service identifier
   * @returns Service instance or undefined
   */
  get(name: string): WeatherService | undefined {
    return this.services.get(name);
  }

  /**
   * Get all registered services
   * @returns Array of all registered services
   */
  getAll(): WeatherService[] {
    return Array.from(this.services.values());
  }

  /**
   * Get all configured (ready to use) services
   * @returns Array of configured services
   */
  getConfigured(): WeatherService[] {
    return this.getAll().filter((service) => service.isConfigured());
  }

  /**
   * Get service names
   * @returns Array of service identifiers
   */
  getServiceNames(): string[] {
    return Array.from(this.services.keys());
  }

  /**
   * Fetch weather from a specific service
   * @param serviceName - Service identifier
   * @param latitude - Latitude coordinate
   * @param longitude - Longitude coordinate
   * @returns Fetch result with success/error status
   */
  async fetchFromService(
    serviceName: string,
    latitude: number,
    longitude: number
  ): Promise<ServiceFetchResult> {
    const service = this.get(serviceName);

    if (!service) {
      return {
        success: false,
        error: new Error(`Service '${serviceName}' is not registered`),
        serviceName,
      };
    }

    if (!service.isConfigured()) {
      return {
        success: false,
        error: new Error(`Service '${serviceName}' is not configured`),
        serviceName,
      };
    }

    try {
      const data = await service.fetchWeather(latitude, longitude);
      return { success: true, data };
    } catch (error) {
      return {
        success: false,
        error:
          error instanceof Error
            ? error
            : new Error(
                `Unknown error fetching from ${serviceName}: ${String(error)}`
              ),
        serviceName,
      };
    }
  }

  /**
   * Fetch weather from all configured services in parallel
   * @param latitude - Latitude coordinate
   * @param longitude - Longitude coordinate
   * @param filterConfigured - Only fetch from configured services (default: true)
   * @returns Array of fetch results, one per service
   */
  async fetchFromAll(
    latitude: number,
    longitude: number,
    filterConfigured = true
  ): Promise<ServiceFetchResult[]> {
    const servicesToFetch = filterConfigured
      ? this.getConfigured()
      : this.getAll();

    const fetchPromises = servicesToFetch.map((service) =>
      this.fetchFromService(service.getName(), latitude, longitude)
    );

    return await Promise.all(fetchPromises);
  }

  /**
   * Fetch weather from all configured services and return only successful results
   * @param latitude - Latitude coordinate
   * @param longitude - Longitude coordinate
   * @returns Array of successful weather service responses
   */
  async fetchSuccessful(
    latitude: number,
    longitude: number
  ): Promise<WeatherServiceResponse[]> {
    const results = await this.fetchFromAll(latitude, longitude, true);

    return results
      .filter(
        (result): result is { success: true; data: WeatherServiceResponse } =>
          result.success
      )
      .map((result) => result.data);
  }

  /**
   * Check if a service is registered
   * @param name - Service identifier
   * @returns true if service is registered
   */
  has(name: string): boolean {
    return this.services.has(name);
  }

  /**
   * Unregister a service
   * @param name - Service identifier
   * @returns true if service was removed
   */
  unregister(name: string): boolean {
    return this.services.delete(name);
  }

  /**
   * Clear all registered services
   */
  clear(): void {
    this.services.clear();
  }

  /**
   * Get count of registered services
   * @returns Number of registered services
   */
  size(): number {
    return this.services.size;
  }
};

// Ensure WeatherService is treated as an interface for implementation
export type { WeatherService as IWeatherService };

/**
 * Default singleton registry instance
 */
export const weatherServiceRegistry = new WeatherServiceRegistry();

