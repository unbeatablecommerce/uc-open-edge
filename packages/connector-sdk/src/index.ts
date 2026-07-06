import type { z } from 'zod';

/**
 * Connector lifecycle states.
 */
export type ConnectorState = 'stopped' | 'starting' | 'running' | 'error';

/**
 * Context provided to connectors when they run.
 */
export interface ConnectorRunContext {
  connectorId: string;
  sourceSystemId?: string;
  config: Record<string, unknown>;
  /** Called by the connector to submit a raw event payload into the pipeline. */
  submitEvent: (payload: unknown) => Promise<void>;
  /** Called by the connector to report a health status. */
  reportHealth: (status: 'active' | 'error' | 'idle', message?: string) => Promise<void>;
  logger: {
    info: (msg: string, meta?: Record<string, unknown>) => void;
    warn: (msg: string, meta?: Record<string, unknown>) => void;
    error: (msg: string, meta?: Record<string, unknown>) => void;
    debug: (msg: string, meta?: Record<string, unknown>) => void;
  };
}

/**
 * Base interface all polling/long-running connectors must implement.
 *
 * Webhook connectors run in the API server and do not implement this interface —
 * they use HTTP route handlers instead.
 *
 * Polling connectors (file-drop, csv, rest-poll, mqtt, opcua) implement this
 * and are managed by the worker process.
 */
export interface IConnector {
  readonly type: string;

  /**
   * Validate the connector's config object.
   * Returns null if valid, or an error message string if invalid.
   */
  validateConfig(config: unknown): string | null;

  /**
   * Start the connector. Called by the worker when the connector is enabled.
   * Must be idempotent (safe to call if already running).
   */
  start(ctx: ConnectorRunContext): Promise<void>;

  /**
   * Stop the connector gracefully.
   */
  stop(): Promise<void>;

  /**
   * Return the current state of the connector.
   */
  getState(): ConnectorState;
}

/**
 * Factory function type. Each connector package exports a default factory.
 * Example:
 *   export default function createConnector(): IConnector { ... }
 */
export type ConnectorFactory = () => IConnector;

/**
 * Helper base class connectors can extend to get default implementations.
 */
export abstract class BaseConnector implements IConnector {
  protected state: ConnectorState = 'stopped';
  abstract readonly type: string;

  abstract validateConfig(config: unknown): string | null;
  abstract start(ctx: ConnectorRunContext): Promise<void>;

  async stop(): Promise<void> {
    this.state = 'stopped';
  }

  getState(): ConnectorState {
    return this.state;
  }
}
