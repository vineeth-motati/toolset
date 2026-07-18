/**
 * XML/XSD validation via libxml2-wasm (libxml2 compiled to WebAssembly,
 * ~1.3MB, imported dynamically). XSD 1.0 only — libxml2 never implemented
 * 1.1. The schema arrives as a pasted param (single-file upload UI), so with
 * no schema provided this degrades to a well-formedness check. libxml2-wasm
 * objects hold wasm memory and must be disposed explicitly.
 */
import { replaceExtension, textResult } from './shared';

const formatDetails = (error) =>
    (error.details ?? [])
        .map((d) => `  line ${d.line ?? '?'}: ${d.message.trim()}`)
        .join('\n');

export const validateXmlXsd = async (file, options = {}) => {
    const xml = await file.text();
    if (!xml.trim()) {
        throw new Error(`${file.name} is empty — nothing to validate`);
    }
    const xsdText = String(options.xsd ?? '').trim();
    const { XmlDocument, XsdValidator } = await import('libxml2-wasm');

    const reportName = replaceExtension(file.name, 'txt');
    let xmlDoc;
    try {
        xmlDoc = XmlDocument.fromString(xml);
    } catch (error) {
        return textResult(
            `✗ Not well-formed XML\n\n${error.message}${formatDetails(error) ? `\n${formatDetails(error)}` : ''}`,
            reportName
        );
    }

    let xsdDoc = null;
    let validator = null;
    try {
        if (!xsdText) {
            return textResult(
                '✓ Well-formed XML\n\nNo XSD schema was provided, so only well-formedness was checked. Paste your XSD in the options panel for full schema validation.',
                reportName
            );
        }

        try {
            xsdDoc = XmlDocument.fromString(xsdText);
            validator = XsdValidator.fromDoc(xsdDoc);
        } catch (error) {
            return textResult(
                `✗ Invalid XSD schema\n\nThe pasted schema could not be compiled:\n${error.message}${formatDetails(error) ? `\n${formatDetails(error)}` : ''}`,
                reportName
            );
        }

        try {
            validator.validate(xmlDoc);
            return textResult(
                '✓ Valid\n\nThe XML document conforms to the provided XSD schema.',
                reportName
            );
        } catch (error) {
            return textResult(
                `✗ Invalid against schema\n\n${error.message}${formatDetails(error) ? `\n${formatDetails(error)}` : ''}`,
                reportName
            );
        }
    } finally {
        validator?.dispose();
        xsdDoc?.dispose();
        xmlDoc.dispose();
    }
};
