import { spawn } from 'child_process';
import { promises as fs } from 'fs';
import { join } from 'path';
import { randomUUID } from 'crypto';
import { createReadStream, createWriteStream } from 'fs';
import { pipeline } from 'stream/promises';
import os from 'os';
import { exec } from 'child_process';
import { promisify } from 'util';

const execPromise = promisify(exec);

const TEMP_DIR = join(os.tmpdir(), 'presidio-redactor');

export default defineEventHandler(async (event) => {
    try {
        // Ensure temp directory exists
        try {
            await fs.mkdir(TEMP_DIR, { recursive: true });
        } catch (err) {
            console.error('Failed to create temp directory:', err);
        }

        // Parse the multipart form data
        const formData = await readMultipartFormData(event);

        if (!formData || !formData.length) {
            throw createError({
                statusCode: 400,
                statusMessage: 'Missing form data',
            });
        }

        // Extract the file
        const fileField = formData.find((field) => field.name === 'file');
        if (!fileField) {
            throw createError({
                statusCode: 400,
                statusMessage: 'Missing file',
            });
        }

        // Get PII types
        const piiTypesField = formData.find(
            (field) => field.name === 'piiTypes'
        );
        const piiTypes = piiTypesField
            ? JSON.parse(piiTypesField.data.toString())
            : [];

        // Get redaction method
        const methodField = formData.find(
            (field) => field.name === 'redactionMethod'
        );
        const redactionMethod = methodField
            ? methodField.data.toString()
            : 'fill';

        // Create unique file names for the temp files
        const fileId = randomUUID();
        const inputPath = join(TEMP_DIR, `input_${fileId}`);
        const outputPath = join(TEMP_DIR, `output_${fileId}`);

        // Write the uploaded file to disk
        await fs.writeFile(inputPath, fileField.data);

        // Determine file type
        const fileType = fileField.filename.toLowerCase().endsWith('.pdf')
            ? 'pdf'
            : 'image';

        // Process the file with Presidio
        if (fileType === 'image') {
            await processImage(
                inputPath,
                outputPath,
                piiTypes,
                redactionMethod
            );
        } else {
            await processPDF(inputPath, outputPath, piiTypes, redactionMethod);
        }

        // Read the resulting file
        const result = await fs.readFile(outputPath);

        // Clean up
        try {
            await fs.unlink(inputPath);
            await fs.unlink(outputPath);
        } catch (err) {
            console.error('Error cleaning up temp files:', err);
        }

        // Set the appropriate content type and return
        const contentType =
            fileType === 'pdf'
                ? 'application/pdf'
                : fileField.type || 'application/octet-stream';

        setResponseHeader(event, 'Content-Type', contentType);
        return result;
    } catch (error) {
        console.error('Redactor API error:', error);
        throw createError({
            statusCode: 500,
            statusMessage: error.message || 'Error processing file',
        });
    }
});

// Process image using Presidio Image Redactor
async function processImage(inputPath, outputPath, piiTypes, method) {
    // For now, we need to implement a method to call Presidio
    // This is a placeholder for the actual implementation

    // As a simple start, we'll use the presidio Python client via a script
    // In production, you'd likely want to use a proper service or API

    // Example implementation using a Python script with Presidio
    const pythonScript = `
import sys
from presidio_image_redactor import ImageRedactorEngine
from presidio_analyzer import AnalyzerEngine, RecognizerRegistry

# Get the input/output paths and PII types from command line arguments
input_path = sys.argv[1]
output_path = sys.argv[2]
pii_types = sys.argv[3].split(',') if len(sys.argv) > 3 else None
redaction_method = sys.argv[4] if len(sys.argv) > 4 else "fill"

# Initialize the engines
analyzer = AnalyzerEngine()
image_redactor = ImageRedactorEngine()

# Process the image
image_redactor.redact(
    image=input_path,
    output_path=output_path,
    analyzer_results=None,  # Will use default analyzer internally
    entities=pii_types if pii_types else None,
    fill=redaction_method == "fill"
)
print(f"Image processed: {output_path}")
  `;

    const scriptPath = join(TEMP_DIR, `presidio_script_${randomUUID()}.py`);
    await fs.writeFile(scriptPath, pythonScript);

    try {
        // Execute the script
        const piiTypesStr = piiTypes.join(',');
        await execPromise(
            `python ${scriptPath} ${inputPath} ${outputPath} ${piiTypesStr} ${method}`
        );

        // Clean up the script
        await fs.unlink(scriptPath);
    } catch (err) {
        console.error('Error executing Presidio script:', err);
        throw new Error('Failed to process image with Presidio');
    }
}

// Process PDF using Presidio
async function processPDF(inputPath, outputPath, piiTypes, method) {
    // PDF processing is more complex and may require additional tools
    // This is a placeholder for the actual implementation

    // For now, we'll implement a basic approach using a Python script with Presidio
    const pythonScript = `
import sys
import fitz  # PyMuPDF
from PIL import Image
import io
from presidio_image_redactor import ImageRedactorEngine
from presidio_analyzer import AnalyzerEngine

# Get the input/output paths and PII types from command line arguments
input_path = sys.argv[1]
output_path = sys.argv[2]
pii_types = sys.argv[3].split(',') if len(sys.argv) > 3 else None
redaction_method = sys.argv[4] if len(sys.argv) > 4 else "fill"

# Initialize the engines
analyzer = AnalyzerEngine()
image_redactor = ImageRedactorEngine()

# Open the PDF
pdf_doc = fitz.open(input_path)
output_pdf = fitz.open()

# Process each page
for page_num in range(len(pdf_doc)):
    page = pdf_doc[page_num]

    # Convert page to image
    pix = page.get_pixmap(matrix=fitz.Matrix(2.0, 2.0))
    img_data = pix.tobytes("png")

    # Process the image with Presidio
    img = Image.open(io.BytesIO(img_data))
    redacted_img = image_redactor.redact(
        image=img,
        analyzer_results=None,  # Will use default analyzer internally
        entities=pii_types if pii_types else None,
        fill=redaction_method == "fill"
    )

    # Convert back to bytes
    img_byte_arr = io.BytesIO()
    redacted_img.save(img_byte_arr, format='PNG')
    img_bytes = img_byte_arr.getvalue()

    # Create new page in output PDF
    new_page = output_pdf.new_page(width=page.rect.width, height=page.rect.height)

    # Insert the redacted image
    new_page.insert_image(new_page.rect, stream=img_bytes)

# Save the output PDF
output_pdf.save(output_path)
print(f"PDF processed: {output_path}")
  `;

    const scriptPath = join(TEMP_DIR, `presidio_pdf_script_${randomUUID()}.py`);
    await fs.writeFile(scriptPath, pythonScript);

    try {
        // Execute the script
        const piiTypesStr = piiTypes.join(',');
        await execPromise(
            `python ${scriptPath} ${inputPath} ${outputPath} ${piiTypesStr} ${method}`
        );

        // Clean up the script
        await fs.unlink(scriptPath);
    } catch (err) {
        console.error('Error executing Presidio PDF script:', err);
        throw new Error('Failed to process PDF with Presidio');
    }
}
