/**
 * Extract plain text from transcript file buffers (TXT, PDF, DOCX).
 */

import { PDFParse } from 'pdf-parse';
import mammoth from 'mammoth';

const ALLOWED_TYPES = [
  'text/plain',
  'application/pdf',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
];
const ALLOWED_EXT = ['.txt', '.pdf', '.docx', '.doc'];

export function isAllowedTranscriptFile(name: string, type?: string): boolean {
  const ext = name.slice(name.lastIndexOf('.')).toLowerCase();
  if (ALLOWED_EXT.includes(ext)) return true;
  if (type && ALLOWED_TYPES.includes(type)) return true;
  return false;
}

export async function extractTextFromTranscriptFile(
  buffer: Buffer,
  fileName: string,
  mimeType?: string
): Promise<string> {
  const ext = fileName.slice(fileName.lastIndexOf('.')).toLowerCase();
  const type = mimeType?.toLowerCase() ?? '';

  if (ext === '.txt' || type === 'text/plain') {
    return buffer.toString('utf-8');
  }

  if (ext === '.pdf' || type === 'application/pdf') {
    const parser = new PDFParse({ data: new Uint8Array(buffer) });
    try {
      const result = await parser.getText();
      return typeof result?.text === 'string' ? result.text : '';
    } finally {
      await parser.destroy();
    }
  }

  if (ext === '.docx' || ext === '.doc' || type.includes('wordprocessingml') || type.includes('msword')) {
    const result = await mammoth.extractRawText({ buffer });
    return result?.value ?? '';
  }

  throw new Error(`Unsupported transcript file type: ${fileName}. Use .txt, .pdf, or .docx`);
}
