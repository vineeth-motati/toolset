<template>
    <div
        ref="gridContainer"
        class="overflow-auto relative h-full"
        @mouseup="endSelection"
        @mouseleave="endSelection"
    >
        <table class="w-full border-collapse">
            <!-- Column Headers -->
            <thead>
                <tr>
                    <th class="sticky top-0 left-0 z-20 w-10 bg-gray-100"></th>
                    <th
                        v-for="(_, index) in columnCount"
                        :key="index"
                        class="sticky top-0 z-10 bg-gray-100 px-2 py-1 border min-w-[100px]"
                    >
                        {{ getColumnLabel(index) }}
                    </th>
                </tr>
            </thead>

            <!-- Grid Body -->
            <tbody>
                <tr v-for="(row, rowIndex) in data" :key="rowIndex">
                    <!-- Row Headers -->
                    <td
                        class="sticky left-0 z-10 px-2 py-1 w-10 text-center bg-gray-100 border"
                    >
                        {{ rowIndex + 1 }}
                    </td>

                    <!-- Cells -->
                    <SheetsCell
                        v-for="(cell, colIndex) in row"
                        :key="colIndex"
                        :value="cell"
                        :formula="getFormula(rowIndex, colIndex)"
                        :format="getCellFormat(rowIndex, colIndex)"
                        :row="rowIndex"
                        :col="colIndex"
                        :is-active="isActiveCell(rowIndex, colIndex)"
                        :is-editing="isEditingCell(rowIndex, colIndex)"
                        @update:value="updateCell(rowIndex, colIndex, $event)"
                        @cell-click="handleCellClick"
                        @selection-start="startSelection"
                        @selection-move="updateSelection"
                    />
                </tr>
            </tbody>
        </table>

        <!-- Selection Overlay -->
        <div
            v-if="selectionRange"
            class="absolute bg-blue-100 bg-opacity-20 border-2 border-blue-500 pointer-events-none"
            :style="selectionStyle"
        ></div>
    </div>
</template>

<script setup>
import { ref, computed } from 'vue';
import { useSheetsFormulas } from '@/composables/useSheetsFormulas';

const props = defineProps({
    data: {
        type: Array,
        required: true,
    },
    formulas: {
        type: Object,
        default: () => ({}),
    },
    formats: {
        type: Object,
        default: () => ({}),
    },
    activeCell: {
        type: Object,
        required: true,
    },
    editingCell: {
        type: Object,
        default: null,
    },
});

const emit = defineEmits(['cell-update', 'cell-click', 'range-select']);

const { getCellReference, evaluateFormula } = useSheetsFormulas();
const gridContainer = ref(null);
const selectionRange = ref(null);
const isSelecting = ref(false);

const columnCount = computed(() => props.data[0]?.length || 0);

const getColumnLabel = (index) => {
    let label = '';
    while (index >= 0) {
        label = String.fromCharCode(65 + (index % 26)) + label;
        index = Math.floor(index / 26) - 1;
    }
    return label;
};

const isActiveCell = (row, col) =>
    props.activeCell.row === row && props.activeCell.col === col;

const isEditingCell = (row, col) =>
    props.editingCell?.row === row && props.editingCell?.col === col;

const getFormula = (row, col) => props.formulas[`${row},${col}`];

const getCellFormat = (row, col) => props.formats[`${row},${col}`] || {};

const updateCell = (row, col, value) => {
    emit('cell-update', { row, col, value });
};

const handleCellClick = (cell) => {
    emit('cell-click', cell);
};

const startSelection = (cell) => {
    isSelecting.value = true;
    selectionRange.value = {
        start: cell,
        end: cell,
    };
    emit('range-select', selectionRange.value);
};

const updateSelection = (cell) => {
    if (!isSelecting.value) return;

    selectionRange.value = {
        ...selectionRange.value,
        end: cell,
    };
    emit('range-select', selectionRange.value);
};

const endSelection = () => {
    isSelecting.value = false;
};

const selectionStyle = computed(() => {
    if (!selectionRange.value || !gridContainer.value) return {};

    const { start, end } = selectionRange.value;
    const startCell = gridContainer.value.querySelector(
        `tbody tr:nth-child(${start.row + 1}) td:nth-child(${start.col + 2})`
    );
    const endCell = gridContainer.value.querySelector(
        `tbody tr:nth-child(${end.row + 1}) td:nth-child(${end.col + 2})`
    );

    if (!startCell || !endCell) return {};

    const containerRect = gridContainer.value.getBoundingClientRect();
    const startRect = startCell.getBoundingClientRect();
    const endRect = endCell.getBoundingClientRect();

    return {
        left: `${Math.min(startRect.left, endRect.left) - containerRect.left}px`,
        top: `${Math.min(startRect.top, endRect.top) - containerRect.top}px`,
        width: `${Math.abs(endRect.right - startRect.left)}px`,
        height: `${Math.abs(endRect.bottom - startRect.top)}px`,
    };
});
</script>
