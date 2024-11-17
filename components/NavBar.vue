<template>
  <nav class="bg-white shadow-lg">
    <div class="container px-4 mx-auto">
      <div class="flex justify-between items-center h-16">
        <NuxtLink to="/" class="text-xl font-bold text-gray-800"
          >ToolSet</NuxtLink
        >
        <div class="flex space-x-4">
          <NuxtLink
            v-for="tool in tools"
            :key="tool.path"
            :to="tool.path"
            class="px-3 py-2 text-sm font-medium text-gray-700 rounded-md hover:text-gray-900 hover:bg-gray-100"
          >
            {{ tool.name }}
          </NuxtLink>
        </div>
      </div>
    </div>
  </nav>
</template>

<script setup>
const tools = [
  { name: 'Kanban', path: '/tools/kanban' },
  { name: 'Notes', path: '/tools/notes' },
  { name: 'Code Editor', path: '/tools/code' },
  { name: 'QR Generator', path: '/tools/qr' },
  { name: 'Image Tools', path: '/tools/image' },
];
</script>
