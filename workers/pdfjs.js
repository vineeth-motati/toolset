/**
 * pdf.js worker entry point.
 *
 * The worker is a separate script with its own global scope, so a polyfill
 * installed on the main thread does not reach it — and pdf.worker.min.mjs has
 * ~12 `getOrInsertComputed` call sites of its own. This module installs the
 * shim first, then loads the real worker.
 *
 * Lives outside utils/ so Nuxt's auto-import scanner never walks it: pulling
 * pdf.worker into the main bundle would be 1.25 MB of worker-only code
 * evaluated on the main thread.
 *
 * The pdf.worker import MUST stay dynamic. Static `import` declarations are
 * hoisted and evaluated before any statement in this module body, so a plain
 * `import 'pdfjs-dist/build/pdf.worker.min.mjs'` below would run pdf.js BEFORE
 * installMapUpsert() — defeating the entire fix while looking correct.
 * Top-level await is fine here: nuxt.config.ts already targets es2022.
 */
import { installMapUpsert } from '../utils/polyfills/mapUpsert';

installMapUpsert();

await import('pdfjs-dist/build/pdf.worker.min.mjs');
