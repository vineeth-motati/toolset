/**
 * Clipboard helper used by nearly every tool's "copy" buttons.
 */
import { describe, it, expect, vi } from 'vitest';
import { copyText } from '@/composables/useCopy';

const stubClipboard = (writeText: (text: string) => Promise<void>) => {
    Object.defineProperty(navigator, 'clipboard', {
        value: { writeText },
        configurable: true,
    });
};

describe('copyText', () => {
    it('uses the async clipboard API when available', async () => {
        const writeText = vi.fn().mockResolvedValue(undefined);
        stubClipboard(writeText);
        expect(await copyText('hello')).toBe(true);
        expect(writeText).toHaveBeenCalledWith('hello');
    });

    it('falls back to a hidden textarea + execCommand', async () => {
        stubClipboard(vi.fn().mockRejectedValue(new Error('denied')));
        (document as any).execCommand = vi.fn(() => true);

        expect(await copyText('fallback text')).toBe(true);
        expect((document as any).execCommand).toHaveBeenCalledWith('copy');
        // The temporary textarea must be cleaned up.
        expect(document.querySelector('textarea')).toBeNull();
    });

    it('returns false when both strategies fail', async () => {
        stubClipboard(vi.fn().mockRejectedValue(new Error('denied')));
        (document as any).execCommand = vi.fn(() => {
            throw new Error('unsupported');
        });
        expect(await copyText('nope')).toBe(false);
        expect(document.querySelector('textarea')).toBeNull();
    });
});
