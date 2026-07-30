/**
 * Stable render keys for resume entries.
 *
 * Section entries are plain objects with no id (the JSON Resume schema has no
 * place to put one, and adding one would leak into every export). Keying a
 * vuedraggable list by array index means two entries swap keys on every
 * reorder, so Vue patches the wrong DOM nodes and the collapse state — and any
 * focused input — jumps to the neighbouring row.
 *
 * A WeakMap keyed on the entry object gives each one an identity that survives
 * reordering and disappears with the entry. Vue caches one reactive proxy per
 * target, so repeated reads of the same entry hit the same WeakMap key.
 */
const keys = new WeakMap<object, number>();
let next = 1;

export function entryKey(entry: unknown): number | string {
    if (!entry || typeof entry !== 'object') return String(entry);
    const obj = entry as object;
    let key = keys.get(obj);
    if (key === undefined) {
        key = next++;
        keys.set(obj, key);
    }
    return key;
}
