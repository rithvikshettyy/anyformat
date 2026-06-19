import { execSync } from 'child_process';
import { ensureTempDir, generateFileId, getTempPath } from '../file-utils';

/**
 * Convert video between formats using FFmpeg
 */
export async function convertVideo(
  inputPath: string,
  outputFormat: string
): Promise<{ filePath: string; fileId: string }> {
  await ensureTempDir();
  const fileId = generateFileId();
  const outputPath = getTempPath(fileId, outputFormat);

  // Choose codec based on output format
  let codecArgs = '';
  switch (outputFormat) {
    case 'mp4':
      codecArgs = '-c:v libx264 -c:a aac -movflags +faststart';
      break;
    case 'webm':
      codecArgs = '-c:v libvpx-vp9 -c:a libopus';
      break;
    case 'mkv':
      codecArgs = '-c:v libx264 -c:a aac';
      break;
    case 'mov':
      codecArgs = '-c:v libx264 -c:a aac -movflags +faststart';
      break;
    case 'avi':
      codecArgs = '-c:v libx264 -c:a mp3';
      break;
    case 'gif':
      codecArgs = '-vf "fps=10,scale=480:-1:flags=lanczos" -loop 0';
      break;
    default:
      codecArgs = '-c:v libx264 -c:a aac';
  }

  execSync(
    `ffmpeg -i "${inputPath}" ${codecArgs} -y "${outputPath}"`,
    { timeout: 600000, stdio: 'pipe' }
  );

  return { filePath: outputPath, fileId };
}

/**
 * Compress video using CRF-based compression
 */
export async function compressVideo(
  inputPath: string,
  crf: number = 28
): Promise<{ filePath: string; fileId: string }> {
  await ensureTempDir();
  const fileId = generateFileId();
  const outputPath = getTempPath(fileId, 'mp4');

  execSync(
    `ffmpeg -i "${inputPath}" -c:v libx264 -crf ${crf} -preset medium -c:a aac -b:a 128k -movflags +faststart -y "${outputPath}"`,
    { timeout: 600000, stdio: 'pipe' }
  );

  return { filePath: outputPath, fileId };
}

/**
 * Extract audio from video
 */
export async function extractAudio(
  inputPath: string,
  audioFormat: string = 'mp3'
): Promise<{ filePath: string; fileId: string }> {
  await ensureTempDir();
  const fileId = generateFileId();
  const outputPath = getTempPath(fileId, audioFormat);

  let codecArgs = '';
  switch (audioFormat) {
    case 'mp3':
      codecArgs = '-c:a libmp3lame -b:a 192k';
      break;
    case 'wav':
      codecArgs = '-c:a pcm_s16le';
      break;
    case 'flac':
      codecArgs = '-c:a flac';
      break;
    case 'aac':
      codecArgs = '-c:a aac -b:a 192k';
      break;
    case 'ogg':
      codecArgs = '-c:a libvorbis -b:a 192k';
      break;
    default:
      codecArgs = '-c:a libmp3lame -b:a 192k';
  }

  execSync(
    `ffmpeg -i "${inputPath}" -vn ${codecArgs} -y "${outputPath}"`,
    { timeout: 300000, stdio: 'pipe' }
  );

  return { filePath: outputPath, fileId };
}

/**
 * Trim video by start and end timestamps
 */
export async function trimVideo(
  inputPath: string,
  start: string = '00:00:00',
  end: string = '00:01:00'
): Promise<{ filePath: string; fileId: string }> {
  await ensureTempDir();
  const fileId = generateFileId();
  const outputPath = getTempPath(fileId, 'mp4');

  execSync(
    `ffmpeg -i "${inputPath}" -ss ${start} -to ${end} -c:v libx264 -c:a aac -movflags +faststart -y "${outputPath}"`,
    { timeout: 600000, stdio: 'pipe' }
  );

  return { filePath: outputPath, fileId };
}
