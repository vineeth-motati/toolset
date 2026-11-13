/**
 * Polyfill for the TC39 "Upsert" proposal — Map/WeakMap `getOrInsert` and
 * `getOrInsertComputed`. Baseline only since Feb 2026 (Chrome 145, Firefox 144,
 * Safari 18.4).
 *
 * We need this because pdfjs-dist >= 5.5 calls `getOrInsertComputed` directly,
 * with no feature detection and no shim of its own — pdf.js is Mozilla's code,
 * developed against Firefox Nightly, so it picks up new built-ins as soon as
 * Firefox ships them. On anything older the viewer dies with
 * "…getOrInsertComputed is not a function". The `legacy/` build does NOT help:
 * it transpiles syntax via Babel but never shims built-in methods.
 *
 * Both realms need this installed — the main thread AND the pdf.js worker,
 * which is a separate script with its own global scope. See workers/pdfjs.js.
 */

/** https://tc39.es/proposal-upsert/#sec-map.prototype.getorinsert */
export function getOrInsert<K, V>(this: Map<K, V>, key: K, value: V): V {
    if (this.has(key)) return this.get(key) as V;
    this.set(key, value);
    return value;
}

/** https://tc39.es/proposal-upsert/#sec-map.prototype.getorinsertcomputed */
export function getOrInsertComputed<K, V>(
    this: Map<K, V>,
    key: K,
    callbackfn: (key: K) => V
): V {
    if (typeof callbackfn !== 'function') {
        throw new TypeError('the callback must be a function');
    }
    if (this.has(key)) return this.get(key) as V;
    const value = callbackfn(key);
    // The spec re-checks after the callback (which may have inserted `key`
    // itself) and overwrites. `set` gives us exactly that, plus -0 → +0
    // normalisation, for free.
    this.set(key, value);
    return value;
}

function define(proto: object, name: string, impl: Function): void {
    if (typeof (proto as any)[name] === 'function') return;
    // Match the attributes of a real built-in method, so the shim is
    // indistinguishable from the native one to anything inspecting it.
    Object.defineProperty(proto, name, {
        value: impl,
        writable: true,
        enumerable: false,
        configurable: true,
    });
}

/** Idempotent, and a no-op on browsers that already ship the real thing. */
export function installMapUpsert(): void {
    for (const Ctor of [Map, WeakMap]) {
        define(Ctor.prototype, 'getOrInsert', getOrInsert);
        define(Ctor.prototype, 'getOrInsertComputed', getOrInsertComputed);
    }
}
