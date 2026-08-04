/**
 * Map our ResumeDoc <-> the JSON Resume open schema (jsonresume.org).
 * Export produces a spec-valid document (UI-only fields dropped); import
 * accepts a JSON Resume file and fills what maps, then `validate()` repairs
 * the rest. Pure — covered by tests/utils/resume/jsonResume.spec.js.
 */
import { validate, defaultResume } from './schema';
import type { ResumeDoc } from './types';

/** ResumeDoc -> JSON Resume (jsonresume.org v1). */
export function toJsonResume(doc: ResumeDoc): Record<string, any> {
    const b = doc.basics;
    return {
        $schema:
            'https://raw.githubusercontent.com/jsonresume/resume-schema/v1.0.0/schema.json',
        basics: {
            name: b.name,
            label: b.label,
            image: b.photo || undefined,
            email: b.email,
            phone: b.phone,
            url: b.url,
            summary: b.summary,
            location: {
                city: b.location.city,
                region: b.location.region,
                countryCode: b.location.countryCode,
            },
            profiles: b.profiles.map((p) => ({
                network: p.network,
                username: p.username,
                url: p.url,
            })),
        },
        work: doc.work.map((w) => ({
            name: w.name,
            position: w.position,
            startDate: w.startDate,
            endDate: w.endDate,
            location: w.location,
            summary: w.summary,
            highlights: w.highlights,
        })),
        education: doc.education.map((e) => ({
            institution: e.institution,
            area: e.area,
            studyType: e.studyType,
            startDate: e.startDate,
            endDate: e.endDate,
            score: e.score,
            courses: e.courses,
        })),
        skills: doc.skills.map((s) => ({
            name: s.name,
            level: s.level,
            keywords: s.keywords,
        })),
        projects: doc.projects.map((p) => ({
            name: p.name,
            description: p.description,
            url: p.url,
            highlights: p.highlights,
        })),
        certificates: doc.certificates.map((c) => ({
            name: c.name,
            issuer: c.issuer,
            date: c.date,
            url: c.url,
        })),
        awards: doc.awards.map((a) => ({
            title: a.title,
            awarder: a.awarder,
            date: a.date,
            summary: a.summary,
        })),
        languages: doc.languages.map((l) => ({
            language: l.language,
            fluency: l.fluency,
        })),
        interests: doc.interests.map((i) => ({
            name: i.name,
            keywords: i.keywords,
        })),
        references: doc.references.map((r) => ({
            name: r.name,
            reference: r.reference,
        })),
    };
}

/**
 * JSON Resume -> ResumeDoc. Accepts a parsed object (or JSON string), maps the
 * standard fields, then runs `validate()` so the result is always complete.
 * `image` maps to our `basics.photo`. Preserves an existing name/id when given.
 */
export function fromJsonResume(
    input: unknown,
    opts: { name?: string; id?: string } = {}
): ResumeDoc {
    let json: any = input;
    if (typeof input === 'string') {
        try {
            json = JSON.parse(input);
        } catch {
            json = {};
        }
    }
    if (!json || typeof json !== 'object') json = {};

    const base = defaultResume(opts.name || 'Imported resume');
    const b = json.basics ?? {};

    const merged = {
        ...base,
        id: opts.id || base.id,
        name: opts.name || b.name || base.name,
        basics: {
            ...base.basics,
            name: b.name ?? '',
            label: b.label ?? '',
            email: b.email ?? '',
            phone: b.phone ?? '',
            url: b.url ?? '',
            summary: b.summary ?? '',
            photo: b.image ?? '',
            location: {
                city: b.location?.city ?? '',
                region: b.location?.region ?? '',
                countryCode: b.location?.countryCode ?? '',
            },
            profiles: Array.isArray(b.profiles) ? b.profiles : [],
        },
        work: Array.isArray(json.work) ? json.work : [],
        education: Array.isArray(json.education) ? json.education : [],
        skills: Array.isArray(json.skills) ? json.skills : [],
        projects: Array.isArray(json.projects) ? json.projects : [],
        certificates: Array.isArray(json.certificates) ? json.certificates : [],
        awards: Array.isArray(json.awards) ? json.awards : [],
        languages: Array.isArray(json.languages) ? json.languages : [],
        interests: Array.isArray(json.interests) ? json.interests : [],
        references: Array.isArray(json.references) ? json.references : [],
    };

    return validate(merged);
}
