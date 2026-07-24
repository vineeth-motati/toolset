<template>
    <div class="p-4 space-y-4">
        <!-- Basics -->
        <BaseCard padding="sm">
            <h3 class="flex gap-2 items-center mb-3 text-sm font-semibold text-gray-900 dark:text-gray-100">
                <Icon icon="mdi:account-outline" class="w-4 h-4" /> Personal details
            </h3>
            <div class="grid grid-cols-2 gap-3">
                <BaseInput v-model="b.name" label="Full name" placeholder="Jane Doe" />
                <BaseInput v-model="b.label" label="Headline" placeholder="Senior Frontend Engineer" />
                <BaseInput v-model="b.email" label="Email" type="email" placeholder="jane@example.com" />
                <BaseInput v-model="b.phone" label="Phone" placeholder="+1 555 000 1234" />
                <BaseInput v-model="b.url" label="Website" placeholder="https://jane.dev" />
                <BaseInput v-model="b.location.city" label="City" placeholder="Berlin" />
                <BaseInput v-model="b.location.region" label="Region/State" placeholder="Berlin" />
                <BaseInput v-model="b.location.countryCode" label="Country" placeholder="DE" />
            </div>
            <BaseTextarea
                v-model="b.summary"
                label="Professional summary"
                class="mt-3"
                :rows="3"
                placeholder="2–3 lines summarizing your experience and strengths…"
            />

            <!-- Profiles -->
            <div class="mt-3">
                <label class="block mb-1.5 text-xs font-medium text-gray-600 dark:text-gray-400">
                    Profiles (LinkedIn, GitHub…)
                </label>
                <div
                    v-for="(p, i) in b.profiles"
                    :key="i"
                    class="grid grid-cols-[1fr_1fr_auto] gap-1.5 items-start mb-1.5"
                >
                    <BaseInput v-model="p.network" placeholder="LinkedIn" />
                    <BaseInput v-model="p.username" placeholder="jane-doe" />
                    <BaseIconButton icon="mdi:close" label="Remove profile" variant="danger" @click="b.profiles.splice(i, 1)" />
                </div>
                <button type="button" class="inline-flex gap-1 items-center text-xs font-medium text-primary-600 hover:text-primary-700 dark:text-primary-400" @click="addProfile">
                    <Icon icon="mdi:plus" class="w-4 h-4" /> Add profile
                </button>
            </div>
        </BaseCard>

        <p class="px-1 text-xs text-gray-400">Drag <Icon icon="mdi:drag" class="inline w-3.5 h-3.5" /> to reorder sections · toggle the eye to hide a section from the PDF.</p>

        <!-- Standard sections (reorderable) -->
        <draggable
            v-model="order"
            :item-key="(el) => el"
            handle=".section-handle"
            :animation="150"
            class="space-y-4"
        >
            <template #item="{ element: key }">
                <BaseCard padding="sm" :class="{ 'opacity-60': doc.meta.sectionVisibility[key] === false }">
                    <div class="flex justify-between items-center mb-3">
                        <h3 class="flex gap-2 items-center text-sm font-semibold text-gray-900 dark:text-gray-100">
                            <Icon icon="mdi:drag" class="w-4 h-4 text-gray-400 cursor-grab section-handle" />
                            <Icon :icon="meta[key].icon" class="w-4 h-4" />
                            {{ meta[key].label }}
                            <span class="text-xs font-normal text-gray-400">({{ doc[key].length }})</span>
                        </h3>
                        <div class="flex gap-1 items-center">
                            <BaseIconButton
                                :icon="doc.meta.sectionVisibility[key] === false ? 'mdi:eye-off-outline' : 'mdi:eye-outline'"
                                :label="doc.meta.sectionVisibility[key] === false ? 'Show section' : 'Hide section'"
                                @click="resume.toggleSection(key)"
                            />
                            <BaseButton size="sm" variant="secondary" icon="mdi:plus" @click="resume.addItem(key)">
                                Add {{ meta[key].itemNoun }}
                            </BaseButton>
                        </div>
                    </div>

                    <div v-if="doc[key].length" class="space-y-3">
                        <div
                            v-for="(item, i) in doc[key]"
                            :key="i"
                            class="p-3 rounded-lg border border-gray-100 dark:border-gray-700/60"
                        >
                            <div class="flex justify-end mb-1">
                                <BaseIconButton icon="mdi:trash-can-outline" label="Delete entry" variant="danger" @click="resume.removeItem(key, i)" />
                            </div>

                            <!-- work -->
                            <template v-if="key === 'work'">
                                <div class="grid grid-cols-2 gap-3">
                                    <BaseInput v-model="item.position" label="Title" placeholder="Frontend Engineer" />
                                    <BaseInput v-model="item.name" label="Company" placeholder="Acme Inc." />
                                    <BaseInput v-model="item.startDate" label="Start" placeholder="2021-03" />
                                    <BaseInput v-model="item.endDate" label="End" placeholder="Present" />
                                    <BaseInput v-model="item.location" label="Location" placeholder="Remote" />
                                </div>
                                <BaseTextarea v-model="item.summary" label="Summary" class="mt-3" :rows="2" />
                                <StringListInput v-model="item.highlights" label="Highlights" class="mt-3" placeholder="Increased X by Y% by…" add-label="Add highlight" />
                            </template>

                            <!-- education -->
                            <template v-else-if="key === 'education'">
                                <div class="grid grid-cols-2 gap-3">
                                    <BaseInput v-model="item.institution" label="Institution" placeholder="MIT" />
                                    <BaseInput v-model="item.studyType" label="Degree" placeholder="B.Sc." />
                                    <BaseInput v-model="item.area" label="Field" placeholder="Computer Science" />
                                    <BaseInput v-model="item.score" label="Grade/GPA" placeholder="3.9" />
                                    <BaseInput v-model="item.startDate" label="Start" placeholder="2016" />
                                    <BaseInput v-model="item.endDate" label="End" placeholder="2020" />
                                </div>
                                <StringListInput v-model="item.courses" label="Relevant courses" class="mt-3" add-label="Add course" />
                            </template>

                            <!-- skills -->
                            <template v-else-if="key === 'skills'">
                                <div class="grid grid-cols-2 gap-3">
                                    <BaseInput v-model="item.name" label="Group" placeholder="Languages" />
                                    <BaseInput v-model="item.level" label="Level (optional)" placeholder="Advanced" />
                                </div>
                                <StringListInput v-model="item.keywords" label="Skills" class="mt-3" placeholder="TypeScript" add-label="Add skill" />
                            </template>

                            <!-- projects -->
                            <template v-else-if="key === 'projects'">
                                <div class="grid grid-cols-2 gap-3">
                                    <BaseInput v-model="item.name" label="Name" placeholder="Toolset" />
                                    <BaseInput v-model="item.url" label="URL" placeholder="https://…" />
                                </div>
                                <BaseTextarea v-model="item.description" label="Description" class="mt-3" :rows="2" />
                                <StringListInput v-model="item.highlights" label="Highlights" class="mt-3" add-label="Add highlight" />
                            </template>

                            <!-- certificates -->
                            <template v-else-if="key === 'certificates'">
                                <div class="grid grid-cols-2 gap-3">
                                    <BaseInput v-model="item.name" label="Name" placeholder="AWS Solutions Architect" />
                                    <BaseInput v-model="item.issuer" label="Issuer" placeholder="Amazon" />
                                    <BaseInput v-model="item.date" label="Date" placeholder="2023-06" />
                                    <BaseInput v-model="item.url" label="URL" placeholder="https://…" />
                                </div>
                            </template>

                            <!-- awards -->
                            <template v-else-if="key === 'awards'">
                                <div class="grid grid-cols-2 gap-3">
                                    <BaseInput v-model="item.title" label="Title" placeholder="Employee of the Year" />
                                    <BaseInput v-model="item.awarder" label="Awarder" placeholder="Acme Inc." />
                                    <BaseInput v-model="item.date" label="Date" placeholder="2022" />
                                </div>
                                <BaseTextarea v-model="item.summary" label="Summary" class="mt-3" :rows="2" />
                            </template>

                            <!-- languages -->
                            <template v-else-if="key === 'languages'">
                                <div class="grid grid-cols-2 gap-3">
                                    <BaseInput v-model="item.language" label="Language" placeholder="English" />
                                    <BaseInput v-model="item.fluency" label="Fluency" placeholder="Native" />
                                </div>
                            </template>

                            <!-- interests -->
                            <template v-else-if="key === 'interests'">
                                <BaseInput v-model="item.name" label="Interest" placeholder="Photography" />
                                <StringListInput v-model="item.keywords" label="Keywords" class="mt-3" add-label="Add keyword" />
                            </template>

                            <!-- references -->
                            <template v-else-if="key === 'references'">
                                <BaseInput v-model="item.name" label="Name" placeholder="John Smith — Manager, Acme" />
                                <BaseTextarea v-model="item.reference" label="Reference" class="mt-3" :rows="2" />
                            </template>
                        </div>
                    </div>
                    <p v-else class="py-2 text-xs italic text-gray-400">
                        No {{ meta[key].itemNoun }}s yet — click “Add {{ meta[key].itemNoun }}”.
                    </p>
                </BaseCard>
            </template>
        </draggable>

        <!-- Custom sections -->
        <BaseCard v-for="cs in doc.meta.customSections" :key="cs.id" padding="sm">
            <div class="flex gap-2 items-center mb-3">
                <BaseInput v-model="cs.title" class="flex-1" placeholder="Custom section title" />
                <BaseButton size="sm" variant="secondary" icon="mdi:plus" @click="cs.items.push({ title: '', description: '' })">Add</BaseButton>
                <BaseIconButton icon="mdi:trash-can-outline" label="Delete section" variant="danger" @click="resume.removeCustomSection(cs.id)" />
            </div>
            <div
                v-for="(it, i) in cs.items"
                :key="i"
                class="p-3 mb-2 rounded-lg border border-gray-100 dark:border-gray-700/60"
            >
                <div class="flex justify-end mb-1">
                    <BaseIconButton icon="mdi:close" label="Remove item" variant="danger" @click="cs.items.splice(i, 1)" />
                </div>
                <BaseInput v-model="it.title" label="Title" />
                <BaseTextarea v-model="it.description" label="Description" class="mt-2" :rows="2" />
            </div>
        </BaseCard>

        <BaseButton variant="ghost" icon="mdi:plus-box-outline" @click="resume.addCustomSection()">
            Add custom section
        </BaseButton>
    </div>
</template>

<script setup>
import { computed } from 'vue';
import { Icon } from '@iconify/vue';
import draggable from 'vuedraggable';
import { useResume } from '~/composables/useResume';
import { SECTION_META } from '~/utils/resume/schema';
import StringListInput from '~/components/resume/StringListInput.vue';

const resume = useResume();
const doc = resume.current;
const b = computed(() => doc.value.basics);
const meta = SECTION_META;

// draggable needs a mutable array bound via v-model.
const order = computed({
    get: () => doc.value.meta.sectionsOrder,
    set: (val) => {
        doc.value.meta.sectionsOrder = val;
        resume.touch();
    },
});

function addProfile() {
    b.value.profiles.push({ network: '', username: '', url: '' });
    resume.touch();
}
</script>
