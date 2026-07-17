/**
 * Global toast queue (module-level state shared by all callers).
 */
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { useToast } from '@/composables/useToast';

const toast = useToast();

const drain = () => {
    for (const t of [...toast.toasts.value]) toast.removeToast(t.id);
};

beforeEach(() => {
    vi.useFakeTimers();
    drain();
});

afterEach(() => {
    drain();
    vi.useRealTimers();
});

describe('useToast', () => {
    it('adds typed toasts', () => {
        toast.success('saved');
        toast.error('failed');
        toast.warning('careful');
        toast.info('fyi');
        expect(toast.toasts.value.map((t) => t.type)).toEqual([
            'success',
            'error',
            'warning',
            'info',
        ]);
    });

    it('auto-dismisses after the timeout', () => {
        toast.success('bye', 3000);
        expect(toast.toasts.value).toHaveLength(1);
        vi.advanceTimersByTime(2999);
        expect(toast.toasts.value).toHaveLength(1);
        vi.advanceTimersByTime(1);
        expect(toast.toasts.value).toHaveLength(0);
    });

    it('shares state across useToast() instances', () => {
        toast.info('shared');
        const other = useToast();
        expect(other.toasts.value).toHaveLength(1);
        other.removeToast(other.toasts.value[0].id);
        expect(toast.toasts.value).toHaveLength(0);
    });

    it('pause stops auto-dismiss; resume restarts the full timeout', () => {
        toast.info('hover me', 1000);
        const id = toast.toasts.value[0].id;

        toast.pauseToast(id);
        vi.advanceTimersByTime(5000);
        expect(toast.toasts.value).toHaveLength(1); // survived while paused

        toast.resumeToast(id);
        vi.advanceTimersByTime(999);
        expect(toast.toasts.value).toHaveLength(1); // full timeout restarted
        vi.advanceTimersByTime(1);
        expect(toast.toasts.value).toHaveLength(0);
    });

    it('resumeToast on an unknown/already-removed id is a no-op', () => {
        expect(() => toast.resumeToast(999999)).not.toThrow();
        expect(toast.toasts.value).toHaveLength(0);
    });

    it('removeToast cancels the pending timer', () => {
        toast.info('gone early', 1000);
        const id = toast.toasts.value[0].id;
        toast.removeToast(id);
        expect(() => vi.runAllTimers()).not.toThrow();
        expect(toast.toasts.value).toHaveLength(0);
    });
});
