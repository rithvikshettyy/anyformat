import { execSync } from 'child_process';
import { ensureTempDir, generateFileId, getTempPath } from '../file-utils';
import { rm } from 'fs/promises';
import { convertDocument } from './document';

/**
 * Converts DOCX or PDF files to LaTeX code (.tex) using Pandoc and LibreOffice.
 */
export async function convertToLatex(
  inputPath: string
): Promise<{ filePath: string; fileId: string }> {
  await ensureTempDir();
  const fileId = generateFileId();
  const ext = inputPath.split('.').pop()?.toLowerCase() || '';
  const outputPath = getTempPath(fileId, 'tex');

  // Determine pandoc command (resolve path on Windows if not in PATH)
  let pandocCmd = 'pandoc';
  if (process.platform === 'win32') {
    try {
      execSync('where.exe pandoc', { stdio: 'ignore' });
    } catch {
      const localAppData = process.env.LOCALAPPDATA || 'C:\\Users\\ADMIN\\AppData\\Local';
      pandocCmd = `"${localAppData}\\Pandoc\\pandoc.exe"`;
    }
  }

  if (ext === 'docx') {
    try {
      execSync(`${pandocCmd} -f docx -t latex "${inputPath}" -o "${outputPath}"`, {
        timeout: 60000,
        stdio: 'pipe',
      });
    } catch (error) {
      console.error('Pandoc error:', error);
      throw new Error('Pandoc conversion failed. Make sure pandoc is installed.');
    }
  } else if (ext === 'pdf') {
    try {
      // Step 1: Convert PDF to DOCX using LibreOffice
      const docxResult = await convertDocument(inputPath, 'docx');
      
      // Step 2: Convert DOCX to LaTeX using Pandoc
      execSync(`${pandocCmd} -f docx -t latex "${docxResult.filePath}" -o "${outputPath}"`, {
        timeout: 60000,
        stdio: 'pipe',
      });

      // Cleanup temp docx
      try {
        await rm(docxResult.filePath);
      } catch {}
    } catch (error) {
      console.error('PDF to LaTeX error:', error);
      throw new Error('PDF to LaTeX conversion failed. Make sure libreoffice and pandoc are installed.');
    }
  } else {
    throw new Error(`Unsupported input format for LaTeX conversion: ${ext}`);
  }

  return { filePath: outputPath, fileId };
}
