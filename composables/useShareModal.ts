import { ref } from 'vue';

// Module-level refs: callable from event handlers (no setup context needed).
// Never touched during SSR, so cross-request state is not a concern.
const isOpen = ref(false);
const link = ref('');

export function showShareModal(url: string) {
    link.value = url;
    isOpen.value = true;
}

export function useShareModal() {
    const close = () => (isOpen.value = false);
    return { isOpen, link, close };
}
