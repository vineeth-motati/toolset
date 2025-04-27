<template>
    <div class="bg-white p-4 rounded-lg shadow">
        <h3 class="text-lg font-medium mb-3">Advanced Filters</h3>

        <div class="space-y-4">
            <!-- Filter criteria -->
            <div
                v-for="(filter, index) in filters"
                :key="index"
                class="flex items-center gap-2"
            >
                <select
                    v-model="filter.field"
                    class="px-2 py-1.5 text-sm rounded border"
                >
                    <option value="">Select field</option>
                    <option
                        v-for="field in availableFields"
                        :key="field"
                        :value="field"
                    >
                        {{ field }}
                    </option>
                </select>

                <select
                    v-model="filter.operator"
                    class="px-2 py-1.5 text-sm rounded border"
                >
                    <option value="eq">equals</option>
                    <option value="neq">not equals</option>
                    <option value="gt">greater than</option>
                    <option value="lt">less than</option>
                    <option value="contains">contains</option>
                    <option value="startsWith">starts with</option>
                    <option value="endsWith">ends with</option>
                </select>

                <input
                    v-model="filter.value"
                    type="text"
                    class="px-2 py-1.5 text-sm rounded border flex-1"
                    placeholder="Value"
                />

                <button
                    @click="removeFilter(index)"
                    class="p-1.5 text-red-600 hover:bg-red-50 rounded"
                >
                    <Icon icon="mdi:close" />
                </button>
            </div>

            <!-- Add filter button -->
            <div class="flex gap-2">
                <button
                    @click="addFilter"
                    class="px-3 py-1.5 text-sm text-blue-600 bg-blue-50 rounded hover:bg-blue-100"
                >
                    <Icon icon="mdi:plus" class="inline-block mr-1" /> Add
                    Filter
                </button>

                <button
                    @click="applyFilters"
                    class="px-3 py-1.5 text-sm text-white bg-blue-600 rounded hover:bg-blue-700"
                    :disabled="!hasValidFilters"
                >
                    Apply Filters
                </button>

                <button
                    @click="clearFilters"
                    class="px-3 py-1.5 text-sm text-gray-600 bg-gray-100 rounded hover:bg-gray-200"
                    v-if="filters.length > 0"
                >
                    Clear Filters
                </button>
            </div>
        </div>
    </div>
</template>

<script setup>
import { ref, computed } from 'vue';

const props = defineProps({
    availableFields: {
        type: Array,
        default: () => [],
    },
    data: {
        type: Array,
        required: true,
    },
});

const emit = defineEmits(['filter']);

const filters = ref([{ field: '', operator: 'eq', value: '' }]);

const hasValidFilters = computed(() => {
    return filters.value.some(
        (filter) => filter.field && filter.operator && filter.value !== ''
    );
});

function addFilter() {
    filters.value.push({ field: '', operator: 'eq', value: '' });
}

function removeFilter(index) {
    filters.value.splice(index, 1);

    // Always keep at least one filter row
    if (filters.value.length === 0) {
        addFilter();
    }
}

function clearFilters() {
    filters.value = [{ field: '', operator: 'eq', value: '' }];
    emit('filter', []);
}

function applyFilters() {
    if (!hasValidFilters.value) return;

    const validFilters = filters.value.filter(
        (filter) => filter.field && filter.operator && filter.value !== ''
    );

    const filteredData = props.data.filter((item) => {
        return validFilters.every((filter) => {
            const fieldValue = item[filter.field];
            const filterValue = filter.value;

            switch (filter.operator) {
                case 'eq':
                    return String(fieldValue) === filterValue;
                case 'neq':
                    return String(fieldValue) !== filterValue;
                case 'gt':
                    return Number(fieldValue) > Number(filterValue);
                case 'lt':
                    return Number(fieldValue) < Number(filterValue);
                case 'contains':
                    return String(fieldValue).includes(filterValue);
                case 'startsWith':
                    return String(fieldValue).startsWith(filterValue);
                case 'endsWith':
                    return String(fieldValue).endsWith(filterValue);
                default:
                    return true;
            }
        });
    });

    emit('filter', filteredData);
}
</script>
