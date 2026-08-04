/**
 * Resume Builder state: a list of saved resumes + the active one, persisted to
 * localStorage (autosaved via VueUse's deep watch) and shareable via the
 * existing share-link pipeline. Thin wrapper — all heavy logic lives in the
 * pure modules under utils/resume/.
 *
 * On top of CRUD it owns two pieces of editor infrastructure the UI needs:
 *   - a snapshot undo/redo stack, scoped to the active resume
 *   - a save-status signal, so the header can say "All changes saved"
 */
import { computed, ref, watch } from 'vue';
import { useLocalStorage, useDebounceFn } from '@vueuse/core';
import { nanoid } from 'nanoid';
import { defaultResume, validate } from '~/utils/resume/schema';
import { fromJsonResume } from '~/utils/resume/jsonResume';
import { sampleResume } from '~/utils/resume/sample';
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

/** Snapshots are cheap (a resume is a few KB) but not free — cap the stack. */
const HISTORY_LIMIT = 60;

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
    const adopt = (doc: ResumeDoc) => {
        resumes.value.unshift(doc);
        currentId.value = doc.id;
        return doc;
    };

    const createNew = (name = 'Untitled resume') => adopt(defaultResume(name));

    const loadSample = (name = 'Example resume') => adopt(sampleResume(name));

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
        return adopt(copy);
    };

    const renameResume = (id: string, name: string) => {
        const r = resumes.value.find((x) => x.id === id);
        if (!r) return;
        r.name = name;
        r.updatedAt = Date.now();
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

    const importJsonResume = (input: unknown, name?: string) =>
        adopt(fromJsonResume(input, { name }));

    /** Replace the current resume wholesale (e.g. from a shared link). */
    const loadInto = (raw: unknown) => {
        const doc = validate(raw);
        doc.id = nanoid();
        return adopt(doc);
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
    const duplicateItem = (section: SectionKey, index: number) => {
        const list = current.value[section] as any[];
        const src = list[index];
        if (!src) return;
        list.splice(index + 1, 0, clone(src));
        touch();
    };
    /** Move an entry within its section; out-of-range indexes are ignored. */
    const moveItem = (section: SectionKey, from: number, to: number) => {
        const list = current.value[section] as any[];
        if (from === to || from < 0 || to < 0 || from >= list.length || to >= list.length) return;
        list.splice(to, 0, ...list.splice(from, 1));
        touch();
    };

    const addCustomSection = (title = 'New Section') => {
        const cs: CustomSection = { id: nanoid(), title, items: [{ title: '', description: '' }] };
        current.value.meta.customSections.push(cs);
        touch();
        return cs;
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
    const setSectionVisible = (key: SectionKey, visible: boolean) => {
        current.value.meta.sectionVisibility[key] = visible;
        touch();
    };
    const setSectionsOrder = (order: SectionKey[]) => {
        current.value.meta.sectionsOrder = order;
        touch();
    };

    // ------------------------------------------------------------- undo / redo
    // Snapshot-based: simple, and correct for a document this small. The stack
    // is per-resume, so switching resumes starts a fresh timeline.
    const history = ref<string[]>([]);
    const historyIndex = ref(-1);
    let restoring = false;

    const snapshot = () => JSON.stringify(current.value);

    const resetHistory = () => {
        history.value = current.value ? [snapshot()] : [];
        historyIndex.value = history.value.length - 1;
    };
    resetHistory();

    const pushHistory = () => {
        if (restoring || !current.value) return;
        const snap = snapshot();
        if (snap === history.value[historyIndex.value]) return;
        // Drop any redo branch, then append.
        history.value = history.value.slice(0, historyIndex.value + 1);
        history.value.push(snap);
        if (history.value.length > HISTORY_LIMIT) history.value.shift();
        historyIndex.value = history.value.length - 1;
    };

    const restore = (snap: string) => {
        const idx = resumes.value.findIndex((r) => r.id === currentId.value);
        if (idx === -1) return;
        restoring = true;
        resumes.value[idx] = validate(JSON.parse(snap));
        // Let the debounced recorder see `restoring` before it clears.
        setTimeout(() => {
            restoring = false;
        }, 0);
    };

    const canUndo = computed(() => historyIndex.value > 0);
    const canRedo = computed(() => historyIndex.value < history.value.length - 1);

    const undo = () => {
        if (!canUndo.value) return;
        historyIndex.value -= 1;
        restore(history.value[historyIndex.value]);
    };
    const redo = () => {
        if (!canRedo.value) return;
        historyIndex.value += 1;
        restore(history.value[historyIndex.value]);
    };

    // ---------------------------------------------------------- save indicator
    const saveState = ref<'saved' | 'saving'>('saved');
    const lastSavedAt = ref<number>(Date.now());

    const settle = useDebounceFn(() => {
        pushHistory();
        saveState.value = 'saved';
        lastSavedAt.value = Date.now();
    }, 600);

    watch(
        current,
        () => {
            if (restoring) return;
            saveState.value = 'saving';
            settle();
        },
        { deep: true }
    );

    // A different resume means a different timeline.
    watch(currentId, () => resetHistory());

    return {
        resumes,
        currentId,
        current,
        touch,
        createNew,
        loadSample,
        selectResume,
        duplicateResume,
        renameResume,
        deleteResume,
        importJsonResume,
        loadInto,
        addItem,
        removeItem,
        duplicateItem,
        moveItem,
        addCustomSection,
        removeCustomSection,
        setTemplate,
        toggleSection,
        setSectionVisible,
        setSectionsOrder,
        // editor infrastructure
        undo,
        redo,
        canUndo,
        canRedo,
        saveState,
        lastSavedAt,
    };
}

export function useResume() {
    if (!state) state = createState();
    return state;
}
