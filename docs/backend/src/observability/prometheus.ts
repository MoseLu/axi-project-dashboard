import client from 'prom-client';

// Create a Registry to register the metrics
export const registry = new client.Registry();

// Add default metrics
client.collectDefaultMetrics({ register: registry, prefix: 'axi_dashboard_' });

// HTTP request duration histogram
export const httpRequestDurationSeconds = new client.Histogram({
  name: 'axi_dashboard_http_request_duration_seconds',
  help: 'HTTP request duration in seconds',
  labelNames: ['method', 'route', 'status_code'],
  buckets: [0.05, 0.1, 0.3, 0.5, 1, 2, 5, 10]
});
registry.registerMetric(httpRequestDurationSeconds);

// Webhook counters
export const webhookEventsTotal = new client.Counter({
  name: 'axi_dashboard_webhook_events_total',
  help: 'Total number of webhook events received',
  labelNames: ['type', 'status']
});
registry.registerMetric(webhookEventsTotal);

// Socket connections gauge
export const socketConnectionsGauge = new client.Gauge({
  name: 'axi_dashboard_socket_connections',
  help: 'Current number of active WebSocket connections'
});
registry.registerMetric(socketConnectionsGauge);

export const incrementWebhookCounter = (type: string, status: string): void => {
  try {
    webhookEventsTotal.labels({ type, status }).inc();
  } catch (_) {
    // noop
  }
};

export const setSocketConnections = (count: number): void => {
  try {
    socketConnectionsGauge.set(count);
  } catch (_) {
    // noop
  }
};

export const getPrometheusMetrics = async (): Promise<string> => {
  return registry.metrics();
};