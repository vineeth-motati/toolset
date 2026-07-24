/**
 * Resume Builder state: a list of saved resumes + the active one, persisted to
 * localStorage (autosaved via VueUse's deep watch) and shareable via the
 * existing share-link pipeline. Thin wrapper — all heavy logic lives in the
 * pure modules under utils/resume/.
 */
import { computed } from 'vue';
import { useLocalStorage } from '@vueuse/core';
import { nanoid } from 'nanoid';
import { defaultResume, validate } from '~/utils/resume/schema';
import { fromJsonResume } from '~/utils/resume/jsonResume';
import type {
    ResumeDoc,
    WorkItem,
    EducationItem,
    SkillItem,
    ProjectItem,
    CertificateItem,
    AwardItem,
    LanguageItem,
    InterestItem,
    ReferenceItem,
    SectionKey,
    CustomSection,
} from '~/utils/resume/types';

const STORAGE_KEY = 'resume-builder';
const CURRENT_KEY = 'resume-builder-current';

const clone = <T>(v: T): T => JSON.parse(JSON.stringify(v));

/** Factory for a blank entry in each standard section. */
export function blankItem(section: SectionKey): any {
    switch (section) {
        case 'work':
            return { name: '', position: '', startDate: '', endDate: '', location: '', summary: '', highlights: [''] } as WorkItem;
        case 'education':
            return { institution: '', area: '', studyType: '', startDate: '', endDate: '', score: '', courses: [] } as EducationItem;
        case 'skills':
            return { name: '', level: '', keywords: [] } as SkillItem;
        case 'projects':
            return { name: '', description: '', url: '', highlights: [''] } as ProjectItem;
        case 'certificates':
            return { name: '', issuer: '', date: '', url: '' } as CertificateItem;
        case 'awards':
            return { title: '', awarder: '', date: '', summary: '' } as AwardItem;
        case 'languages':
            return { language: '', fluency: '' } as LanguageItem;
        case 'interests':
            return { name: '', keywords: [] } as InterestItem;
        case 'references':
            return { name: '', reference: '' } as ReferenceItem;
        default:
            return {};
    }
}

// Singleton state — every useResume() call shares the same reactive refs.
// (Two separate useLocalStorage refs to one key would drift apart in the same
// tab, since same-tab writes don't emit a `storage` event.)
let state: ReturnType<typeof createState> | null = null;

function createState() {
    const resumes = useLocalStorage<ResumeDoc[]>(STORAGE_KEY, []);
    const currentId = useLocalStorage<string>(CURRENT_KEY, '');

    // Repair anything persisted by an older build, and guarantee a seed doc.
    if (resumes.value.length) {
        resumes.value = resumes.value.map((r) => validate(r));
    }
    if (!resumes.value.length) {
        const seed = defaultResume();
        resumes.value = [seed];
        currentId.value = seed.id;
    } else if (!resumes.value.some((r) => r.id === currentId.value)) {
        currentId.value = resumes.value[0].id;
    }

    const current = computed<ResumeDoc>(
        () =>
            resumes.value.find((r) => r.id === currentId.value) ||
            resumes.value[0]
    );

    const touch = () => {
        if (current.value) current.value.updatedAt = Date.now();
    };

    // --- resume-level CRUD ---
    const createNew = (name = 'Untitled resume') => {
        const doc = defaultResume(name);
        resumes.value.unshift(doc);
        currentId.value = doc.id;
        return doc;
    };

    const selectResume = (id: string) => {
        if (resumes.value.some((r) => r.id === id)) currentId.value = id;
    };

    const duplicateResume = (id: string) => {
        const src = resumes.value.find((r) => r.id === id);
        if (!src) return;
        const copy = clone(src);
        copy.id = nanoid();
        copy.name = `${src.name} (copy)`;
        copy.updatedAt = Date.now();
        resumes.value.unshift(copy);
        currentId.value = copy.id;
    };

    const deleteResume = (id: string) => {
        resumes.value = resumes.value.filter((r) => r.id !== id);
        if (!resumes.value.length) {
            const seed = defaultResume();
            resumes.value = [seed];
            currentId.value = seed.id;
        } else if (currentId.value === id) {
            currentId.value = resumes.value[0].id;
        }
    };

    const importJsonResume = (input: unknown, name?: string) => {
        const doc = fromJsonResume(input, { name });
        resumes.value.unshift(doc);
        currentId.value = doc.id;
        return doc;
    };

    /** Replace the current resume wholesale (e.g. from a shared link). */
    const loadInto = (raw: unknown) => {
        const doc = validate(raw);
        doc.id = nanoid();
        resumes.value.unshift(doc);
        currentId.value = doc.id;
        return doc;
    };

    // --- section item helpers (mutate the active resume in place) ---
    const addItem = (section: SectionKey) => {
        (current.value[section] as any[]).push(blankItem(section));
        touch();
    };
    const removeItem = (section: SectionKey, index: number) => {
        (current.value[section] as any[]).splice(index, 1);
        touch();
    };

    const addCustomSection = () => {
        const cs: CustomSection = { id: nanoid(), title: 'New Section', items: [{ title: '', description: '' }] };
        current.value.meta.customSections.push(cs);
        touch();
    };
    const removeCustomSection = (id: string) => {
        current.value.meta.customSections = current.value.meta.customSections.filter((c) => c.id !== id);
        touch();
    };

    const setTemplate = (templateId: string) => {
        current.value.meta.template = templateId;
        touch();
    };

    const toggleSection = (key: SectionKey) => {
        const v = current.value.meta.sectionVisibility;
        v[key] = v[key] === false;
        touch();
    };

    return {
        resumes,
        currentId,
        current,
        touch,
        createNew,
        selectResume,
        duplicateResume,
        deleteResume,
        importJsonResume,
        loadInto,
        addItem,
        removeItem,
        addCustomSection,
        removeCustomSection,
        setTemplate,
        toggleSection,
    };
}

export function useResume() {
    if (!state) state = createState();
    return state;
}
