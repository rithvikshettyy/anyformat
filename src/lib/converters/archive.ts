import archiver from 'archiver';
import { createWriteStream, readdirSync, statSync } from 'fs';
import { execSync } from 'child_process';
import { ensureTempDir, generateFileId, getTempPath } from '../file-utils';
import { join } from 'path';
import { mkdir, rm } from 'fs/promises';

/**
 * Create an archive from multiple files
 */
export async function createArchive(
  inputPaths: string[],
  format: string = 'zip'
): Promise<{ filePath: string; fileId: string }> {
  await ensureTempDir();
  const fileId = generateFileId();

  const archiverFormat = format === 'tar.gz' ? 'tar' : format === 'zip' ? 'zip' : 'tar';
  const ext = format === 'tar.gz' ? 'tar.gz' : format;
  const outputPath = getTempPath(fileId, ext);

  return new Promise((resolve, reject) => {
    const output = createWriteStream(outputPath);
    const archive = archiver(archiverFormat as archiver.Format, {
      zlib: { level: 9 },
      ...(format === 'tar.gz' ? { gzip: true } : {}),
    });

    output.on('close', () => {
      resolve({ filePath: outputPath, fileId });
    });

    archive.on('error', (err: Error) => {
      reject(err);
    });

    archive.pipe(output);

    for (const filePath of inputPaths) {
      const name = filePath.split(/[/\\]/).pop() || 'file';
      archive.file(filePath, { name });
    }

    archive.finalize();
  });
}

/**
 * Extract an archive
 * Returns a ZIP of the extracted contents
 */
export async function extractArchive(
  inputPath: string
): Promise<{ filePath: string; fileId: string }> {
  await ensureTempDir();
  const fileId = generateFileId();
  const extractDir = join(getTempPath(fileId, '').replace(/\.$/, ''), '_extracted');
  await mkdir(extractDir, { recursive: true });

  const ext = inputPath.split('.').pop()?.toLowerCase() || '';

  // Extract based on format
  switch (ext) {
    case 'zip':
      execSync(`unzip -o "${inputPath}" -d "${extractDir}"`, {
        timeout: 120000,
        stdio: 'pipe',
      });
      break;
    case '7z':
      execSync(`7z x "${inputPath}" -o"${extractDir}" -y`, {
        timeout: 120000,
        stdio: 'pipe',
      });
      break;
    case 'rar':
      execSync(`unrar x "${inputPath}" "${extractDir}/" -y`, {
        timeout: 120000,
        stdio: 'pipe',
      });
      break;
    case 'tar':
    case 'gz':
      execSync(`tar -xf "${inputPath}" -C "${extractDir}"`, {
        timeout: 120000,
        stdio: 'pipe',
      });
      break;
    default:
      throw new Error(`Unsupported archive format: ${ext}`);
  }

  // Check total extracted size to prevent zip bombs (500MB limit)
  const MAX_EXTRACTED_SIZE = 500 * 1024 * 1024;
  function getDirSize(dir: string): number {
    let total = 0;
    for (const entry of readdirSync(dir, { withFileTypes: true })) {
      const full = join(dir, entry.name);
      if (entry.isDirectory()) total += getDirSize(full);
      else total += statSync(full).size;
    }
    return total;
  }
  const extractedSize = getDirSize(extractDir);
  if (extractedSize > MAX_EXTRACTED_SIZE) {
    await rm(extractDir, { recursive: true, force: true });
    throw new Error('Extracted archive exceeds 500MB size limit');
  }

  // Re-archive extracted contents as ZIP for download
  const outputPath = getTempPath(fileId, 'zip');

  return new Promise((resolve, reject) => {
    const output = createWriteStream(outputPath);
    const archive = archiver('zip', { zlib: { level: 9 } });

    output.on('close', async () => {
      try { await rm(extractDir, { recursive: true, force: true }); } catch {}
      resolve({ filePath: outputPath, fileId });
    });

    archive.on('error', (err: Error) => {
      rm(extractDir, { recursive: true, force: true }).catch(() => {});
      reject(err);
    });

    archive.pipe(output);
    archive.directory(extractDir, false);
    archive.finalize();
  });
}
