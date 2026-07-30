<template>
    <fieldset class="flex flex-col gap-1.5">
        <legend class="text-xs font-medium text-gray-600 dark:text-gray-400">
            {{ label }}
        </legend>

        <div v-if="!isPresent" class="grid grid-cols-[1.4fr_1fr] gap-1.5">
            <select
                :value="month"
                :aria-label="`${label} month`"
                :class="selectClass"
                @change="setMonth($event.target.value)"
            >
                <option value="">Month</option>
                <option v-for="m in MONTH_OPTIONS" :key="m.value" :value="m.value">
                    {{ m.label }}
                </option>
            </select>
            <select
                :value="year"
                :aria-label="`${label} year`"
                :class="selectClass"
                @change="setYear($event.target.value)"
            >
                <option value="">Year</option>
                <option v-for="y in years" :key="y" :value="y">{{ y }}</option>
            </select>
        </div>

        <label
            v-if="allowPresent"
            class="inline-flex gap-1.5 items-center text-xs text-gray-600 cursor-pointer select-none dark:text-gray-400"
        >
            <input
                type="checkbox"
                :checked="isPresent"
                class="w-3.5 h-3.5 rounded border-gray-300 text-primary-600 focus:ring-primary-400 dark:border-gray-600 dark:bg-gray-800"
                @change="togglePresent($event.target.checked)"
            />
            {{ presentLabel }}
        </label>
    </fieldset>
</template>

<script setup>
/**
 * Month + year pickers over the plain "YYYY-MM" strings the JSON Resume schema
 * stores. Free-text date fields were the single biggest source of junk reaching
 * the PDF — `fmtDate()` passes anything it can't parse straight through.
 */
import { computed, ref } from 'vue';
import { MONTH_OPTIONS, splitMonthValue, joinMonthValue, yearOptions } from '~/utils/resume/date';

const props = defineProps({
    label: { type: String, default: 'Date' },
    /** Renders an "I currently work here" checkbox; blank end date = Present. */
    allowPresent: { type: Boolean, default: false },
    presentLabel: { type: String, default: 'I currently work here' },
});

const model = defineModel({ type: String, default: '' });

const selectClass =
    'w-full rounded-lg border border-gray-300 bg-white px-2 py-1.5 text-sm text-gray-900 transition-colors focus:outline-none focus:border-primary-400 focus:ring-1 focus:ring-primary-400 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-100';

const parts = computed(() => splitMonthValue(model.value));
const month = computed(() => parts.value.month);
const year = computed(() => parts.value.year);

// Only meaningful for end dates: an empty value renders as "Present".
const isPresent = computed(() => props.allowPresent && !model.value.trim());

const years = yearOptions(new Date().getFullYear());

function setMonth(value) {
    model.value = joinMonthValue(year.value, value);
}
function setYear(value) {
    model.value = joinMonthValue(value, month.value);
}

// Remember what was there so unticking "current" doesn't wipe the user's date.
const stashed = ref('');
function togglePresent(checked) {
    if (checked) {
        stashed.value = model.value;
        model.value = '';
    } else {
        model.value = stashed.value || String(new Date().getFullYear());
    }
}
</script>
