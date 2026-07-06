/**
 * Context provided to destinations when delivering events.
 */
export interface DestinationDeliveryContext {
  destinationId: string;
  deliveryId: string;
  config: Record<string, unknown>;
  logger: {
    info: (msg: string, meta?: Record<string, unknown>) => void;
    warn: (msg: string, meta?: Record<string, unknown>) => void;
    error: (msg: string, meta?: Record<string, unknown>) => void;
    debug: (msg: string, meta?: Record<string, unknown>) => void;
  };
}

/**
 * Result returned by a destination after a delivery attempt.
 */
export interface DeliveryResult {
  success: boolean;
  statusCode?: number;
  requestBody?: unknown;
  responseBody?: string;
  error?: string;
  durationMs?: number;
}

/**
 * Base interface all destinations must implement.
 */
export interface IDestination {
  readonly type: string;

  /**
   * Validate the destination's config object.
   * Returns null if valid, or an error message string if invalid.
   */
  validateConfig(config: unknown): string | null;

  /**
   * Deliver a normalized event to the destination.
   */
  deliver(event: Record<string, unknown>, ctx: DestinationDeliveryContext): Promise<DeliveryResult>;

  /**
   * Test the destination connection/config without delivering a real event.
   * Returns a result indicating success or failure.
   */
  test(ctx: DestinationDeliveryContext): Promise<DeliveryResult>;
}

/**
 * Factory function type. Each destination package exports a default factory.
 */
export type DestinationFactory = () => IDestination;

/**
 * Helper base class destinations can extend.
 */
export abstract class BaseDestination implements IDestination {
  abstract readonly type: string;

  abstract validateConfig(config: unknown): string | null;
  abstract deliver(
    event: Record<string, unknown>,
    ctx: DestinationDeliveryContext,
  ): Promise<DeliveryResult>;

  async test(ctx: DestinationDeliveryContext): Promise<DeliveryResult> {
    return {
      success: true,
      responseBody: 'Test not implemented for this destination type',
    };
  }
}

/**
 * Exponential backoff delay calculation for retry logic.
 * Caps at maxDelayMs.
 */
export function calculateBackoffMs(
  attempt: number,
  initialDelayMs = 5000,
  maxDelayMs = 300000,
): number {
  const delay = initialDelayMs * Math.pow(2, attempt - 1);
  return Math.min(delay, maxDelayMs);
}
