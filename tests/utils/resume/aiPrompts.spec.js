import { describe, it, expect } from 'vitest';
import { summaryMessages, tailorMessages, improveMessages } from '@/utils/resume/aiPrompts';
import { fullResume } from './fixtures';

describe('summaryMessages', () => {
    it('builds a system+user pair with the resume as context', () => {
        const msgs = summaryMessages(fullResume());
        expect(msgs).toHaveLength(2);
        expect(msgs[0].role).toBe('system');
        expect(msgs[1].role).toBe('user');
        expect(msgs[1].content).toContain('Ada Lovelace'); // resume content injected
        expect(msgs[1].content.toLowerCase()).toContain('summary');
    });
});

describe('tailorMessages', () => {
    it('includes the job description and missing keywords', () => {
        const msgs = tailorMessages(fullResume(), 'We need a Rust and Kafka expert.', ['rust', 'kafka']);
        const user = msgs[1].content;
        expect(user).toContain('Rust and Kafka expert');
        expect(user).toContain('rust');
        expect(user).toContain('kafka');
        expect(user).toContain('- '); // asks for bullet format
    });

    it('works without a missing-keyword list', () => {
        const msgs = tailorMessages(fullResume(), 'Some role', []);
        expect(msgs[1].content).toContain('Some role');
    });
});

describe('improveMessages', () => {
    it('wraps the bullet text and optional context', () => {
        const msgs = improveMessages('did stuff', 'backend role');
        expect(msgs[1].content).toContain('did stuff');
        expect(msgs[1].content).toContain('backend role');
    });
});
