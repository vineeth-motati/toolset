<template>
    <TransitionRoot :show="isOpen" as="template" @after-leave="resetState">
        <Dialog class="relative z-[60]" @close="close">
            <TransitionChild
                as="template"
                enter="duration-150 ease-out"
                enter-from="opacity-0"
                enter-to="opacity-100"
                leave="duration-100 ease-in"
                leave-from="opacity-100"
                leave-to="opacity-0"
            >
                <div class="fixed inset-0 bg-gray-900/40" aria-hidden="true" />
            </TransitionChild>

            <div class="flex fixed inset-0 justify-center items-center p-4">
                <TransitionChild
                    as="template"
                    enter="duration-150 ease-out"
                    enter-from="opacity-0 scale-95"
                    enter-to="opacity-100 scale-100"
                    leave="duration-100 ease-in"
                    leave-from="opacity-100 scale-100"
                    leave-to="opacity-0 scale-95"
                >
                    <DialogPanel
                        class="p-6 w-full max-w-md bg-white rounded-xl border border-gray-200 shadow-2xl dark:bg-gray-800 dark:border-gray-700"
                    >
                        <DialogTitle
                            class="text-lg font-semibold text-gray-900 dark:text-gray-100"
                        >
                            Share link
                        </DialogTitle>
                        <p
                            class="mt-1 text-sm text-gray-500 dark:text-gray-400"
                        >
                            Anyone with this link can view a copy of the current
                            data.
                        </p>

                        <div v-if="qrDataUrl" class="flex justify-center mt-4">
                            <img
                                :src="qrDataUrl"
                                alt="QR code for the share link"
                                class="w-36 h-36 rounded-lg border border-gray-200 dark:border-gray-700"
                            />
                        </div>

                        <div class="flex gap-2 mt-4">
                            <input
                                :value="link"
                                readonly
                                class="flex-1 px-3 py-2 min-w-0 text-sm text-gray-700 bg-gray-50 rounded-lg border border-gray-300 focus:outline-none focus:border-primary-400 dark:bg-gray-900 dark:border-gray-600 dark:text-gray-200"
                                aria-label="Share link URL"
                                @focus="$event.target.select()"
                            />
                            <BaseButton
                                :icon="
                                    copied ? 'mdi:check' : 'mdi:content-copy'
                                "
                                :variant="copied ? 'secondary' : 'primary'"
                                @click="onCopy"
                            >
                                {{ copied ? 'Copied' : 'Copy' }}
                            </BaseButton>
                        </div>

                        <div
                            class="pt-4 mt-4 border-t border-gray-200 dark:border-gray-700"
                        >
                            <template v-if="!memorableLink">
                                <BaseButton
                                    variant="secondary"
                                    icon="mdi:message-text-outline"
                                    :disabled="creatingMemorable"
                                    @click="onCreateMemorable"
                                >
                                    {{
                                        creatingMemorable
                                            ? 'Creating…'
                                            : 'Create memorable link'
                                    }}
                                </BaseButton>
                                <p
                                    class="mt-2 text-xs text-gray-500 dark:text-gray-400"
                                >
                                    A short code you can read out loud, like
                                    <span class="font-mono"
                                        >/s/swift-otter-lake</span
                                    >. Stored on our server (readable by it,
                                    unlike the link above) and expires after 90
                                    days without being opened.
                                </p>
                                <p
                                    v-if="memorableError"
                                    class="mt-2 text-xs text-red-600 dark:text-red-400"
                                >
                                    Couldn't create a memorable link. Please try
                                    again.
                                </p>
                            </template>
                            <template v-else>
                                <p
                                    class="text-sm font-medium text-gray-700 dark:text-gray-300"
                                >
                                    Memorable link
                                </p>
                                <div class="flex gap-2 mt-2">
                                    <input
                                        :value="memorableLink"
                                        readonly
                                        class="flex-1 px-3 py-2 min-w-0 text-sm text-gray-700 bg-gray-50 rounded-lg border border-gray-300 focus:outline-none focus:border-primary-400 dark:bg-gray-900 dark:border-gray-600 dark:text-gray-200"
                                        aria-label="Memorable share link URL"
                                        @focus="$event.target.select()"
                                    />
                                    <BaseButton
                                        :icon="
                                            memorableCopied
                                                ? 'mdi:check'
                                                : 'mdi:content-copy'
                                        "
                                        :variant="
                                            memorableCopied
                                                ? 'secondary'
                                                : 'primary'
                                        "
                                        @click="onCopyMemorable"
                                    >
                                        {{
                                            memorableCopied ? 'Copied' : 'Copy'
                                        }}
                                    </BaseButton>
                                </div>
                                <p
                                    class="mt-2 text-xs text-gray-500 dark:text-gray-400"
                                >
                                    Expires 90 days after it was last opened.
                                </p>
                            </template>
                        </div>

                        <div class="flex justify-end mt-5">
                            <BaseButton variant="ghost" @click="close">
                                Close
                            </BaseButton>
                        </div>
                    </DialogPanel>
                </TransitionChild>
            </div>
        </Dialog>
    </TransitionRoot>
</template>

<script setup>
import { ref, watch } from 'vue';
import {
    Dialog,
    DialogPanel,
    DialogTitle,
    TransitionRoot,
    TransitionChild,
} from '@headlessui/vue';
import QRCode from 'qrcode';
import { useShareModal } from '@/composables/useShareModal';
import { useShareLink } from '@/composables/useShareLink';
import { copyText } from '@/composables/useCopy';

const { isOpen, link, close } = useShareModal();
const { createMemorableLink } = useShareLink();

const copied = ref(false);
const qrDataUrl = ref('');
const memorableLink = ref('');
const memorableCopied = ref(false);
const memorableError = ref(false);
const creatingMemorable = ref(false);

watch(link, async (url) => {
    qrDataUrl.value = url ? await QRCode.toDataURL(url) : '';
});

const onCopy = async () => {
    copied.value = await copyText(link.value);
};

const onCreateMemorable = async () => {
    creatingMemorable.value = true;
    memorableError.value = false;
    memorableLink.value = (await createMemorableLink(link.value)) || '';
    memorableError.value = !memorableLink.value;
    creatingMemorable.value = false;
};

const onCopyMemorable = async () => {
    memorableCopied.value = await copyText(memorableLink.value);
};

const resetState = () => {
    copied.value = false;
    memorableLink.value = '';
    memorableCopied.value = false;
    memorableError.value = false;
    creatingMemorable.value = false;
};
</script>
