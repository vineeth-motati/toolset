/**
 * Resume Builder data model. Superset of the JSON Resume open schema
 * (jsonresume.org) — UI-only fields live under `meta` so a clean JSON Resume
 * export stays spec-valid. All logic lives in framework-free modules
 * (schema.ts, jsonResume.ts, ats.ts, templates/*) so it is unit-testable
 * without a Nuxt/DOM runtime.
 */

export interface ResumeProfile {
    network: string;
    username: string;
    url: string;
}

export interface ResumeLocation {
    city: string;
    region: string;
    countryCode: string;
}

export interface ResumeBasics {
    name: string;
    label: string;
    email: string;
    phone: string;
    url: string;
    location: ResumeLocation;
    summary: string;
    photo: string; // base64 data URL (downscaled) or ''
    profiles: ResumeProfile[];
}

export interface WorkItem {
    name: string;
    position: string;
    startDate: string;
    endDate: string;
    location: string;
    summary: string;
    highlights: string[];
}

export interface EducationItem {
    institution: string;
    area: string;
    studyType: string;
    startDate: string;
    endDate: string;
    score: string;
    courses: string[];
}

export interface SkillItem {
    name: string;
    level: string;
    keywords: string[];
}

export interface ProjectItem {
    name: string;
    description: string;
    url: string;
    highlights: string[];
}

export interface CertificateItem {
    name: string;
    issuer: string;
    date: string;
    url: string;
}

export interface AwardItem {
    title: string;
    awarder: string;
    date: string;
    summary: string;
}

export interface LanguageItem {
    language: string;
    fluency: string;
}

export interface InterestItem {
    name: string;
    keywords: string[];
}

export interface ReferenceItem {
    name: string;
    reference: string;
}

export interface CustomSectionItem {
    title: string;
    description: string;
}

export interface CustomSection {
    id: string;
    title: string;
    items: CustomSectionItem[];
}

export type PageSize = 'A4' | 'LETTER';

export interface ResumeTheme {
    accent: string; // hex
    fontFamily: string; // must be a registered pdfmake font
    fontSize: number; // pt (body)
    lineHeight: number;
    sectionSpacing: number; // pt of space above each section
    pageSize: PageSize;
    margins: [number, number, number, number]; // [left, top, right, bottom]
}

export interface ResumeMeta {
    template: string; // template id
    theme: ResumeTheme;
    sectionsOrder: SectionKey[];
    sectionVisibility: Record<string, boolean>;
    customSections: CustomSection[];
}

export interface ResumeDoc {
    id: string;
    name: string;
    updatedAt: number;
    basics: ResumeBasics;
    work: WorkItem[];
    education: EducationItem[];
    skills: SkillItem[];
    projects: ProjectItem[];
    certificates: CertificateItem[];
    awards: AwardItem[];
    languages: LanguageItem[];
    interests: InterestItem[];
    references: ReferenceItem[];
    meta: ResumeMeta;
}

/** Keys of the standard (built-in) sections, in default display order. */
export type SectionKey =
    | 'work'
    | 'education'
    | 'skills'
    | 'projects'
    | 'certificates'
    | 'awards'
    | 'languages'
    | 'interests'
    | 'references';
