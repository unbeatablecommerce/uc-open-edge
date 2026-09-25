import { appendFile, mkdir } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { dirname } from 'node:path';
import { z } from 'zod';
import {
  BaseDestination,
  type DestinationDeliveryContext,
  type DeliveryResult,
} from '@uc-open-edge/destination-sdk';

export const FileDestinationConfigSchema = z.object({
  /** Absolute path to the JSONL output file */
  filePath: z.string().min(1),
  /** Whether to rotate the file daily */
  rotateDailyPath: z.boolean().default(true),
  /** Whether to pretty-print JSON (false = JSONL, true = one indented object per line) */
  prettyPrint: z.boolean().default(false),
});

export type FileDestinationConfig = z.infer<typeof FileDestinationConfigSchema>;

export class FileDestination extends BaseDestination {
  readonly type = 'file';

  override validateConfig(config: unknown): string | null {
    const result = FileDestinationConfigSchema.safeParse(config);
    return result.success ? null : result.error.message;
  }

  override async deliver(
    event: Record<string, unknown>,
    ctx: DestinationDeliveryContext,
  ): Promise<DeliveryResult> {
    const config = FileDestinationConfigSchema.parse(ctx.config);
    const startMs = Date.now();

    try {
      const filePath = config.rotateDailyPath ? injectDate(config.filePath) : config.filePath;

      const dir = dirname(filePath);
      if (!existsSync(dir)) await mkdir(dir, { recursive: true });

      const line = config.prettyPrint
        ? JSON.stringify(event, null, 2) + '\n'
        : JSON.stringify(event) + '\n';

      await appendFile(filePath, line, 'utf-8');

      return {
        success: true,
        requestBody: event,
        responseBody: filePath,
        durationMs: Date.now() - startMs,
      };
    } catch (err) {
      return {
        success: false,
        requestBody: event,
        error: String(err),
        durationMs: Date.now() - startMs,
      };
    }
  }
}

function injectDate(filePath: string): string {
  const date = new Date().toISOString().slice(0, 10);
  const ext = filePath.endsWith('.jsonl') ? '.jsonl' : '.json';
  return filePath.replace(ext, '') + `-${date}${ext}`;
}

export default function createDestination(): FileDestination {
  return new FileDestination();
}
