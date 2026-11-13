<template>
    <TransitionRoot appear :show="isOpen" as="template">
        <Dialog as="div" @close="close" class="relative z-50">
            <TransitionChild
                as="template"
                enter="duration-300 ease-out"
                enter-from="opacity-0"
                enter-to="opacity-100"
                leave="duration-200 ease-in"
                leave-from="opacity-100"
                leave-to="opacity-0"
            >
                <div class="fixed inset-0 bg-gray-950/40 backdrop-blur-[2px]" />
            </TransitionChild>

            <div class="overflow-y-auto fixed inset-0">
                <div class="flex justify-center items-center p-4 min-h-full">
                    <TransitionChild
                        as="template"
                        enter="duration-300 ease-out"
                        enter-from="opacity-0 scale-95"
                        enter-to="opacity-100 scale-100"
                        leave="duration-200 ease-in"
                        leave-from="opacity-100 scale-100"
                        leave-to="opacity-0 scale-95"
                    >
                        <DialogPanel
                            class="overflow-hidden p-6 w-full max-w-md text-left align-middle bg-white rounded-2xl border shadow-pop transition-all transform border-gray-200/80 dark:bg-gray-800 dark:border-gray-700"
                        >
                            <DialogTitle
                                as="h3"
                                class="text-lg font-semibold tracking-tight leading-6 text-gray-900 dark:text-white"
                            >
                                {{ title }}
                            </DialogTitle>

                            <div class="mt-2 text-sm leading-6 text-gray-600 dark:text-gray-300">
                                <slot></slot>
                            </div>

                            <div class="flex gap-2 justify-end mt-6">
                                <BaseButton
                                    v-if="showCancel"
                                    variant="secondary"
                                    @click="close"
                                >
                                    Cancel
                                </BaseButton>
                                <BaseButton v-if="showConfirm" @click="confirm">
                                    {{ confirmText }}
                                </BaseButton>
                            </div>
                        </DialogPanel>
                    </TransitionChild>
                </div>
            </div>
        </Dialog>
    </TransitionRoot>
</template>

<script setup>
import {
    Dialog,
    DialogPanel,
    DialogTitle,
    TransitionChild,
    TransitionRoot,
} from '@headlessui/vue';

const props = defineProps({
    isOpen: Boolean,
    title: String,
    showCancel: {
        type: Boolean,
        default: true,
    },
    showConfirm: {
        type: Boolean,
        default: true,
    },
    confirmText: {
        type: String,
        default: 'Confirm',
    },
});

const emit = defineEmits(['close', 'confirm']);

const close = () => emit('close');
const confirm = () => emit('confirm');
</script>
