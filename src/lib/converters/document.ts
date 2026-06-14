import { execSync } from 'child_process';
import { ensureTempDir, generateFileId, getTempPath } from '../file-utils';
import { readdir, mkdir, rename, rm } from 'fs/promises';
import { join } from 'path';
import { TEMP_DIR } from '../constants';

/**
 * Convert documents using LibreOffice headless
 * Supports: DOCX, XLSX, PPTX, DOC, XLS, PPT, ODT, ODS, ODP → PDF (and reverse)
 */
export async function convertDocument(
  inputPath: string,
  outputFormat: string
): Promise<{ filePath: string; fileId: string }> {
  await ensureTempDir();
  const fileId = generateFileId();

  // Create a unique output directory to avoid filename conflicts
  const outDir = join(TEMP_DIR, fileId + '_out');
  await mkdir(outDir, { recursive: true });

  // Determine LibreOffice command (windows uses soffice)
  let cmd = 'libreoffice';
  if (process.platform === 'win32') {
    try {
      execSync('where.exe soffice', { stdio: 'ignore' });
      cmd = 'soffice';
    } catch {
      cmd = '"C:\\Program Files\\LibreOffice\\program\\soffice.exe"';
    }
  }

  // LibreOffice convert
  execSync(
    `${cmd} --headless --norestore --convert-to ${outputFormat} --outdir "${outDir}" "${inputPath}"`,
    { timeout: 180000, stdio: 'pipe' }
  );

  // Find the output file (LibreOffice keeps original basename)
  const files = await readdir(outDir);
  const outputFile = files.find((f) => f.endsWith(`.${outputFormat}`));

  if (!outputFile) {
    throw new Error(`Conversion failed: no output file found`);
  }

  // Move to standard temp path
  const finalPath = getTempPath(fileId, outputFormat);
  await rename(join(outDir, outputFile), finalPath);

  // Cleanup temp output dir
  try {
    await rm(outDir, { recursive: true });
  } catch {
    // Non-critical
  }

  return { filePath: finalPath, fileId };
}
