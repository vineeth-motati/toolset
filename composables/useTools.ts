import toolsData from '@/data/tools.json';
import converterConfigs from '@/config/converters';
import { getLocalConverter } from '@/utils/localConverters';

export interface ToolSeo {
    title: string;
    description: string;
}

export interface Tool {
    name: string;
    path: string;
    icon: string;
    description: string;
    category: string;
    keywords: string[];
    layout: 'default' | 'fullscreen';
    popular: boolean;
    seo: ToolSeo;
    // Entries projected from config/converters.js (absent on tools.json entries)
    kind?: 'tool' | 'converter';
    // True when conversion runs on the external ConversionTools API — the
    // file is uploaded and a user-supplied API key is required.
    apiOnly?: boolean;
}

export interface CategoryMeta {
    label: string;
    short: string;
    icon: string;
    color: string;
    blurb: string;
}

export const CATEGORY_META: Record<string, CategoryMeta> = {
    dev: {
        label: 'Developer Tools',
        short: 'Developer',
        icon: 'lucide:braces',
        color: '#2563EB',
        blurb: 'Format, inspect and test JSON, code and APIs',
    },
    productivity: {
        label: 'Productivity',
        short: 'Productivity',
        icon: 'lucide:layout-dashboard',
        color: '#7C3AED',
        blurb: 'Boards, notes, sheets and a resume builder',
    },
    design: {
        label: 'Design',
        short: 'Design',
        icon: 'lucide:pen-tool',
        color: '#DB2777',
        blurb: 'Palettes, layouts, animations and a canvas',
    },
    media: {
        label: 'Media',
        short: 'Media',
        icon: 'lucide:image',
        color: '#EA580C',
        blurb: 'Images, QR codes and video transcripts',
    },
    convert: {
        label: 'Converters',
        short: 'Convert',
        icon: 'lucide:repeat',
        color: '#0D9488',
        blurb: 'Documents, data, images, audio and video',
    },
};

export const CATEGORY_LABELS: Record<string, string> = Object.fromEntries(
    Object.entries(CATEGORY_META).map(([key, meta]) => [key, meta.label])
);

const CATEGORY_ORDER = Object.keys(CATEGORY_META);
const categoryRank = (key: string) => {
    const i = CATEGORY_ORDER.indexOf(key);
    return i === -1 ? CATEGORY_ORDER.length : i;
};

export const categoryColor = (key?: string): string =>
    (key && CATEGORY_META[key]?.color) || '#2447E6';

const tools = toolsData as Tool[];

// The converters from config/converters.js projected into the Tool shape so
// search, byPath and recents treat them as first-class tools. They stay out
// of `all`/`categories` — the home grid keeps the single Convert hub card.
const converterTools: Tool[] = converterConfigs.map((c: any) => ({
    name: c.title,
    path: c.path,
    icon: c.sourceIcon,
    description: c.description,
    category: 'convert',
    keywords: [
        c.sourceFormat,
        c.targetFormat,
        `${c.sourceFormat} to ${c.targetFormat}`,
        c.category,
    ].map((k: string) => k.toLowerCase()),
    layout: 'default',
    popular: false,
    seo: { title: c.title, description: c.description },
    kind: 'converter',
    apiOnly: !getLocalConverter(c.path),
}));

// Tools first so they outrank converters in search results.
const searchable: Tool[] = [...tools, ...converterTools];

export function useTools() {
    const byPath = (path: string): Tool | undefined =>
        searchable.find((t) => t.path === path);

    const currentTool = (): Tool | undefined => {
        const route = useRoute();
        return byPath(route.path);
    };

    const popular = (): Tool[] => tools.filter((t) => t.popular);

    const categories = (): { key: string; label: string; items: Tool[] }[] => {
        const map = new Map<string, Tool[]>();
        for (const tool of tools) {
            if (!map.has(tool.category)) map.set(tool.category, []);
            map.get(tool.category)!.push(tool);
        }
        return Array.from(map.entries())
            .sort(([a], [b]) => categoryRank(a) - categoryRank(b))
            .map(([key, items]) => ({
                key,
                label: CATEGORY_LABELS[key] || key,
                items,
            }));
    };

    const search = (query: string): Tool[] => {
        const q = query.trim().toLowerCase();
        if (!q) return [];
        return searchable.filter(
            (tool) =>
                tool.name.toLowerCase().includes(q) ||
                tool.description.toLowerCase().includes(q) ||
                tool.keywords?.some((k) => k.toLowerCase().includes(q))
        );
    };

    return {
        all: tools,
        converters: converterTools,
        byPath,
        currentTool,
        popular,
        categories,
        search,
    };
}
