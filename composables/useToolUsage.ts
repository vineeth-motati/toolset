import { useLocalStorage } from '@vueuse/core';

export interface RecentEntry {
    path: string;
    lastUsed: number;
}

const MAX_RECENTS = 6;

// localStorage-backed favorites + recents. Multiple instances stay in sync
// through vueuse storage events (JSON serializer inferred from defaults).
export function useToolUsage() {
    const recents = useLocalStorage<RecentEntry[]>('tool-recents', []);
    const favorites = useLocalStorage<string[]>('tool-favorites', []);

    const recordUsage = (path: string) => {
        const list = recents.value.filter((r) => r.path !== path);
        list.unshift({ path, lastUsed: Date.now() });
        recents.value = list.slice(0, MAX_RECENTS);
    };

    const isFavorite = (path: string) => favorites.value.includes(path);

    const toggleFavorite = (path: string) => {
        favorites.value = isFavorite(path)
            ? favorites.value.filter((p) => p !== path)
            : [...favorites.value, path];
    };

    return { recents, favorites, recordUsage, isFavorite, toggleFavorite };
}
