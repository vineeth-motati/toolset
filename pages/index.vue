<template>
  <div class="mx-auto max-w-4xl">
    <h1 class="mb-8 text-4xl font-bold text-center">Welcome to ToolSet</h1>
    <div class="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
      <div
        v-for="tool in tools"
        :key="tool.path"
        class="p-6 bg-white rounded-lg shadow-md transition-shadow hover:shadow-lg"
      >
        <NuxtLink :to="tool.path">
          <h2 class="mb-2 text-xl font-semibold">{{ tool.name }}</h2>
          <p class="text-gray-600">{{ tool.description }}</p>
        </NuxtLink>
      </div>
    </div>
  </div>
</template>

<script setup>
const tools = [
  {
    name: 'Kanban Board',
    path: '/tools/kanban',
    description: 'Organize your tasks with a drag-and-drop Kanban board',
  },
  {
    name: 'Notes',
    path: '/tools/notes',
    description: 'Take and organize your notes with markdown support',
  },
  {
    name: 'Code Editor',
    path: '/tools/code',
    description: 'Write and share code with syntax highlighting',
  },
  {
    name: 'QR Generator',
    path: '/tools/qr',
    description: 'Generate QR codes for any text or URL',
  },
  {
    name: 'Image Tools',
    path: '/tools/image',
    description: 'Compress and optimize your images',
  },
];
</script>
