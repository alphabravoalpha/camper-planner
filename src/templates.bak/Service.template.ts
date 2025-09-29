// {{SERVICE_NAME}} Service
// {{DESCRIPTION}}

import { DataService } from './index';

export interface {{SERVICE_NAME}}Config {
  baseUrl: string;
  apiKey?: string;
  timeout: number;
}

export class {{SERVICE_NAME}}Service extends DataService {
  constructor(config: {{SERVICE_NAME}}Config) {
    super(config);
  }

  /**
   * Example method - replace with actual service methods
   */
  async getData(params: Record<string, any> = {}): Promise<any> {
    try {
      await this.checkRateLimit('{{service_key}}');

      const cacheKey = `{{service_key}}-${JSON.stringify(params)}`;
      const cached = this.getFromCache(cacheKey);

      if (cached) {
        return cached;
      }

      // Simulate API call - replace with actual implementation
      const response = await fetch(`${this.config.baseUrl}/data`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          ...(this.config.apiKey && { 'Authorization': `Bearer ${this.config.apiKey}` }),
        },
        signal: AbortSignal.timeout(this.config.timeout),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      this.setCache(cacheKey, data);

      return data;
    } catch (error) {
      console.error('{{SERVICE_NAME}}Service error:', error);
      throw error;
    }
  }

  /**
   * Clear service-specific cache
   */
  clearCache(): void {
    const keys = Array.from(this.cache.keys());
    keys.forEach(key => {
      if (key.startsWith('{{service_key}}-')) {
        this.cache.delete(key);
      }
    });
  }
}