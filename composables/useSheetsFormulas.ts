import { evaluate } from 'mathjs';

export const useSheetsFormulas = () => {
    const evaluateFormula = (
        formula: string,
        getCellValue: (ref: string) => any
    ) => {
        try {
            // Replace cell references (e.g., A1, B2) with their values
            const processedFormula = formula.replace(
                /[A-Z]+[0-9]+/g,
                (match) => {
                    const value = getCellValue(match);
                    return isNaN(value) ? `"${value}"` : value;
                }
            );

            return evaluate(processedFormula);
        } catch (error) {
            console.error('Formula evaluation error:', error);
            return '#ERROR!';
        }
    };

    const getCellReference = (col: number, row: number) => {
        let columnName = '';
        let tempCol = col;

        while (tempCol >= 0) {
            columnName = String.fromCharCode(65 + (tempCol % 26)) + columnName;
            tempCol = Math.floor(tempCol / 26) - 1;
        }

        return `${columnName}${row + 1}`;
    };

    const parseCellReference = (ref: string) => {
        const match = ref.match(/([A-Z]+)([0-9]+)/);
        if (!match) return null;

        const [, col, row] = match;
        let columnIndex = 0;

        for (let i = 0; i < col.length; i++) {
            columnIndex = columnIndex * 26 + col.charCodeAt(i) - 64;
        }

        return {
            col: columnIndex - 1,
            row: parseInt(row) - 1,
        };
    };

    return {
        evaluateFormula,
        getCellReference,
        parseCellReference,
    };
};
