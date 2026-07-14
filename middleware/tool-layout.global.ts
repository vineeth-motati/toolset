import { useTools } from '@/composables/useTools';

// Applies each tool's `layout` from data/tools.json so pages don't need
// per-page definePageMeta boilerplate. Non-tool routes keep the default layout.
export default defineNuxtRouteMiddleware((to) => {
    const tool = useTools().byPath(to.path);
    if (tool) setPageLayout(tool.layout);
});
