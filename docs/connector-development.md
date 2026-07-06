# Connector Development Guide

## Creating a custom connector

1. Create a new package in `connectors/my-connector/`
2. Add `package.json` and `tsconfig.json` (see existing connectors as templates)
3. Implement `IConnector` from `@uc-open-edge/connector-sdk`
4. Register the connector in `apps/worker/src/connector-runtime.ts`

## IConnector interface

```typescript
interface IConnector {
  readonly type: string;
  validateConfig(config: unknown): string | null;
  start(ctx: ConnectorRunContext): Promise<void>;
  stop(): Promise<void>;
  getState(): ConnectorState;
}
```

## ConnectorRunContext

```typescript
interface ConnectorRunContext {
  connectorId: string;
  sourceSystemId?: string;
  config: Record<string, unknown>;
  submitEvent: (payload: unknown) => Promise<void>;
  reportHealth: (status, message?) => Promise<void>;
  logger: { info; warn; error; debug };
}
```

## Example: polling connector

```typescript
export class MyConnector extends BaseConnector {
  readonly type = 'my_connector';
  private timer?: NodeJS.Timeout;

  validateConfig(config: unknown): string | null {
    // validate with Zod, return error string or null
  }

  async start(ctx: ConnectorRunContext): Promise<void> {
    this.state = 'running';
    this.timer = setInterval(() => this.poll(ctx), 30000);
    await this.poll(ctx);
  }

  private async poll(ctx: ConnectorRunContext) {
    const events = await fetchFromMySystem(ctx.config);
    for (const event of events) {
      await ctx.submitEvent(event);
    }
    await ctx.reportHealth('active', `Polled ${events.length} events`);
  }

  async stop(): Promise<void> {
    clearInterval(this.timer);
    this.state = 'stopped';
  }
}
```

## Extending the OPC UA connector

The OPC UA connector (`connectors/opcua`) is a stub with a complete config schema. To implement real OPC UA connections:

1. Install node-opcua: `pnpm --filter @uc-open-edge/connector-opcua add node-opcua`
2. In `start()`: create `OPCUAClient`, connect to `config.endpointUrl`
3. Create a session, create a `ClientSubscription`
4. For each node in `config.nodes`: add a `ClientMonitoredItem`
5. On `dataValueChanged`: call `ctx.submitEvent()` with the OPC UA-shaped payload
6. Implement reconnect logic with backoff on `connectionLost`
