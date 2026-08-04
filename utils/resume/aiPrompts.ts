/**
 * Prompt builders for the resume AI actions. Pure functions returning chat
 * message arrays — no network, no Vue — so they are unit-testable. They feed
 * the model a plain-text rendering of the résumé (via toPlainText) as context.
 */
import { toPlainText } from './plainText';
import type { ResumeDoc } from './types';
import type { ChatMessage } from './llm';

const SYSTEM: ChatMessage = {
    role: 'system',
    content:
        'You are an expert resume writer. Write concise, high-impact content: ' +
        'lead with strong action verbs, quantify results where possible, avoid ' +
        'clichés and first-person pronouns, and never invent facts that are not ' +
        'supported by the material provided. Output plain text only — no markdown ' +
        'headings, no preamble, no explanations.',
};

/** Generate (or rewrite) a 2–3 sentence professional summary. */
export function summaryMessages(doc: ResumeDoc): ChatMessage[] {
    return [
        SYSTEM,
        {
            role: 'user',
            content:
                `Here is my résumé:\n\n${toPlainText(doc)}\n\n` +
                'Write a compelling 2–3 sentence professional summary for the top of ' +
                'this résumé. Return only the summary text.',
        },
    ];
}

/**
 * Tailor the résumé to a job description — suggest rewritten/added bullet
 * points that naturally incorporate the missing keywords (only where truthful).
 */
export function tailorMessages(
    doc: ResumeDoc,
    jobDescription: string,
    missingKeywords: string[] = []
): ChatMessage[] {
    const missing = missingKeywords.length
        ? `\n\nKeywords from the job description that are currently missing from my résumé: ${missingKeywords.join(', ')}.`
        : '';
    return [
        SYSTEM,
        {
            role: 'user',
            content:
                `My résumé:\n\n${toPlainText(doc)}\n\n` +
                `Target job description:\n\n${jobDescription}${missing}\n\n` +
                'Suggest 4–6 rewritten or new résumé bullet points that better match ' +
                'this job, weaving in the missing keywords only where they are truthful ' +
                'given my experience. Return one bullet per line, each starting with "- ".',
        },
    ];
}

/** Improve a single bullet point / snippet of résumé text. */
export function improveMessages(text: string, context = ''): ChatMessage[] {
    return [
        SYSTEM,
        {
            role: 'user',
            content:
                (context ? `Context: ${context}\n\n` : '') +
                `Rewrite this résumé bullet to be more impactful and quantified where ` +
                `possible, keeping it to one line:\n\n${text}\n\nReturn only the rewritten bullet.`,
        },
    ];
}
