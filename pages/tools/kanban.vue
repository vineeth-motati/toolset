<template>
  <div class="mx-auto max-w-6xl">
    <div class="flex justify-between items-center mb-6">
      <h1 class="text-2xl font-bold">Kanban Board</h1>
      <button
        @click="shareBoard"
        class="px-4 py-2 text-white bg-blue-600 rounded-md hover:bg-blue-700"
      >
        Share Board
      </button>
    </div>
    <div class="flex overflow-x-auto gap-4 pb-4">
      <div
        v-for="(column, index) in board"
        :key="index"
        class="flex-shrink-0 p-4 w-72 bg-gray-100 rounded-lg"
      >
        <h3 class="mb-4 font-semibold">{{ column.title }}</h3>
        <draggable
          v-model="column.items"
          item-key="id"
          group="tasks"
          :animation="150"
          class="min-h-[200px]"
        >
          <template #item="{ element }">
            <div class="p-3 mb-2 bg-white rounded shadow cursor-move">
              {{ element.text }}
              <div class="flex justify-end mt-2">
                <button
                  @click.stop="editTask(index, element)"
                  class="mr-2 text-blue-600"
                >
                  Edit
                </button>
                <button
                  @click.stop="deleteTask(index, element)"
                  class="text-red-600"
                >
                  Delete
                </button>
              </div>
            </div>
          </template>
        </draggable>
        <button
          @click="openNewTaskModal(index)"
          class="px-3 py-2 mt-2 w-full text-gray-600 rounded hover:bg-gray-200"
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
      <div class="mt-4">
        <label class="block text-sm font-medium text-gray-700"
          >Task Description</label
        >
        <textarea
          v-model="newTaskText"
          class="block mt-1 w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
          rows="3"
        ></textarea>
      </div>
    </Modal>
  </div>
</template>

<script setup>
import draggable from 'vuedraggable';
import Modal from '~/components/ui/Modal.vue';
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
    navigator.clipboard.writeText(link);
    toast.success('Share link copied to clipboard!');
  } else {
    toast.error('Failed to generate share link');
  }
};
</script>
