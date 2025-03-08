/**
 * Application configuration based on environment
 */

interface Config {
  apiBaseUrl: string;
  apiTimeout: number;
  enableMocks: boolean;
}

// Default configuration
const defaultConfig: Config = {
  apiBaseUrl: import.meta.env.PROD 
    ? '/api'
    : '/api', // In development, use the proxy defined in vite.config.ts
  apiTimeout: 30000, // 30 seconds
  enableMocks: import.meta.env.PROD ? false : true, // Enable mocks in development by default
};

// Environment-specific overrides from Vite environment variables
const envConfig: Partial<Config> = {
  apiBaseUrl: import.meta.env.VITE_API_BASE_URL,
  apiTimeout: import.meta.env.VITE_API_TIMEOUT ? parseInt(import.meta.env.VITE_API_TIMEOUT, 10) : undefined,
  enableMocks: import.meta.env.VITE_ENABLE_MOCKS === 'true' ? true : 
               import.meta.env.VITE_ENABLE_MOCKS === 'false' ? false : 
               undefined,
};

// Merge configurations, using environment variables when available
const config: Config = {
  ...defaultConfig,
  ...Object.fromEntries(
    Object.entries(envConfig).filter(([_, value]) => value !== undefined)
  ) as Partial<Config>,
};

export default config; 