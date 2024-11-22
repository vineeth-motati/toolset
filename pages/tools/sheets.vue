<template>
    <div class="flex flex-col h-[85vh]">
        <SheetsToolbar
            :activeSheet="activeSheet"
            :sheets="sheets"
            :current-format="currentCellFormat"
            @add-sheet="addSheet"
            @switch-sheet="switchSheet"
            @import-file="importFile"
            @export-file="exportFile"
            @update-format="updateCellFormat"
            @share-sheet="shareSheet"
        />

        <SheetsFormulaBar
            v-model="formulaBarValue"
            :active-cell="activeCell"
            @formula-submit="updateFormula"
        />

        <div class="overflow-hidden flex-1">
            <SheetsGrid
                :data="activeSheetData"
                :formulas="activeSheet?.formulas"
                :formats="activeSheet?.formats"
                :active-cell="activeCell"
                :editing-cell="editingCell"
                @cell-update="updateCell"
                @cell-click="handleCellClick"
                @range-select="handleRangeSelect"
            />
        </div>
    </div>
</template>
<script setup>
import { ref, computed } from 'vue';
import { useLocalStorage } from '@vueuse/core';
import { useToast } from '~/composables/useToast';
import { useShareLink } from '~/composables/useShareLink';
import { useSheetsFormulas } from '~/composables/useSheetsFormulas';
import Papa from 'papaparse';
import * as XLSX from 'xlsx';

const toast = useToast();
const { generateShareLink, getSharedData } = useShareLink();
const { evaluateFormula, getCellReference, parseCellReference } =
    useSheetsFormulas();

// State
const sheets = useLocalStorage('sheets', [
    {
        id: 'sheet1',
        name: 'Sheet 1',
        data: Array(100)
            .fill()
            .map(() => Array(26).fill('')),
        formats: {},
        formulas: {},
        comments: {},
        frozen: { rows: 0, cols: 0 },
    },
]);

const activeSheetId = ref('sheet1');
const activeCell = ref({ row: 0, col: 0 });
const selectedRange = ref(null);
const formulaBarValue = ref('');
const frozenRows = ref(0);
const frozenCols = ref(0);
const editingCell = ref(null);

// Computed
const activeSheet = computed(() =>
    sheets.value.find((sheet) => sheet.id === activeSheetId.value)
);
const activeSheetData = computed(() => activeSheet.value?.data || []);
const currentCellFormat = computed(() => {
    if (!activeSheet.value || !activeCell.value) return {};
    const { row, col } = activeCell.value;
    return activeSheet.value.formats[`${row},${col}`] || {};
});

// Methods
const addSheet = () => {
    const newId = `sheet${sheets.value.length + 1}`;
    sheets.value.push({
        id: newId,
        name: `Sheet ${sheets.value.length + 1}`,
        data: Array(100)
            .fill()
            .map(() => Array(26).fill('')),
        formats: {},
        formulas: {},
        comments: {},
        frozen: { rows: 0, cols: 0 },
    });
    activeSheetId.value = newId;
    toast.success('New sheet added');
};

const switchSheet = (sheetId) => {
    activeSheetId.value = sheetId;
    activeCell.value = { row: 0, col: 0 };
    editingCell.value = null;
    selectedRange.value = null;
};

const handleCellClick = ({ row, col }) => {
    activeCell.value = { row, col };
    editingCell.value = { row, col };
    const cellValue =
        activeSheet.value.formulas[`${row},${col}`] ||
        activeSheet.value.data[row][col];
    formulaBarValue.value = cellValue;
};

const setActiveCell = ({ row, col }) => {
    activeCell.value = { row, col };
    const cellValue =
        activeSheet.value.formulas[`${row},${col}`] ||
        activeSheet.value.data[row][col];
    formulaBarValue.value = cellValue;
};

const updateCell = ({ row, col, value }) => {
    if (!activeSheet.value) return;

    if (value.startsWith('=')) {
        activeSheet.value.formulas[`${row},${col}`] = value;
        try {
            const result = evaluateFormula(value.substring(1), (ref) => {
                const cell = parseCellReference(ref);
                return cell ? activeSheet.value.data[cell.row][cell.col] : null;
            });
            activeSheet.value.data[row][col] = result.toString();
        } catch (error) {
            activeSheet.value.data[row][col] = '#ERROR!';
            toast.error('Invalid formula');
        }
    } else {
        delete activeSheet.value.formulas[`${row},${col}`];
        activeSheet.value.data[row][col] = value;
    }

    editingCell.value = null;
};

const updateFormula = (formula) => {
    const { row, col } = activeCell.value;
    updateCell({ row, col, value: formula });
};

const handleRangeSelect = (range) => {
    selectedRange.value = range;
};

const updateCellFormat = (format) => {
    if (!activeSheet.value || !activeCell.value) return;

    const { row, col } = activeCell.value;
    const currentFormat = activeSheet.value.formats[`${row},${col}`] || {};
    activeSheet.value.formats[`${row},${col}`] = {
        ...currentFormat,
        ...format,
    };
};

const importFile = async (file) => {
    try {
        if (file.type === 'text/csv') {
            const text = await file.text();
            Papa.parse(text, {
                complete: (results) => {
                    if (results.data && results.data.length > 0) {
                        activeSheet.value.data = results.data;
                        toast.success('CSV imported successfully');
                    }
                },
                error: (error) => {
                    toast.error('Error parsing CSV file');
                    console.error('CSV Parse Error:', error);
                },
            });
        } else {
            const data = await readExcelFile(file);
            if (data && data.length > 0) {
                activeSheet.value.data = data.data;
                activeSheet.value.formats = data.formats || {};
                toast.success('Excel file imported successfully');
            }
        }
    } catch (error) {
        toast.error('Error importing file');
        console.error('Import Error:', error);
    }
};

const readExcelFile = (file) => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const data = new Uint8Array(e.target.result);
                const workbook = XLSX.read(data, { type: 'array' });
                const firstSheet = workbook.Sheets[workbook.SheetNames[0]];

                // Extract cell data
                const jsonData = XLSX.utils.sheet_to_json(firstSheet, {
                    header: 1,
                });

                // Extract cell formats
                const formats = {};
                Object.keys(firstSheet).forEach((cell) => {
                    if (cell[0] !== '!') {
                        const cellData = firstSheet[cell];
                        if (cellData.s) {
                            // Style information
                            const [col, row] = XLSX.utils.decode_cell(cell);
                            formats[`${row},${col}`] = {
                                bold: cellData.s.font?.bold,
                                italic: cellData.s.font?.italic,
                                underline: cellData.s.font?.underline,
                                fontSize: cellData.s.font?.sz,
                                align: cellData.s.alignment?.horizontal,
                            };
                        }
                    }
                });

                resolve({ data: jsonData, formats });
            } catch (error) {
                reject(error);
            }
        };
        reader.onerror = reject;
        reader.readAsArrayBuffer(file);
    });
};

const exportFile = async (format) => {
    try {
        if (format === 'csv') {
            const csv = Papa.unparse(activeSheet.value.data);
            downloadFile(csv, 'sheets.csv', 'text/csv');
            toast.success('Exported as CSV');
        } else {
            const ws = XLSX.utils.aoa_to_sheet(activeSheet.value.data);

            // Apply formats
            Object.entries(activeSheet.value.formats).forEach(
                ([key, format]) => {
                    const [row, col] = key.split(',').map(Number);
                    const cellRef = XLSX.utils.encode_cell({ r: row, c: col });
                    if (!ws[cellRef]) ws[cellRef] = { t: 's', v: '' };
                    ws[cellRef].s = {
                        font: {
                            bold: format.bold,
                            italic: format.italic,
                            underline: format.underline,
                            sz: format.fontSize,
                        },
                        alignment: {
                            horizontal: format.align,
                        },
                    };
                }
            );

            const wb = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(wb, ws, activeSheet.value.name);
            XLSX.writeFile(wb, 'sheets.xlsx');
            toast.success('Exported as Excel');
        }
    } catch (error) {
        toast.error('Error exporting file');
        console.error('Export Error:', error);
    }
};

const downloadFile = (content, filename, type) => {
    const blob = new Blob([content], { type });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
};

// Share functionality
const shareSheet = async () => {
    const link = await generateShareLink('/tools/sheets', {
        sheets: sheets.value,
        activeSheetId: activeSheetId.value,
    });
    if (link) {
        navigator.clipboard.writeText(link);
        toast.success('Share link copied to clipboard!');
    } else {
        toast.error('Error generating share link');
    }
};

// Load shared data
onMounted(async () => {
    const shared = await getSharedData();
    if (shared?.sheets) {
        sheets.value = shared.sheets;
        activeSheetId.value = shared.activeSheetId;
    }
});
</script>
