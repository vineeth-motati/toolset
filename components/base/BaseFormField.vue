<template>
    <div class="flex flex-col gap-1.5">
        <label
            v-if="label"
            :for="fieldId"
            class="text-sm font-medium text-gray-700 dark:text-gray-300"
        >
            {{ label }}<span v-if="required" class="text-red-500"> *</span>
        </label>
        <slot />
        <p v-if="error" class="text-xs text-red-600 dark:text-red-400">
            {{ error }}
        </p>
        <p v-else-if="hint" class="text-xs text-gray-500 dark:text-gray-400">
            {{ hint }}
        </p>
    </div>
</template>

<script setup>
defineProps({
    label: { type: String, default: null },
    fieldId: { type: String, default: null },
    hint: { type: String, default: null },
    error: { type: String, default: null },
    required: { type: Boolean, default: false },
});
</script>
