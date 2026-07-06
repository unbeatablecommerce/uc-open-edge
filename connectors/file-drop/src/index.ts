import { readdir, readFile, rename, mkdir } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { z } from 'zod';
import { BaseConnector, type ConnectorRunContext } from '@uc-open-edge/connector-sdk';

export const FileDropConfigSchema = z.object({
  /** Absolute path to the folder to watch for incoming JSON files */
  inboxPath: z.string().min(1),
  /** Subfolder name within inboxPath for processed files */
  processedFolder: z.string().default('processed'),
  /** Subfolder name within inboxPath for failed files */
  failedFolder: z.string().default('failed'),
  /** Poll interval in milliseconds */
  pollIntervalMs: z.number().int().positive().default(5000),
  /** File extension to watch */
  extension: z.string().default('.json'),
});

export type FileDropConfig = z.infer<typeof FileDropConfigSchema>;

export class FileDropConnector extends BaseConnector {
  readonly type = 'file_drop';
  private timer?: ReturnType<typeof setInterval>;

  override validateConfig(config: unknown): string | null {
    const result = FileDropConfigSchema.safeParse(config);
    return result.success ? null : result.error.message;
  }

  override async start(ctx: ConnectorRunContext): Promise<void> {
    const config = FileDropConfigSchema.parse(ctx.config);
    this.state = 'running';

    const processedPath = join(config.inboxPath, config.processedFolder);
    const failedPath = join(config.inboxPath, config.failedFolder);

    await ensureDir(processedPath);
    await ensureDir(failedPath);

    ctx.logger.info('File-drop connector started', { inboxPath: config.inboxPath });
    await ctx.reportHealth('active', `Watching ${config.inboxPath}`);

    this.timer = setInterval(async () => {
      if (this.state !== 'running') return;
      await this.poll(ctx, config, processedPath, failedPath);
    }, config.pollIntervalMs);

    // Run immediately on start
    await this.poll(ctx, config, processedPath, failedPath);
  }

  private async poll(
    ctx: ConnectorRunContext,
    config: FileDropConfig,
    processedPath: string,
    failedPath: string,
  ) {
    try {
      const files = await readdir(config.inboxPath);
      const jsonFiles = files.filter((f) => f.endsWith(config.extension));

      for (const file of jsonFiles) {
        const filePath = join(config.inboxPath, file);
        const destProcessed = join(processedPath, `${Date.now()}-${file}`);
        const destFailed = join(failedPath, `${Date.now()}-${file}`);

        try {
          const content = await readFile(filePath, 'utf-8');
          const payload = JSON.parse(content);

          // Support both single event and array of events
          const events = Array.isArray(payload) ? payload : [payload];
          for (const event of events) {
            await ctx.submitEvent(event);
          }

          await rename(filePath, destProcessed);
          ctx.logger.info('File processed', { file, eventCount: events.length });
        } catch (err) {
          ctx.logger.error('File processing failed', { file, error: String(err) });
          await rename(filePath, destFailed).catch(() => undefined);
        }
      }

      await ctx.reportHealth('active', `Last poll: processed ${jsonFiles.length} file(s)`);
    } catch (err) {
      ctx.logger.error('Poll error', { error: String(err) });
      await ctx.reportHealth('error', String(err));
    }
  }

  override async stop(): Promise<void> {
    if (this.timer) clearInterval(this.timer);
    this.state = 'stopped';
  }
}

async function ensureDir(path: string) {
  if (!existsSync(path)) {
    await mkdir(path, { recursive: true });
  }
}

export default function createConnector(): FileDropConnector {
  return new FileDropConnector();
}
