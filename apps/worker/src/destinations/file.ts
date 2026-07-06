import { appendFile, mkdir } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { dirname } from 'node:path';
import type { IDestination } from '@uc-open-edge/destination-sdk';

export function createFileDestination(): IDestination {
  return {
    type: 'file',
    validateConfig: () => null,
    async deliver(event, ctx) {
      const config = ctx.config as {
        filePath: string;
        rotateDailyPath?: boolean;
        prettyPrint?: boolean;
      };
      const startMs = Date.now();
      try {
        let filePath = config.filePath;
        if (config.rotateDailyPath !== false) {
          const date = new Date().toISOString().slice(0, 10);
          const ext = filePath.endsWith('.jsonl') ? '.jsonl' : '.json';
          filePath = filePath.replace(ext, '') + `-${date}${ext}`;
        }
        const dir = dirname(filePath);
        if (!existsSync(dir)) await mkdir(dir, { recursive: true });
        const line =
          (config.prettyPrint ? JSON.stringify(event, null, 2) : JSON.stringify(event)) + '\n';
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
    },
    async test(ctx) {
      return this.deliver({ test: true }, ctx);
    },
  };
}
