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
import { useToast } from '@/composables/useToast';
import { useShareLink } from '@/composables/useShareLink';
import { useSheetsFormulas } from '@/composables/useSheetsFormulas';
import Papa from 'papaparse';
import ExcelJS from 'exceljs';

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
    debugger;
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
            if (data && data.data.length > 0) {
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

const readExcelFile = async (file) => {
    try {
        const workbook = new ExcelJS.Workbook();
        await workbook.xlsx.load(await file.arrayBuffer());
        const worksheet = workbook.worksheets[0];

        // Extract cell data
        const jsonData = [];
        const formats = {};

        worksheet.eachRow((row, rowIndex) => {
            const rowData = [];
            row.eachCell((cell, colIndex) => {
                rowData.push(cell.value || '');
                if (cell.style) {
                    formats[`${rowIndex - 1},${colIndex - 1}`] = {
                        bold: cell.style.font?.bold || false,
                        italic: cell.style.font?.italic || false,
                        underline: cell.style.font?.underline || false,
                        fontSize: cell.style.font?.size || null,
                        align: cell.style.alignment?.horizontal || null,
                    };
                }
            });
            jsonData.push(rowData);
        });

        return { data: jsonData, formats };
    } catch (error) {
        console.error('Excel Import Error:', error);
        return null;
    }
};

const exportFile = async (format) => {
    try {
        if (format === 'csv') {
            const csv = Papa.unparse(activeSheet.value.data);
            downloadFile(csv, 'sheets.csv', 'text/csv');
            toast.success('Exported as CSV');
        } else {
            const workbook = new ExcelJS.Workbook();
            const worksheet = workbook.addWorksheet(activeSheet.value.name);

            // Populate data and formats
            activeSheet.value.data.forEach((row, rowIndex) => {
                const excelRow = worksheet.addRow(row);
                row.forEach((_, colIndex) => {
                    const format =
                        activeSheet.value.formats[`${rowIndex},${colIndex}`];
                    if (format) {
                        const cell = excelRow.getCell(colIndex + 1);
                        cell.font = {
                            bold: format.bold,
                            italic: format.italic,
                            underline: format.underline,
                            size: format.fontSize,
                        };
                        cell.alignment = {
                            horizontal: format.align,
                        };
                    }
                });
            });

            // Export to Excel
            const buffer = await workbook.xlsx.writeBuffer();
            downloadFile(
                buffer,
                'sheets.xlsx',
                'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
            );
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
