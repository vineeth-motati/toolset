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
                class="p-4 w-72 bg-gray-100 rounded-lg shrink-0 dark:bg-gray-800"
            >
                <h3 class="mb-4 font-semibold text-gray-900 dark:text-gray-100">{{ column.title }}</h3>
                <draggable
                    v-model="column.items"
                    item-key="id"
                    group="tasks"
                    :animation="150"
                    class="min-h-[200px]"
                >
                    <template #item="{ element }">
                        <div
                            class="p-3 mb-2 bg-white rounded shadow cursor-move dark:bg-gray-700"
                        >
                            <span class="text-gray-900 dark:text-gray-100">{{ element.text }}</span>
                            <div class="flex justify-end mt-2">
                                <button
                                    @click.stop="editTask(index, element)"
                                    class="mr-2 text-primary-600 dark:text-primary-400"
                                >
                                    Edit
                                </button>
                                <button
                                    @click.stop="deleteTask(index, element)"
                                    class="text-red-600 dark:text-red-400"
                                >
                                    Delete
                                </button>
                            </div>
                        </div>
                    </template>
                </draggable>
                <button
                    @click="openNewTaskModal(index)"
                    class="px-3 py-2 mt-2 w-full text-gray-600 rounded hover:bg-gray-200 dark:text-gray-300 dark:hover:bg-gray-700"
                >
                    + Add Task
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
import draggable from 'vuedraggable';
import Modal from '@/components/ui/Modal.vue';
import { useLocalStorage } from '@vueuse/core';


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

onMounted(async () => {
    const shared = await getSharedData();
    if (shared?.kanban) {
        board.value = shared.kanban;
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
