import { readdir, readFile, rename, mkdir } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { z } from 'zod';
import { BaseConnector, type ConnectorRunContext } from '@uc-open-edge/connector-sdk';
import type { EventType } from '@uc-open-edge/schemas';

export const CsvColumnMappingSchema = z.object({
  /** CSV column name → normalized event field path */
  columnMappings: z.record(z.string()),
  /** Which event type to generate for rows in this file */
  eventType: z.string() as z.ZodType<EventType>,
  /** CSV column to use as externalEventId */
  externalEventIdColumn: z.string().optional(),
  /** CSV column to use as occurredAt */
  occurredAtColumn: z.string().optional(),
  /** CSV column to use as quantity */
  quantityColumn: z.string().optional(),
  /** CSV column to use as unitOfMeasure */
  unitOfMeasureColumn: z.string().optional(),
});

export const CsvConnectorConfigSchema = z.object({
  inboxPath: z.string().min(1),
  processedFolder: z.string().default('processed'),
  failedFolder: z.string().default('failed'),
  pollIntervalMs: z.number().int().positive().default(10000),
  delimiter: z.string().default(','),
  hasHeader: z.boolean().default(true),
  mapping: CsvColumnMappingSchema,
});

export type CsvConnectorConfig = z.infer<typeof CsvConnectorConfigSchema>;

/**
 * Example column mappings for common event types:
 *
 * inventory.movement.reported:
 *   { sku: "skuRef.externalSku", from_loc: "fromLocationRef.externalLocationId",
 *     to_loc: "toLocationRef.externalLocationId", qty: "quantity", uom: "unitOfMeasure" }
 *
 * manufacturing.production.completed:
 *   { work_order: "workOrderRef.externalWorkOrderId", item: "itemRef.externalItemId",
 *     equipment: "equipmentRef.externalEquipmentId", qty: "quantity" }
 */

export class CsvConnector extends BaseConnector {
  readonly type = 'csv';
  private timer?: ReturnType<typeof setInterval>;

  override validateConfig(config: unknown): string | null {
    const result = CsvConnectorConfigSchema.safeParse(config);
    return result.success ? null : result.error.message;
  }

  override async start(ctx: ConnectorRunContext): Promise<void> {
    const config = CsvConnectorConfigSchema.parse(ctx.config);
    this.state = 'running';

    const processedPath = join(config.inboxPath, config.processedFolder);
    const failedPath = join(config.inboxPath, config.failedFolder);

    if (!existsSync(processedPath)) await mkdir(processedPath, { recursive: true });
    if (!existsSync(failedPath)) await mkdir(failedPath, { recursive: true });

    ctx.logger.info('CSV connector started', { inboxPath: config.inboxPath });

    this.timer = setInterval(
      () => this.poll(ctx, config, processedPath, failedPath),
      config.pollIntervalMs,
    );
    await this.poll(ctx, config, processedPath, failedPath);
  }

  private async poll(
    ctx: ConnectorRunContext,
    config: CsvConnectorConfig,
    processedPath: string,
    failedPath: string,
  ) {
    try {
      const files = (await readdir(config.inboxPath)).filter((f) => f.endsWith('.csv'));
      for (const file of files) {
        const filePath = join(config.inboxPath, file);
        const destProcessed = join(processedPath, `${Date.now()}-${file}`);
        const destFailed = join(failedPath, `${Date.now()}-${file}`);
        try {
          const content = await readFile(filePath, 'utf-8');
          const events = parseCsv(content, config);
          for (const event of events) {
            await ctx.submitEvent(event);
          }
          await rename(filePath, destProcessed);
          ctx.logger.info('CSV processed', { file, rows: events.length });
        } catch (err) {
          ctx.logger.error('CSV processing failed', { file, error: String(err) });
          await rename(filePath, destFailed).catch(() => undefined);
        }
      }
      await ctx.reportHealth('active', `Last poll: processed ${files.length} file(s)`);
    } catch (err) {
      await ctx.reportHealth('error', String(err));
    }
  }

  override async stop(): Promise<void> {
    if (this.timer) clearInterval(this.timer);
    this.state = 'stopped';
  }
}

function parseCsv(content: string, config: CsvConnectorConfig): unknown[] {
  const lines = content.trim().split('\n').filter(Boolean);
  if (lines.length === 0) return [];

  const headers = config.hasHeader
    ? (lines[0]?.split(config.delimiter).map((h) => h.trim()) ?? [])
    : [];
  const dataLines = config.hasHeader ? lines.slice(1) : lines;

  return dataLines.map((line) => {
    const values = line.split(config.delimiter).map((v) => v.trim().replace(/^"|"$/g, ''));
    const row: Record<string, string> = {};
    headers.forEach((h, i) => {
      row[h] = values[i] ?? '';
    });

    // Build event from column mappings
    const event: Record<string, unknown> = {
      eventType: config.mapping.eventType,
    };

    if (config.mapping.externalEventIdColumn) {
      event['externalEventId'] = row[config.mapping.externalEventIdColumn];
    }
    if (config.mapping.occurredAtColumn) {
      event['occurredAt'] = row[config.mapping.occurredAtColumn];
    }
    if (config.mapping.quantityColumn) {
      const qty = parseFloat(row[config.mapping.quantityColumn] ?? '');
      if (!isNaN(qty)) event['quantity'] = qty;
    }
    if (config.mapping.unitOfMeasureColumn) {
      event['unitOfMeasure'] = row[config.mapping.unitOfMeasureColumn];
    }

    // Apply column mappings using dot notation paths
    for (const [col, path] of Object.entries(config.mapping.columnMappings)) {
      const value = row[col];
      if (value !== undefined && value !== '') {
        setNestedValue(event, path, value);
      }
    }

    return event;
  });
}

function setNestedValue(obj: Record<string, unknown>, path: string, value: unknown) {
  const parts = path.split('.');
  let current = obj;
  for (let i = 0; i < parts.length - 1; i++) {
    const part = parts[i]!;
    if (typeof current[part] !== 'object' || current[part] === null) {
      current[part] = {};
    }
    current = current[part] as Record<string, unknown>;
  }
  const lastPart = parts[parts.length - 1]!;
  current[lastPart] = value;
}

export default function createConnector(): CsvConnector {
  return new CsvConnector();
}
