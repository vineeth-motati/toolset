/**
 * Share modal state (module-level refs, callable outside setup).
 */
import { describe, it, expect } from 'vitest';
import { showShareModal, useShareModal } from '@/composables/useShareModal';

describe('useShareModal', () => {
    it('opens with the given link and shares state across instances', () => {
        const modal = useShareModal();
        expect(modal.isOpen.value).toBe(false);

        showShareModal('https://tools.test/tools/notes?share=x');
        expect(modal.isOpen.value).toBe(true);
        expect(modal.link.value).toBe(
            'https://tools.test/tools/notes?share=x'
        );

        // A second consumer sees the same state.
        const other = useShareModal();
        expect(other.isOpen.value).toBe(true);
        other.close();
        expect(modal.isOpen.value).toBe(false);
    });

    it('keeps the last link after closing (harmless, but locked in)', () => {
        showShareModal('https://a');
        const modal = useShareModal();
        modal.close();
        expect(modal.link.value).toBe('https://a');
    });
});
