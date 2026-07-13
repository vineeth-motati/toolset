import toolsData from '@/data/tools.json';

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
}

export const CATEGORY_LABELS: Record<string, string> = {
    dev: 'Developer Tools',
    productivity: 'Productivity',
    convert: 'Converters',
    design: 'Design',
    media: 'Media',
};

const tools = toolsData as Tool[];

export function useTools() {
    const byPath = (path: string): Tool | undefined =>
        tools.find((t) => t.path === path);

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
        return Array.from(map.entries()).map(([key, items]) => ({
            key,
            label: CATEGORY_LABELS[key] || key,
            items,
        }));
    };

    const search = (query: string): Tool[] => {
        const q = query.trim().toLowerCase();
        if (!q) return [];
        return tools.filter(
            (tool) =>
                tool.name.toLowerCase().includes(q) ||
                tool.description.toLowerCase().includes(q) ||
                tool.keywords?.some((k) => k.toLowerCase().includes(q))
        );
    };

    return {
        all: tools,
        byPath,
        currentTool,
        popular,
        categories,
        search,
    };
}
