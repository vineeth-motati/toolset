<template>
    <div class="space-y-5">
        <section>
            <h3 class="mb-2 text-xs font-semibold tracking-wide text-gray-500 uppercase dark:text-gray-400">
                Identity
            </h3>
            <div class="grid gap-3 sm:grid-cols-2">
                <BaseInput
                    v-model="b.name"
                    label="Full name"
                    placeholder="Avery Chen"
                    required
                    :error="b.name.trim() ? null : 'Needed for the header and filename'"
                />
                <BaseInput
                    v-model="b.label"
                    label="Headline"
                    placeholder="Senior Frontend Engineer"
                    hint="Match the title on the job posting"
                />
            </div>
        </section>

        <section>
            <h3 class="mb-2 text-xs font-semibold tracking-wide text-gray-500 uppercase dark:text-gray-400">
                Contact
            </h3>
            <div class="grid gap-3 sm:grid-cols-2">
                <BaseInput
                    v-model="b.email"
                    label="Email"
                    type="email"
                    icon="mdi:email-outline"
                    placeholder="avery@example.com"
                    :error="emailError"
                />
                <BaseInput
                    v-model="b.phone"
                    label="Phone"
                    icon="mdi:phone-outline"
                    placeholder="+1 415 555 0142"
                />
                <BaseInput
                    v-model="b.url"
                    label="Website"
                    icon="mdi:web"
                    placeholder="https://averychen.dev"
                />
                <div class="grid grid-cols-2 gap-1.5 sm:grid-cols-[1.4fr_1fr_0.8fr]">
                    <BaseInput v-model="b.location.city" label="City" placeholder="San Francisco" />
                    <BaseInput v-model="b.location.region" label="State" placeholder="CA" />
                    <BaseInput v-model="b.location.countryCode" label="Country" placeholder="US" />
                </div>
            </div>
        </section>

        <section>
            <div class="flex justify-between items-baseline mb-2">
                <h3 class="text-xs font-semibold tracking-wide text-gray-500 uppercase dark:text-gray-400">
                    Professional summary
                </h3>
                <span class="text-[11px] tabular-nums" :class="summaryTone">
                    {{ summaryWords }} words
                    <span class="text-gray-400">· aim for 40–60</span>
                </span>
            </div>
            <BaseTextarea
                v-model="b.summary"
                :rows="4"
                placeholder="Frontend engineer with 8 years building design systems and high-traffic web apps…"
            />
            <div class="flex flex-wrap gap-1 mt-1.5">
                <button
                    v-for="s in SUMMARY_STARTERS"
                    :key="s"
                    type="button"
                    class="px-2 py-0.5 text-[11px] text-gray-600 bg-gray-100 rounded transition-colors hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600"
                    title="Insert this opener"
                    @click="useStarter(s)"
                >
                    {{ s }}
                </button>
            </div>
        </section>

        <section>
            <div class="flex justify-between items-center mb-2">
                <h3 class="text-xs font-semibold tracking-wide text-gray-500 uppercase dark:text-gray-400">
                    Profiles
                </h3>
                <BaseButton size="sm" variant="secondary" icon="mdi:plus" @click="addProfile">
                    Add profile
                </BaseButton>
            </div>

            <p v-if="!b.profiles.length" class="py-3 text-xs italic text-gray-400">
                No profiles yet — LinkedIn and GitHub links are the two recruiters click.
            </p>

            <div
                v-for="(p, i) in b.profiles"
                :key="i"
                class="grid grid-cols-[minmax(0,7rem)_minmax(0,1fr)_auto] gap-1.5 items-center mb-1.5"
            >
                <select
                    v-model="p.network"
                    aria-label="Network"
                    class="px-2 py-2 w-full text-sm text-gray-900 bg-white rounded-lg border border-gray-300 focus:outline-none focus:border-primary-400 focus:ring-1 focus:ring-primary-400 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-100"
                    @change="syncUrl(p)"
                >
                    <option v-for="n in NETWORKS" :key="n" :value="n">{{ n }}</option>
                </select>
                <BaseInput
                    :model-value="p.username"
                    placeholder="averychen"
                    @update:model-value="(v) => { p.username = v; syncUrl(p); }"
                />
                <BaseIconButton
                    icon="mdi:close"
                    label="Remove profile"
                    variant="danger"
                    @click="removeProfile(i)"
                />
            </div>
            <p v-if="b.profiles.length" class="text-[11px] text-gray-400">
                The link is built for you — LinkedIn, GitHub and X resolve to their canonical URLs.
            </p>
        </section>
    </div>
</template>

<script setup>
/**
 * Personal details. Split into labelled groups (Identity / Contact / Summary /
 * Profiles) rather than one 8-cell grid, so scanning it matches the order a
 * recruiter reads the finished page.
 */
import { computed } from 'vue';
import { useResume } from '~/composables/useResume';
import { SUMMARY_STARTERS } from '~/utils/resume/content';

const resume = useResume();
const doc = resume.current;
const b = computed(() => doc.value.basics);

const NETWORKS = ['LinkedIn', 'GitHub', 'X', 'Portfolio', 'Dribbble', 'Behance', 'Stack Overflow', 'Other'];

/** Canonical profile URLs, so a bare username still exports a working link. */
const URL_TEMPLATES = {
    LinkedIn: (u) => `https://linkedin.com/in/${u}`,
    GitHub: (u) => `https://github.com/${u}`,
    X: (u) => `https://x.com/${u}`,
    Dribbble: (u) => `https://dribbble.com/${u}`,
    Behance: (u) => `https://behance.net/${u}`,
};

const emailError = computed(() => {
    const v = b.value.email.trim();
    if (!v) return null;
    return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v) ? null : 'That does not look like an email address';
});

const summaryWords = computed(() => {
    const t = b.value.summary.trim();
    return t ? t.split(/\s+/).length : 0;
});
const summaryTone = computed(() => {
    const n = summaryWords.value;
    if (!n) return 'text-gray-400';
    return n >= 30 && n <= 70
        ? 'text-green-600 dark:text-green-400'
        : 'text-amber-600 dark:text-amber-400';
});

function useStarter(text) {
    b.value.summary = b.value.summary.trim()
        ? `${text} ${b.value.summary.trim()}`
        : text;
    resume.touch();
}

function addProfile() {
    b.value.profiles.push({ network: 'LinkedIn', username: '', url: '' });
    resume.touch();
}
function removeProfile(i) {
    b.value.profiles.splice(i, 1);
    resume.touch();
}
function syncUrl(p) {
    const build = URL_TEMPLATES[p.network];
    // Only overwrite URLs we generated — a hand-typed one is left alone.
    const wasGenerated = !p.url || Object.values(URL_TEMPLATES).some((f) => p.url === f(p.username) || /^https?:\/\/(www\.)?(linkedin|github|x|dribbble|behance)\./.test(p.url));
    if (build && p.username && wasGenerated) p.url = build(p.username.trim());
    resume.touch();
}
</script>
