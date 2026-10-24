import { logger } from './logger.ts';
import { HttpRequestOptions, HttpResponse } from './types.ts';

type RequestInterceptor = (config: HttpRequestOptions, url: string) => Promise<{ config: HttpRequestOptions; url: string }> | { config: HttpRequestOptions; url: string };
type ResponseInterceptor = <T>(response: HttpResponse<T>) => Promise<HttpResponse<T>> | HttpResponse<T>;

export class HttpClient {
  private requestInterceptors: RequestInterceptor[] = [];
  private responseInterceptors: ResponseInterceptor[] = [];

  constructor() {
    // Default request interceptor: add correlation ID and timestamps
    this.addRequestInterceptor((config, url) => {
      const headers = new Headers(config.headers || {});
      if (!headers.has('X-Correlation-ID')) {
        headers.set('X-Correlation-ID', `req_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`);
      }
      if (!headers.has('X-Client-Timestamp')) {
        headers.set('X-Client-Timestamp', new Date().toISOString());
      }
      return { config: { ...config, headers }, url };
    });

    // Default response interceptor: log success
    this.addResponseInterceptor((response) => {
      logger.info('HttpClient', `HTTP ${response.status} from ${response.url}`, {
        status: response.status,
        statusText: response.statusText,
        latencyMs: response.latencyMs,
      });
      return response;
    });
  }

  public addRequestInterceptor(interceptor: RequestInterceptor) {
    this.requestInterceptors.push(interceptor);
  }

  public addResponseInterceptor(interceptor: ResponseInterceptor) {
    this.responseInterceptors.push(interceptor);
  }

  public async request<T = unknown>(url: string, options: HttpRequestOptions = {}): Promise<HttpResponse<T>> {
    const startTime = performance.now();
    const context = options.logContext || 'HttpClient';
    const timeoutMs = options.timeoutMs || 10000;
    const retries = options.retries ?? 1;

    let processedUrl = url;
    let processedConfig = { ...options };

    for (const interceptor of this.requestInterceptors) {
      const result = await interceptor(processedConfig, processedUrl);
      processedConfig = result.config;
      processedUrl = result.url;
    }

    logger.debug(context, `Dispatching ${processedConfig.method || 'GET'} to ${processedUrl}`, {
      method: processedConfig.method || 'GET',
      headers: Object.fromEntries(new Headers(processedConfig.headers).entries()),
    });

    let attempt = 0;
    while (attempt <= retries) {
      attempt++;
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), timeoutMs);

      try {
        const fetchOptions: RequestInit = {
          ...processedConfig,
          signal: controller.signal,
        };

        const response = await fetch(processedUrl, fetchOptions);
        clearTimeout(timer);

        const latencyMs = Math.round(performance.now() - startTime);

        // Header extraction
        const responseHeaders: Record<string, string> = {};
        response.headers.forEach((val, key) => {
          responseHeaders[key] = val;
        });

        let data: T;
        const contentType = response.headers.get('content-type') || '';
        if (contentType.includes('application/json')) {
          data = await response.json();
        } else {
          data = (await response.text()) as unknown as T;
        }

        let httpResponse: HttpResponse<T> = {
          data,
          status: response.status,
          statusText: response.statusText,
          headers: responseHeaders,
          latencyMs,
          url: processedUrl,
        };

        for (const respInterceptor of this.responseInterceptors) {
          httpResponse = await respInterceptor(httpResponse);
        }

        if (!response.ok) {
          throw new Error(`HTTP Error ${response.status}: ${response.statusText}`);
        }

        return httpResponse;
      } catch (err: any) {
        clearTimeout(timer);
        const isAbort = err.name === 'AbortError';
        const isLastAttempt = attempt > retries;

        logger.warn(context, `HTTP attempt ${attempt} failed: ${err.message}`, {
          url: processedUrl,
          isAbort,
          attempt,
          retries,
        });

        if (isLastAttempt || isAbort) {
          const latencyMs = Math.round(performance.now() - startTime);
          logger.error(context, `Request to ${processedUrl} failed permanently after ${latencyMs}ms`, {
            error: err.message,
            isAbort,
          });
          throw err;
        }

        // Wait before next retry
        await new Promise((resolve) => setTimeout(resolve, options.retryDelayMs || 500 * attempt));
      }
    }

    throw new Error('Unexpected HTTP request termination');
  }

  public get<T = unknown>(url: string, options: Omit<HttpRequestOptions, 'method'> = {}): Promise<HttpResponse<T>> {
    return this.request<T>(url, { ...options, method: 'GET' });
  }

  public post<T = unknown>(url: string, body?: any, options: Omit<HttpRequestOptions, 'method' | 'body'> = {}): Promise<HttpResponse<T>> {
    const headers = new Headers(options.headers || {});
    let serializedBody = body;
    if (body && typeof body === 'object') {
      if (!headers.has('Content-Type')) {
        headers.set('Content-Type', 'application/json');
      }
      serializedBody = JSON.stringify(body);
    }
    return this.request<T>(url, { ...options, method: 'POST', body: serializedBody, headers });
  }
}

export const httpClient = new HttpClient();
