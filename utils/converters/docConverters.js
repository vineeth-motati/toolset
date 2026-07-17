/**
 * Word document conversion via mammoth, which maps docx semantics
 * (headings, lists, tables, bold/italic) to clean HTML rather than
 * pixel-faithful markup. Layout-faithful Office → PDF stays on the API.
 */
import { textResult, replaceExtension } from './shared';

// Fragment → standalone .html file users can open directly.
export const wrapHtmlDocument = (title, body) => `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<title>${title}</title>
</head>
<body>
${body}
</body>
</html>
`;

export const wordToHtml = async (file) => {
    const mammoth = await import('mammoth');
    let result;
    try {
        result = await mammoth.convertToHtml({
            arrayBuffer: await file.arrayBuffer(),
        });
    } catch {
        throw new Error(
            `Could not read ${file.name} — is it a valid Word (.docx) document?`
        );
    }
    const title = file.name.replace(/\.[^.]+$/, '');
    return textResult(
        wrapHtmlDocument(title, result.value),
        replaceExtension(file.name, 'html'),
        'text/html'
    );
};
