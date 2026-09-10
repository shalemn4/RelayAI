import { api } from './api';
import { QueryClient } from '@tanstack/react-query';

export interface BaseAnalyticsProperties {
  conversation_id?: number;
  channel?: string;
  lead_stage?: string;
  confidence?: number;
  response_time_ms?: number;
  [key: string]: any;
}

class AnalyticsService {
  private queryClient: QueryClient | null = null;

  public setQueryClient(client: QueryClient) {
    this.queryClient = client;
  }

  /**
   * Sanitizes the payload to ensure ZERO Personally Identifiable Information (PII)
   * or raw customer messaging text leaks to analytics.
   */
  public sanitizePayload(props: Record<string, any>): Record<string, any> {
    const sanitized: Record<string, any> = {};
    const prohibitedKeys = ['text', 'content', 'body', 'message', 'email', 'phone', 'name', 'token', 'password'];

    for (const [key, value] of Object.entries(props)) {
      const lowerKey = key.toLowerCase();
      if (prohibitedKeys.includes(lowerKey)) {
        continue; // drop PII
      }

      if (typeof value === 'string') {
        // Drop any long string that could contain raw customer text
        if (value.length > 64) {
          continue;
        }
        sanitized[key] = value;
      } else if (typeof value === 'number' || typeof value === 'boolean' || value === null) {
        sanitized[key] = value;
      } else if (typeof value === 'object' && !Array.isArray(value)) {
        sanitized[key] = this.sanitizePayload(value);
      }
    }
    return sanitized;
  }

  public async track(event: string, properties: BaseAnalyticsProperties = {}) {
    const sanitizedProps = this.sanitizePayload(properties);

    // Development console audit
    if (__DEV__) {
      console.log(`[Analytics] Tracked: ${event}`, sanitizedProps);
    }

    try {
      await api.post('/analytics/events', {
        event_type: event,
        conversation_id: sanitizedProps.conversation_id,
        channel: sanitizedProps.channel,
        lead_stage: sanitizedProps.lead_stage,
        confidence: sanitizedProps.confidence,
        response_time_ms: sanitizedProps.response_time_ms,
        metadata_payload: sanitizedProps,
      });

      // Invalidate analytics queries so charts update reactively!
      if (this.queryClient) {
        this.queryClient.invalidateQueries({ queryKey: ['analytics'] });
      }
    } catch (e) {
      // Analytics should never break user interactions
    }
  }
}

export const analytics = new AnalyticsService();
