<template>
    <div class="p-6 bg-white rounded-lg shadow">
        <h2 class="mb-4 text-xl font-semibold">API Key Management</h2>

        <!-- API Key is configured -->
        <div v-if="hasApiKey()" class="mb-6">
            <div
                class="p-4 mb-4 border border-green-200 rounded-lg bg-green-50"
            >
                <div class="flex items-center justify-between">
                    <div>
                        <p class="text-green-700">
                            <Icon
                                icon="line-md:confirm-circle-filled"
                                class="inline-block mr-1"
                            />
                            API Key is configured
                        </p>
                        <p class="mt-1 text-sm text-gray-600">
                            Your API key is securely stored in your browser.
                        </p>
                    </div>
                    <div class="flex gap-2">
                        <button
                            @click="showReplaceModal = true"
                            class="px-3 py-1 text-sm text-blue-600 border border-blue-200 rounded bg-blue-50 hover:bg-blue-100"
                        >
                            Replace
                        </button>
                        <button
                            @click="confirmDeleteKey"
                            class="px-3 py-1 text-sm text-red-600 border border-red-200 rounded bg-red-50 hover:bg-red-100"
                        >
                            Delete
                        </button>
                    </div>
                </div>
            </div>
        </div>

        <!-- No API Key configured -->
        <div v-else class="mb-6">
            <div
                class="p-4 mb-4 border border-yellow-200 rounded-lg bg-yellow-50"
            >
                <div>
                    <p class="text-yellow-700">
                        <Icon
                            icon="line-md:alert-circle-loop"
                            class="inline-block mr-1"
                        />
                        No API Key configured
                    </p>
                    <p class="mt-1 text-sm text-gray-600">
                        You need an API key to use the conversion tools.
                    </p>
                </div>
            </div>
            <button
                @click="showAddModal = true"
                class="px-4 py-2 text-white bg-blue-600 rounded-md hover:bg-blue-700"
            >
                <Icon icon="tabler:key" class="inline-block mr-1" />
                Add API Key
            </button>
        </div>

        <!-- Information button -->
        <button
            @click="showInfoModal = true"
            class="flex items-center mt-4 text-blue-600 hover:underline"
        >
            <Icon icon="tabler:info-circle" class="inline-block mr-1" />
            How to get an API Key
        </button>

        <!-- Add API Key Modal -->
        <Modal
            :is-open="showAddModal"
            title="Add API Key"
            confirm-text="Save"
            :show-confirm="!!newApiKey"
            @close="showAddModal = false"
            @confirm="addApiKey"
        >
            <div class="mb-4">
                <label class="block mb-1 text-sm font-medium text-gray-700"
                    >API Key</label
                >
                <input
                    v-model="newApiKey"
                    type="text"
                    class="w-full px-3 py-2 border border-gray-300 rounded-md"
                    placeholder="Enter your API key"
                />
            </div>
        </Modal>

        <!-- Replace API Key Modal -->
        <Modal
            :is-open="showReplaceModal"
            title="Replace API Key"
            confirm-text="Replace"
            :show-confirm="!!newApiKey"
            @close="showReplaceModal = false"
            @confirm="replaceApiKey"
        >
            <div class="mb-4">
                <label class="block mb-1 text-sm font-medium text-gray-700"
                    >New API Key</label
                >
                <input
                    v-model="newApiKey"
                    type="text"
                    class="w-full px-3 py-2 border border-gray-300 rounded-md"
                    placeholder="Enter your new API key"
                />
            </div>
        </Modal>

        <!-- Delete Confirmation Modal -->
        <Modal
            :is-open="showDeleteModal"
            title="Delete API Key?"
            confirm-text="Delete"
            @close="showDeleteModal = false"
            @confirm="deleteApiKey"
        >
            <p class="text-gray-600">
                Are you sure you want to delete your API key? You won't be able
                to use the conversion tools without an API key.
            </p>
        </Modal>

        <!-- API Key Information Modal -->
        <Modal
            :is-open="showInfoModal"
            title="How to get an API Key"
            confirm-text="Got it"
            :show-cancel="false"
            @close="showInfoModal = false"
            @confirm="showInfoModal = false"
        >
            <div class="text-sm text-gray-700">
                <ol class="ml-5 space-y-2 list-decimal">
                    <li>
                        Visit
                        <a
                            href="https://conversiontools.io"
                            target="_blank"
                            class="text-blue-600 hover:underline"
                            >ConversionTools.io</a
                        >
                    </li>
                    <li>Create an account or log in</li>
                    <li>Go to your Profile page</li>
                    <li>Find your API key in the API Access section</li>
                    <li>Copy and paste it here</li>
                </ol>
                <p class="mt-4 text-xs text-gray-500">
                    Note: The API key is stored locally in your browser and not
                    sent to our servers.
                </p>
            </div>
        </Modal>
    </div>
</template>

<script setup>
import { ref } from 'vue';
import { Icon } from '@iconify/vue';
import { useToast } from '@/composables/useToast';
import { useConverter } from '@/composables/useConverter';
import Modal from '@/components/ui/Modal.vue';

const { hasApiKey, saveApiKey, clearApiKey } = useConverter();
const toast = useToast();

// State
const showAddModal = ref(false);
const showReplaceModal = ref(false);
const showDeleteModal = ref(false);
const showInfoModal = ref(false);
const newApiKey = ref('');

// Methods
const addApiKey = () => {
    if (newApiKey.value) {
        saveApiKey(newApiKey.value);
        toast.success('API key saved successfully');
        showAddModal.value = false;
        newApiKey.value = '';
    }
};

const replaceApiKey = () => {
    if (newApiKey.value) {
        saveApiKey(newApiKey.value);
        toast.success('API key replaced successfully');
        showReplaceModal.value = false;
        newApiKey.value = '';
    }
};

const confirmDeleteKey = () => {
    showDeleteModal.value = true;
};

const deleteApiKey = () => {
    clearApiKey();
    toast.success('API key deleted successfully');
    showDeleteModal.value = false;
};
</script>
