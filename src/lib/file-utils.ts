import { mkdir, readdir, stat, unlink, writeFile, rm } from 'fs/promises';
import { existsSync } from 'fs';
import { join, resolve } from 'path';
import { v4 as uuidv4 } from 'uuid';
import { TEMP_DIR, FILE_EXPIRY_MS, MIME_MAP } from './constants';
import sanitize from 'sanitize-filename';

/**
 * Generate a unique file ID
 */
export function generateFileId(): string {
  return uuidv4();
}

/**
 * Get full path for a temp file
 */
export function getTempPath(fileId: string, ext: string): string {
  return join(TEMP_DIR, `${fileId}.${ext}`);
}

/**
 * Ensure the temp directory exists
 */
export async function ensureTempDir(): Promise<void> {
  if (!existsSync(TEMP_DIR)) {
    await mkdir(TEMP_DIR, { recursive: true });
  }
}

/**
 * Save an uploaded file to the temp directory under an isolated UUID subdirectory.
 * Sanitizes the filename, enforces the 50MB limit, and validates the file's MIME type.
 */
export async function saveUploadedFile(
  file: File,
  allowedExtensions: string[]
): Promise<{ filePath: string; fileId: string; ext: string }> {
  await ensureTempDir();

  // 1. Enforce strict 50MB file size limit
  if (file.size > 50 * 1024 * 1024) {
    throw new Error('File size exceeds the maximum allowed limit of 50MB');
  }

  const originalName = file.name || 'upload';
  const ext = originalName.split('.').pop()?.toLowerCase() || 'bin';

  // Validate extension is allowed
  if (allowedExtensions.length > 0 && !allowedExtensions.includes(ext)) {
    throw new Error(`Extension .${ext} is not allowed for this tool`);
  }

  // 2. Sanitize filename using sanitize-filename
  const sanitized = sanitize(originalName);

  // 3. Isolated UUID directory
  const fileId = generateFileId();
  const folderPath = join(TEMP_DIR, fileId);
  await mkdir(folderPath, { recursive: true });

  const filePath = join(folderPath, sanitized);

  // 4. Path Traversal Protection
  const resolvedTempDir = resolve(TEMP_DIR);
  const resolvedFilePath = resolve(filePath);
  if (!resolvedFilePath.startsWith(resolvedTempDir)) {
    throw new Error('Path traversal detected');
  }

  // 5. Read buffer and validate actual MIME type
  const buffer = Buffer.from(await file.arrayBuffer());

  // Dynamically import file-type (ESM-only package)
  const { fileTypeFromBuffer } = await import('file-type');
  const detectedType = await fileTypeFromBuffer(buffer);

  // Map allowed extensions to expected MIME types
  const allowedMimeTypes = allowedExtensions
    .map((ext) => MIME_MAP[ext])
    .filter(Boolean);

  if (detectedType) {
    // Binary MIME type detected - check if it matches expected MIME types
    if (allowedMimeTypes.length > 0 && !allowedMimeTypes.includes(detectedType.mime)) {
      // If it's a known extension, allow compatible/alternate mime types (e.g. image/jpeg vs image/png etc. if required)
      throw new Error(`Invalid file content: detected MIME type '${detectedType.mime}' does not match expected type for this tool`);
    }
  } else {
    // If file-type is undefined, check if it is a plaintext format
    const plaintextExtensions = ['txt', 'csv', 'tex', 'latex', 'md', 'json', 'html', 'xml'];
    if (plaintextExtensions.includes(ext)) {
      const reportedMime = file.type || '';
      const isTextMime =
        reportedMime.startsWith('text/') ||
        reportedMime === 'application/json' ||
        reportedMime === 'application/xml' ||
        reportedMime === 'application/javascript';
      if (!isTextMime) {
        throw new Error(`Invalid plaintext file content: reported MIME type '${reportedMime}' is invalid`);
      }
    } else {
      throw new Error('Could not verify file content type (corrupted or invalid format)');
    }
  }

  await writeFile(filePath, buffer);

  return { filePath, fileId, ext };
}

/**
 * Save a buffer to a temp file in an isolated UUID directory
 */
export async function saveTempBuffer(
  buffer: Buffer,
  ext: string
): Promise<{ filePath: string; fileId: string }> {
  await ensureTempDir();

  const fileId = generateFileId();
  const folderPath = join(TEMP_DIR, fileId);
  await mkdir(folderPath, { recursive: true });

  const filePath = join(folderPath, `converted.${ext}`);

  // Path Traversal Protection
  const resolvedTempDir = resolve(TEMP_DIR);
  const resolvedFilePath = resolve(filePath);
  if (!resolvedFilePath.startsWith(resolvedTempDir)) {
    throw new Error('Path traversal detected');
  }

  await writeFile(filePath, buffer);

  return { filePath, fileId };
}

/**
 * Get file or folder age in milliseconds
 */
export async function getFileAge(filePath: string): Promise<number> {
  const fileStat = await stat(filePath);
  return Date.now() - fileStat.mtimeMs;
}

/**
 * Clean up expired files (older than FILE_EXPIRY_MS)
 * Supports recursive folder cleanup for isolated directories.
 */
export async function cleanupExpiredFiles(): Promise<number> {
  if (!existsSync(TEMP_DIR)) return 0;

  const files = await readdir(TEMP_DIR);
  let deleted = 0;

  const resolvedTempDir = resolve(TEMP_DIR);

  for (const file of files) {
    const filePath = join(TEMP_DIR, file);
    
    // Path Traversal check
    if (!resolve(filePath).startsWith(resolvedTempDir)) {
      continue;
    }

    try {
      const fileStat = await stat(filePath);
      const age = Date.now() - fileStat.mtimeMs;
      if (age > FILE_EXPIRY_MS) {
        if (fileStat.isDirectory()) {
          await rm(filePath, { recursive: true, force: true });
        } else {
          await unlink(filePath);
        }
        deleted++;
      }
    } catch {
      // File/folder may have been deleted already, skip
    }
  }

  return deleted;
}

/**
 * Find a file by its ID. Supports locating files inside isolated UUID subdirectories.
 */
export async function findFileById(
  fileId: string
): Promise<{ filePath: string; ext: string } | null> {
  if (!existsSync(TEMP_DIR)) return null;

  const resolvedTempDir = resolve(TEMP_DIR);

  // Check if there is an isolated folder named fileId
  const folderPath = join(TEMP_DIR, fileId);
  if (existsSync(folderPath)) {
    const s = await stat(folderPath);
    if (s.isDirectory()) {
      const files = await readdir(folderPath);
      if (files.length > 0) {
        const filename = files[0];
        const filePath = join(folderPath, filename);

        // Path Traversal check
        if (!resolve(filePath).startsWith(resolvedTempDir)) {
          throw new Error('Path traversal detected');
        }

        const ext = filename.split('.').pop()?.toLowerCase() || '';
        return { filePath, ext };
      }
    }
  }

  // Fallback to legacy flat files in TEMP_DIR
  const files = await readdir(TEMP_DIR);
  const match = files.find((f) => f.startsWith(fileId));

  if (!match) return null;

  const filePath = join(TEMP_DIR, match);
  if (!resolve(filePath).startsWith(resolvedTempDir)) {
    throw new Error('Path traversal detected');
  }

  return {
    filePath,
    ext: match.split('.').pop() || '',
  };
}

/**
 * Delete a file or folder by path
 */
export async function deleteFile(filePath: string): Promise<void> {
  try {
    const resolvedTempDir = resolve(TEMP_DIR);
    if (!resolve(filePath).startsWith(resolvedTempDir)) {
      return;
    }

    const s = await stat(filePath);
    if (s.isDirectory()) {
      await rm(filePath, { recursive: true, force: true });
    } else {
      await unlink(filePath);
    }
  } catch {
    // Already deleted or not found
  }
}
