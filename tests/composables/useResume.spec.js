/**
 * Resume Builder store (composables/useResume.ts). It's a module-level
 * singleton over useLocalStorage, so each test resets the module registry and
 * clears storage to get a fresh, isolated instance.
 */
import { describe, it, expect, beforeEach, vi } from 'vitest';

let mod;
beforeEach(async () => {
    vi.resetModules();
    localStorage.clear();
    mod = await import('@/composables/useResume');
});

const flush = () => new Promise((r) => setTimeout(r, 20));
// Edits are coalesced into one undo step by a 600ms debounce, so history
// assertions have to wait for that window to close.
const settle = () => new Promise((r) => setTimeout(r, 700));

describe('seeding + singleton', () => {
    it('seeds exactly one default resume and selects it', () => {
        const r = mod.useResume();
        expect(r.resumes.value).toHaveLength(1);
        expect(r.currentId.value).toBe(r.resumes.value[0].id);
        expect(r.current.value.meta.template).toBe('classic');
    });

    it('shares one instance across calls', () => {
        expect(mod.useResume()).toBe(mod.useResume());
        const a = mod.useResume();
        const b = mod.useResume();
        a.current.value.basics.name = 'Zed';
        expect(b.current.value.basics.name).toBe('Zed');
    });
});

describe('resume CRUD', () => {
    it('createNew unshifts and selects the new resume', () => {
        const r = mod.useResume();
        r.createNew('Second');
        expect(r.resumes.value).toHaveLength(2);
        expect(r.resumes.value[0].name).toBe('Second');
        expect(r.current.value.name).toBe('Second');
    });

    it('selectResume switches current and ignores unknown ids', () => {
        const r = mod.useResume();
        r.createNew('A');
        r.createNew('B');
        const a = r.resumes.value.find((x) => x.name === 'A');
        r.selectResume(a.id);
        expect(r.current.value.name).toBe('A');
        r.selectResume('does-not-exist');
        expect(r.current.value.name).toBe('A');
    });

    it('duplicateResume deep-copies with a new id and "(copy)" name', () => {
        const r = mod.useResume();
        r.current.value.name = 'Orig CV';
        r.current.value.basics.name = 'Orig';
        const origId = r.currentId.value;
        r.duplicateResume(origId);
        expect(r.resumes.value).toHaveLength(2);
        const copy = r.current.value;
        expect(copy.id).not.toBe(origId);
        expect(copy.name).toBe('Orig CV (copy)');
        expect(copy.basics.name).toBe('Orig');
        // independent copy
        copy.basics.name = 'Changed';
        expect(r.resumes.value.find((x) => x.id === origId).basics.name).toBe('Orig');
    });

    it('deleteResume removes and reseeds when the last one goes', () => {
        const r = mod.useResume();
        const only = r.resumes.value[0].id;
        r.deleteResume(only);
        expect(r.resumes.value).toHaveLength(1);
        expect(r.resumes.value[0].id).not.toBe(only);
    });

    it('deleteResume switches current when the active resume is removed', () => {
        const r = mod.useResume();
        r.createNew('A');
        const aId = r.currentId.value;
        r.createNew('B');
        expect(r.currentId.value).not.toBe(aId);
        r.deleteResume(r.currentId.value); // delete B (current)
        expect(r.resumes.value.some((x) => x.name === 'B')).toBe(false);
        expect(r.current.value).toBeTruthy();
    });
});

describe('import + share load', () => {
    it('importJsonResume adds and selects a parsed resume', () => {
        const r = mod.useResume();
        r.importJsonResume({ basics: { name: 'Imported' } }, 'Imp');
        expect(r.current.value.basics.name).toBe('Imported');
        expect(r.current.value.name).toBe('Imp');
        expect(r.resumes.value[0]).toBe(r.current.value);
    });

    it('loadInto validates and assigns a fresh id', () => {
        const r = mod.useResume();
        const doc = r.loadInto({ basics: { name: 'Shared' }, id: 'old-id' });
        expect(doc.basics.name).toBe('Shared');
        expect(doc.id).not.toBe('old-id');
        expect(r.currentId.value).toBe(doc.id);
    });
});

describe('section + item mutations', () => {
    it('addItem/removeItem use the right blank shape', () => {
        const r = mod.useResume();
        r.addItem('work');
        expect(r.current.value.work).toHaveLength(1);
        expect(r.current.value.work[0]).toHaveProperty('position', '');
        expect(r.current.value.work[0].highlights).toEqual(['']);
        r.removeItem('work', 0);
        expect(r.current.value.work).toHaveLength(0);
    });

    it('blankItem returns a correct shape per section', () => {
        expect(mod.blankItem('education')).toHaveProperty('institution', '');
        expect(mod.blankItem('skills').keywords).toEqual([]);
        expect(mod.blankItem('languages')).toEqual({ language: '', fluency: '' });
        expect(mod.blankItem('references')).toEqual({ name: '', reference: '' });
    });

    it('adds and removes custom sections', () => {
        const r = mod.useResume();
        r.addCustomSection();
        expect(r.current.value.meta.customSections).toHaveLength(1);
        const id = r.current.value.meta.customSections[0].id;
        r.removeCustomSection(id);
        expect(r.current.value.meta.customSections).toHaveLength(0);
    });

    it('setTemplate and toggleSection update meta', () => {
        const r = mod.useResume();
        r.setTemplate('modern');
        expect(r.current.value.meta.template).toBe('modern');
        expect(r.current.value.meta.sectionVisibility.work).toBe(true);
        r.toggleSection('work');
        expect(r.current.value.meta.sectionVisibility.work).toBe(false);
        r.toggleSection('work');
        expect(r.current.value.meta.sectionVisibility.work).toBe(true);
    });
});

describe('entry reordering + duplication', () => {
    it('moveItem reorders within a section', () => {
        const r = mod.useResume();
        r.addItem('work');
        r.addItem('work');
        r.current.value.work[0].position = 'First';
        r.current.value.work[1].position = 'Second';
        r.moveItem('work', 1, 0);
        expect(r.current.value.work.map((w) => w.position)).toEqual(['Second', 'First']);
    });

    it('moveItem ignores out-of-range and no-op moves', () => {
        const r = mod.useResume();
        r.addItem('work');
        r.current.value.work[0].position = 'Only';
        r.moveItem('work', 0, 0);
        r.moveItem('work', 0, 5);
        r.moveItem('work', -1, 0);
        expect(r.current.value.work.map((w) => w.position)).toEqual(['Only']);
    });

    it('duplicateItem inserts an independent copy right after the source', () => {
        const r = mod.useResume();
        r.addItem('work');
        r.current.value.work[0].position = 'Engineer';
        r.duplicateItem('work', 0);
        expect(r.current.value.work).toHaveLength(2);
        expect(r.current.value.work[1].position).toBe('Engineer');
        r.current.value.work[1].position = 'Changed';
        expect(r.current.value.work[0].position).toBe('Engineer');
    });

    it('duplicateItem ignores an unknown index', () => {
        const r = mod.useResume();
        r.duplicateItem('work', 3);
        expect(r.current.value.work).toHaveLength(0);
    });
});

describe('rename + sample + visibility', () => {
    it('renameResume renames by id and ignores unknown ids', () => {
        const r = mod.useResume();
        r.renameResume(r.currentId.value, 'Backend application');
        expect(r.current.value.name).toBe('Backend application');
        r.renameResume('nope', 'ignored');
        expect(r.current.value.name).toBe('Backend application');
    });

    it('loadSample adds a populated resume and selects it', () => {
        const r = mod.useResume();
        r.loadSample('Example');
        expect(r.current.value.name).toBe('Example');
        expect(r.current.value.basics.name).toBeTruthy();
        expect(r.current.value.work.length).toBeGreaterThan(0);
    });

    it('setSectionVisible sets an explicit value', () => {
        const r = mod.useResume();
        r.setSectionVisible('projects', false);
        expect(r.current.value.meta.sectionVisibility.projects).toBe(false);
        r.setSectionVisible('projects', true);
        expect(r.current.value.meta.sectionVisibility.projects).toBe(true);
    });

    it('setSectionsOrder replaces the order', () => {
        const r = mod.useResume();
        const reversed = [...r.current.value.meta.sectionsOrder].reverse();
        r.setSectionsOrder(reversed);
        expect(r.current.value.meta.sectionsOrder).toEqual(reversed);
    });
});

describe('undo / redo', () => {
    it('starts with nothing to undo or redo', () => {
        const r = mod.useResume();
        expect(r.canUndo.value).toBe(false);
        expect(r.canRedo.value).toBe(false);
    });

    it('undoes and redoes an edit once it has settled', async () => {
        const r = mod.useResume();
        r.current.value.basics.name = 'First';
        await settle();
        expect(r.canUndo.value).toBe(true);

        r.undo();
        await flush();
        expect(r.current.value.basics.name).toBe('');
        expect(r.canRedo.value).toBe(true);

        r.redo();
        await flush();
        expect(r.current.value.basics.name).toBe('First');
    });

    it('drops the redo branch after a new edit', async () => {
        const r = mod.useResume();
        r.current.value.basics.name = 'A';
        await settle();
        r.undo();
        await flush();
        expect(r.canRedo.value).toBe(true);

        r.current.value.basics.name = 'B';
        await settle();
        expect(r.canRedo.value).toBe(false);
        expect(r.current.value.basics.name).toBe('B');
    });

    it('reports the save state while an edit settles', async () => {
        const r = mod.useResume();
        expect(r.saveState.value).toBe('saved');
        r.current.value.basics.name = 'Typing';
        await flush();
        expect(r.saveState.value).toBe('saving');
        await settle();
        expect(r.saveState.value).toBe('saved');
    });
});

describe('persistence + repair', () => {
    it('persists edits to localStorage', async () => {
        const r = mod.useResume();
        r.current.value.basics.name = 'Persisted';
        await flush();
        expect(localStorage.getItem('resume-builder')).toContain('Persisted');
    });

    it('repairs partial/legacy data on load and fixes a stale currentId', async () => {
        vi.resetModules();
        localStorage.clear();
        localStorage.setItem(
            'resume-builder',
            JSON.stringify([{ basics: { name: 'Legacy' }, work: [{ position: 'Dev' }] }])
        );
        localStorage.setItem('resume-builder-current', 'stale');
        const m2 = await import('@/composables/useResume');
        const r = m2.useResume();
        expect(r.resumes.value[0].basics.name).toBe('Legacy');
        expect(r.resumes.value[0].work[0].position).toBe('Dev');
        expect(r.resumes.value[0].work[0].highlights).toEqual([]); // repaired
        expect(r.resumes.value[0].meta.template).toBe('classic'); // filled
        expect(r.currentId.value).toBe(r.resumes.value[0].id); // stale id fixed
    });
});
