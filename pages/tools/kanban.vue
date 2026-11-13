<template>
    <ToolLayout size="full" class="flex flex-col p-4 h-full">
        <template #actions>
            <BaseButton icon="mdi:share-variant" size="sm" @click="shareBoard">
                Share Board
            </BaseButton>
        </template>

        <div class="flex overflow-x-auto overflow-y-hidden flex-1 gap-4 pb-4">
            <div
                v-for="(column, index) in board"
                :key="index"
                class="flex flex-col p-3 w-72 max-h-full rounded-2xl surface-muted shrink-0"
            >
                <div class="flex items-center gap-2 px-1 mb-3">
                    <h3 class="text-sm font-semibold text-gray-900 dark:text-white">{{ column.title }}</h3>
                    <BaseBadge variant="neutral">{{ column.items.length }}</BaseBadge>
                </div>
                <draggable
                    v-model="column.items"
                    item-key="id"
                    group="tasks"
                    :animation="150"
                    class="overflow-y-auto flex-1 min-h-[200px]"
                >
                    <template #item="{ element }">
                        <div
                            class="p-3 mb-2 bg-white rounded-xl border shadow-xs transition cursor-grab border-gray-200/80 hover:shadow-lift active:cursor-grabbing dark:bg-gray-800 dark:border-gray-700/70"
                        >
                            <span class="text-sm text-gray-900 dark:text-gray-100">{{ element.text }}</span>
                            <div class="flex justify-end mt-2">
                                <button
                                    @click.stop="editTask(index, element)"
                                    class="mr-3 text-xs font-medium text-primary-600 hover:text-primary-700 dark:text-primary-400"
                                >
                                    Edit
                                </button>
                                <button
                                    @click.stop="deleteTask(index, element)"
                                    class="text-xs font-medium text-red-600 hover:text-red-700 dark:text-red-400"
                                >
                                    Delete
                                </button>
                            </div>
                        </div>
                    </template>
                </draggable>
                <button
                    @click="openNewTaskModal(index)"
                    class="flex gap-1.5 justify-center items-center px-3 py-2 mt-2 w-full text-sm font-medium text-gray-500 rounded-lg border border-dashed border-gray-300 transition hover:bg-white hover:text-gray-900 hover:border-gray-400 dark:border-gray-700 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-white"
                >
                    <Icon icon="lucide:plus" class="w-4 h-4" />
                    Add task
                </button>
            </div>
        </div>
        <!-- New Task Modal -->
        <Modal
            :is-open="isModalOpen"
            :title="isEditing ? 'Edit Task' : 'New Task'"
            @close="closeModal"
            @confirm="confirmTask"
        >
            <BaseTextarea
                v-model="newTaskText"
                label="Task Description"
                :rows="3"
            />
        </Modal>
    </ToolLayout>
</template>

<script setup>
import { Icon } from '@iconify/vue';
import draggable from 'vuedraggable';
import Modal from '@/components/ui/Modal.vue';
import { useLocalStorage } from '@vueuse/core';
import { nanoid } from 'nanoid';


const { generateShareLink, getSharedData } = useShareLink();
const toast = useToast();

const board = useLocalStorage('kanban', [
    { title: 'To Do', items: [] },
    { title: 'In Progress', items: [] },
    { title: 'Done', items: [] },
    { title: 'Archived', items: [] },
]);

const isModalOpen = ref(false);
const newTaskText = ref('');
const activeColumnIndex = ref(0);
const isEditing = ref(false);
const activeTask = ref(null);

// Older boards (and shared payloads) may contain tasks without ids; the
// draggable list is keyed by id, so backfill them.
const ensureTaskIds = (columns) => {
    if (!Array.isArray(columns)) return columns;
    columns.forEach((column) => {
        (column?.items || []).forEach((task) => {
            if (task && !task.id) task.id = nanoid();
        });
    });
    return columns;
};

onMounted(async () => {
    ensureTaskIds(board.value);
    const shared = await getSharedData();
    if (shared?.kanban) {
        board.value = ensureTaskIds(shared.kanban);
    }
});

const openNewTaskModal = (columnIndex) => {
    activeColumnIndex.value = columnIndex;
    isEditing.value = false;
    newTaskText.value = '';
    isModalOpen.value = true;
};

const editTask = (columnIndex, task) => {
    activeColumnIndex.value = columnIndex;
    activeTask.value = task;
    newTaskText.value = task.text;
    isEditing.value = true;
    isModalOpen.value = true;
};

const deleteTask = (columnIndex, task) => {
    board.value[columnIndex].items = board.value[columnIndex].items.filter(
        (t) => t !== task
    );
    toast.success('Task deleted successfully');
};

const closeModal = () => {
    isModalOpen.value = false;
    newTaskText.value = '';
    activeTask.value = null;
};

const confirmTask = () => {
    if (!newTaskText.value.trim()) {
        toast.error('Please enter a task description');
        return;
    }

    if (isEditing.value && activeTask.value) {
        activeTask.value.text = newTaskText.value;
        toast.success('Task updated successfully');
    } else {
        board.value[activeColumnIndex.value].items.push({
            id: nanoid(),
            text: newTaskText.value,
        });
        toast.success('Task added successfully');
    }

    closeModal();
};

const shareBoard = async () => {
    const link = await generateShareLink('/tools/kanban', {
        kanban: board.value,
    });
    if (link) {
        showShareModal(link);
    } else {
        toast.error('Failed to generate share link');
    }
};
</script>
