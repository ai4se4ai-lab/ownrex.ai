/**
 * Telemetry Service - Usage tracking and metrics
 */

import { getConfig } from '../config';
import { getLogger } from '../utils/logger';

const logger = getLogger();

export interface RequestMetrics {
  requestId: string;
  endpoint: string;
  method: string;
  model?: string;
  promptTokens?: number;
  completionTokens?: number;
  totalTokens?: number;
  latencyMs: number;
  statusCode: number;
  success: boolean;
  error?: string;
  timestamp: Date;
}

export interface UsageStats {
  totalRequests: number;
  successfulRequests: number;
  failedRequests: number;
  totalTokens: number;
  averageLatencyMs: number;
  requestsByEndpoint: Record<string, number>;
  requestsByModel: Record<string, number>;
  errorsByType: Record<string, number>;
}

export class TelemetryService {
  private static instance: TelemetryService | null = null;
  private metrics: RequestMetrics[];
  private enabled: boolean;
  private maxMetricsSize: number;
  private startTime: Date;

  constructor() {
    const config = getConfig();
    this.metrics = [];
    this.enabled = config.telemetry.enabled;
    this.maxMetricsSize = 10000; // Keep last 10k requests
    this.startTime = new Date();
  }

  /**
   * Get singleton instance
   */
  public static getInstance(): TelemetryService {
    if (!TelemetryService.instance) {
      TelemetryService.instance = new TelemetryService();
    }
    return TelemetryService.instance;
  }

  /**
   * Reset singleton instance (for testing)
   */
  public static resetInstance(): void {
    TelemetryService.instance = null;
  }

  /**
   * Record a request metric
   */
  recordRequest(metrics: RequestMetrics): void {
    if (!this.enabled) return;

    this.metrics.push(metrics);

    // Trim if exceeds max size
    if (this.metrics.length > this.maxMetricsSize) {
      this.metrics = this.metrics.slice(-this.maxMetricsSize);
    }

    logger.debug('Telemetry recorded', {
      requestId: metrics.requestId,
      endpoint: metrics.endpoint,
      latencyMs: metrics.latencyMs,
      success: metrics.success
    });
  }

  /**
   * Create a metrics tracker for a request
   */
  createTracker(requestId: string, endpoint: string, method: string): RequestTracker {
    return new RequestTracker(this, requestId, endpoint, method);
  }

  /**
   * Get usage statistics
   */
  getUsageStats(sinceDate?: Date): UsageStats {
    const filteredMetrics = sinceDate
      ? this.metrics.filter(m => m.timestamp >= sinceDate)
      : this.metrics;

    const stats: UsageStats = {
      totalRequests: filteredMetrics.length,
      successfulRequests: filteredMetrics.filter(m => m.success).length,
      failedRequests: filteredMetrics.filter(m => !m.success).length,
      totalTokens: filteredMetrics.reduce((sum, m) => sum + (m.totalTokens || 0), 0),
      averageLatencyMs: 0,
      requestsByEndpoint: {},
      requestsByModel: {},
      errorsByType: {}
    };

    // Calculate average latency
    if (filteredMetrics.length > 0) {
      const totalLatency = filteredMetrics.reduce((sum, m) => sum + m.latencyMs, 0);
      stats.averageLatencyMs = Math.round(totalLatency / filteredMetrics.length);
    }

    // Group by endpoint
    for (const metric of filteredMetrics) {
      stats.requestsByEndpoint[metric.endpoint] = (stats.requestsByEndpoint[metric.endpoint] || 0) + 1;

      if (metric.model) {
        stats.requestsByModel[metric.model] = (stats.requestsByModel[metric.model] || 0) + 1;
      }

      if (metric.error) {
        stats.errorsByType[metric.error] = (stats.errorsByType[metric.error] || 0) + 1;
      }
    }

    return stats;
  }

  /**
   * Get recent requests
   */
  getRecentRequests(limit: number = 100): RequestMetrics[] {
    return this.metrics.slice(-limit);
  }

  /**
   * Get uptime in seconds
   */
  getUptime(): number {
    return Math.floor((Date.now() - this.startTime.getTime()) / 1000);
  }

  /**
   * Clear all metrics
   */
  clearMetrics(): void {
    this.metrics = [];
    logger.info('Telemetry metrics cleared');
  }

  /**
   * Export metrics to JSON
   */
  exportMetrics(): string {
    return JSON.stringify({
      startTime: this.startTime.toISOString(),
      uptime: this.getUptime(),
      stats: this.getUsageStats(),
      recentRequests: this.getRecentRequests(100)
    }, null, 2);
  }
}

/**
 * Request tracker for measuring request metrics
 */
export class RequestTracker {
  private telemetryService: TelemetryService;
  private requestId: string;
  private endpoint: string;
  private method: string;
  private startTime: [number, number];
  private model?: string;
  private promptTokens?: number;
  private completionTokens?: number;

  constructor(
    telemetryService: TelemetryService,
    requestId: string,
    endpoint: string,
    method: string
  ) {
    this.telemetryService = telemetryService;
    this.requestId = requestId;
    this.endpoint = endpoint;
    this.method = method;
    this.startTime = process.hrtime();
  }

  setModel(model: string): void {
    this.model = model;
  }

  setTokens(promptTokens: number, completionTokens: number): void {
    this.promptTokens = promptTokens;
    this.completionTokens = completionTokens;
  }

  success(statusCode: number = 200): void {
    this.record(statusCode, true);
  }

  failure(statusCode: number, error: string): void {
    this.record(statusCode, false, error);
  }

  private record(statusCode: number, success: boolean, error?: string): void {
    const diff = process.hrtime(this.startTime);
    const latencyMs = diff[0] * 1000 + diff[1] / 1000000;

    this.telemetryService.recordRequest({
      requestId: this.requestId,
      endpoint: this.endpoint,
      method: this.method,
      model: this.model,
      promptTokens: this.promptTokens,
      completionTokens: this.completionTokens,
      totalTokens: (this.promptTokens || 0) + (this.completionTokens || 0),
      latencyMs: Math.round(latencyMs),
      statusCode,
      success,
      error,
      timestamp: new Date()
    });
  }
}

// Export singleton
export const telemetryService = TelemetryService.getInstance();

export default telemetryService;

