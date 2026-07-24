/**
 * Defaults, validation and migration for the resume model. Pure functions —
 * no DOM, no Nuxt — so they are covered by tests/utils/resume/schema.spec.js.
 *
 * `validate()` is intentionally forgiving: it repairs a partial/legacy object
 * into a complete ResumeDoc rather than throwing, so a resume saved by an older
 * build (or imported/shared) always opens.
 */
import { nanoid } from 'nanoid';
import type {
    ResumeDoc,
    ResumeTheme,
    SectionKey,
    CustomSection,
} from './types';

export const SECTION_ORDER: SectionKey[] = [
    'work',
    'education',
    'skills',
    'projects',
    'certificates',
    'awards',
    'languages',
    'interests',
    'references',
];

/** Human labels + icons for each standard section (drives the editor UI). */
export const SECTION_META: Record<
    SectionKey,
    { label: string; icon: string; itemNoun: string }
> = {
    work: { label: 'Work Experience', icon: 'mdi:briefcase-outline', itemNoun: 'position' },
    education: { label: 'Education', icon: 'mdi:school-outline', itemNoun: 'school' },
    skills: { label: 'Skills', icon: 'mdi:star-outline', itemNoun: 'skill group' },
    projects: { label: 'Projects', icon: 'mdi:folder-outline', itemNoun: 'project' },
    certificates: { label: 'Certificates', icon: 'mdi:certificate-outline', itemNoun: 'certificate' },
    awards: { label: 'Awards', icon: 'mdi:trophy-outline', itemNoun: 'award' },
    languages: { label: 'Languages', icon: 'mdi:translate', itemNoun: 'language' },
    interests: { label: 'Interests', icon: 'mdi:heart-outline', itemNoun: 'interest' },
    references: { label: 'References', icon: 'mdi:account-voice', itemNoun: 'reference' },
};

// Only Roboto ships in pdfmake's default vfs. Additional families (serif,
// condensed) require bundling TTFs into the vfs — a Phase 2 enhancement.
export const FONT_OPTIONS = ['Roboto'] as const;
export const PAGE_SIZES = ['A4', 'LETTER'] as const;
export const DEFAULT_ACCENT = '#4f46e5'; // primary-600

export function defaultTheme(): ResumeTheme {
    return {
        accent: DEFAULT_ACCENT,
        fontFamily: 'Roboto',
        fontSize: 10,
        lineHeight: 1.25,
        sectionSpacing: 12,
        pageSize: 'A4',
        margins: [40, 40, 40, 40],
    };
}

export function defaultResume(name = 'Untitled resume'): ResumeDoc {
    return {
        id: nanoid(),
        name,
        updatedAt: Date.now(),
        basics: {
            name: '',
            label: '',
            email: '',
            phone: '',
            url: '',
            location: { city: '', region: '', countryCode: '' },
            summary: '',
            photo: '',
            profiles: [],
        },
        work: [],
        education: [],
        skills: [],
        projects: [],
        certificates: [],
        awards: [],
        languages: [],
        interests: [],
        references: [],
        meta: {
            template: 'classic',
            theme: defaultTheme(),
            sectionsOrder: [...SECTION_ORDER],
            sectionVisibility: Object.fromEntries(
                SECTION_ORDER.map((k) => [k, true])
            ) as Record<string, boolean>,
            customSections: [],
        },
    };
}

const str = (v: unknown, fallback = ''): string =>
    typeof v === 'string' ? v : fallback;
const num = (v: unknown, fallback: number): number =>
    typeof v === 'number' && Number.isFinite(v) ? v : fallback;
const arr = <T>(v: unknown): T[] => (Array.isArray(v) ? (v as T[]) : []);
const strArr = (v: unknown): string[] =>
    arr<unknown>(v).map((x) => str(x)).filter(Boolean);

function validateTheme(v: any): ResumeTheme {
    const d = defaultTheme();
    if (!v || typeof v !== 'object') return d;
    const margins = Array.isArray(v.margins) && v.margins.length === 4
        ? (v.margins.map((m: unknown) => num(m, 40)) as [number, number, number, number])
        : d.margins;
    return {
        accent: /^#[0-9a-fA-F]{6}$/.test(v.accent) ? v.accent : d.accent,
        fontFamily: (FONT_OPTIONS as readonly string[]).includes(v.fontFamily)
            ? v.fontFamily
            : d.fontFamily,
        fontSize: Math.min(16, Math.max(7, num(v.fontSize, d.fontSize))),
        lineHeight: Math.min(2, Math.max(1, num(v.lineHeight, d.lineHeight))),
        sectionSpacing: Math.min(40, Math.max(0, num(v.sectionSpacing, d.sectionSpacing))),
        pageSize: (PAGE_SIZES as readonly string[]).includes(v.pageSize) ? v.pageSize : d.pageSize,
        margins,
    };
}

/**
 * Repair any partial/unknown object into a complete, safe ResumeDoc. Never
 * throws — missing pieces fall back to defaults, unknown extras are dropped.
 */
export function validate(input: unknown): ResumeDoc {
    const base = defaultResume();
    if (!input || typeof input !== 'object') return base;
    const v = input as Record<string, any>;
    const b = v.basics ?? {};
    const loc = b.location ?? {};

    const customSections: CustomSection[] = arr<any>(v.meta?.customSections).map(
        (c) => ({
            id: str(c?.id) || nanoid(),
            title: str(c?.title, 'Section'),
            items: arr<any>(c?.items).map((it) => ({
                title: str(it?.title),
                description: str(it?.description),
            })),
        })
    );

    const order = arr<any>(v.meta?.sectionsOrder).filter((k) =>
        SECTION_ORDER.includes(k)
    ) as SectionKey[];
    const sectionsOrder = order.length
        ? [...order, ...SECTION_ORDER.filter((k) => !order.includes(k))]
        : [...SECTION_ORDER];

    const visibility = { ...base.meta.sectionVisibility };
    if (v.meta?.sectionVisibility && typeof v.meta.sectionVisibility === 'object') {
        for (const k of SECTION_ORDER) {
            if (typeof v.meta.sectionVisibility[k] === 'boolean') {
                visibility[k] = v.meta.sectionVisibility[k];
            }
        }
    }

    return {
        id: str(v.id) || base.id,
        name: str(v.name, 'Untitled resume'),
        updatedAt: num(v.updatedAt, Date.now()),
        basics: {
            name: str(b.name),
            label: str(b.label),
            email: str(b.email),
            phone: str(b.phone),
            url: str(b.url),
            location: {
                city: str(loc.city),
                region: str(loc.region),
                countryCode: str(loc.countryCode),
            },
            summary: str(b.summary),
            photo: str(b.photo),
            profiles: arr<any>(b.profiles).map((p) => ({
                network: str(p?.network),
                username: str(p?.username),
                url: str(p?.url),
            })),
        },
        work: arr<any>(v.work).map((w) => ({
            name: str(w?.name),
            position: str(w?.position),
            startDate: str(w?.startDate),
            endDate: str(w?.endDate),
            location: str(w?.location),
            summary: str(w?.summary),
            highlights: strArr(w?.highlights),
        })),
        education: arr<any>(v.education).map((e) => ({
            institution: str(e?.institution),
            area: str(e?.area),
            studyType: str(e?.studyType),
            startDate: str(e?.startDate),
            endDate: str(e?.endDate),
            score: str(e?.score),
            courses: strArr(e?.courses),
        })),
        skills: arr<any>(v.skills).map((s) => ({
            name: str(s?.name),
            level: str(s?.level),
            keywords: strArr(s?.keywords),
        })),
        projects: arr<any>(v.projects).map((p) => ({
            name: str(p?.name),
            description: str(p?.description),
            url: str(p?.url),
            highlights: strArr(p?.highlights),
        })),
        certificates: arr<any>(v.certificates).map((c) => ({
            name: str(c?.name),
            issuer: str(c?.issuer),
            date: str(c?.date),
            url: str(c?.url),
        })),
        awards: arr<any>(v.awards).map((a) => ({
            title: str(a?.title),
            awarder: str(a?.awarder),
            date: str(a?.date),
            summary: str(a?.summary),
        })),
        languages: arr<any>(v.languages).map((l) => ({
            language: str(l?.language),
            fluency: str(l?.fluency),
        })),
        interests: arr<any>(v.interests).map((i) => ({
            name: str(i?.name),
            keywords: strArr(i?.keywords),
        })),
        references: arr<any>(v.references).map((r) => ({
            name: str(r?.name),
            reference: str(r?.reference),
        })),
        meta: {
            template: str(v.meta?.template, 'classic'),
            theme: validateTheme(v.meta?.theme),
            sectionsOrder,
            sectionVisibility: visibility,
            customSections,
        },
    };
}

/** True when the resume has no meaningful content (used to guard share/export). */
export function isEmptyResume(doc: ResumeDoc): boolean {
    const b = doc.basics;
    const hasBasics = !!(b.name || b.email || b.phone || b.summary || b.label);
    const hasSections =
        doc.work.length ||
        doc.education.length ||
        doc.skills.length ||
        doc.projects.length ||
        doc.certificates.length ||
        doc.awards.length ||
        doc.languages.length ||
        doc.interests.length ||
        doc.references.length ||
        doc.meta.customSections.some((c) => c.items.length);
    return !hasBasics && !hasSections;
}
