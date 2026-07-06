/**
 * Workaround for SvelteKit 2.69.1 bug:
 * The vite-plugin-sveltekit-guard incorrectly throws "An impossible situation occurred"
 * when hooks.server.ts is loaded during the browser build phase, even though this is
 * expected behavior (server-only modules don't need browser entrypoints).
 *
 * Root cause: PR #15178 adds hooks.server as an explicit Vite entry for stable manifest IDs,
 * but the guard's load() hook fires during the browser build without finding a browser entrypoint
 * in the import chain — which is correct, but should not throw.
 *
 * Fixed in: pending upstream
 * Track: https://github.com/sveltejs/kit/issues/15157
 */

import { readFileSync, writeFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';

const pnpmDir = join(process.cwd(), 'node_modules', '.pnpm');

let patched = false;

try {
  for (const dir of readdirSync(pnpmDir)) {
    if (!dir.startsWith('@sveltejs+kit@')) continue;
    const file = join(
      pnpmDir,
      dir,
      'node_modules',
      '@sveltejs',
      'kit',
      'src',
      'exports',
      'vite',
      'index.js',
    );
    try {
      let content = readFileSync(file, 'utf8');
      if (content.includes("throw new Error('An impossible situation occurred')")) {
        content = content.replace(
          "throw new Error('An impossible situation occurred');",
          'return; // patched: server-only module not in browser entrypoints is OK',
        );
        writeFileSync(file, content, 'utf8');
        console.log(`[patch-sveltekit-guard] Patched ${file}`);
        patched = true;
      } else if (content.includes('patched: server-only module not in browser entrypoints')) {
        console.log(`[patch-sveltekit-guard] Already patched, skipping.`);
        patched = true;
      }
    } catch {
      // file doesn't exist in this package variant, skip
    }
  }
} catch (e) {
  console.warn('[patch-sveltekit-guard] Could not apply patch:', e.message);
}

if (!patched) {
  console.warn('[patch-sveltekit-guard] No matching SvelteKit installation found to patch.');
}
