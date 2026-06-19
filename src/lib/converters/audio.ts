import { execSync } from 'child_process';
import { ensureTempDir, generateFileId, getTempPath } from '../file-utils';

/**
 * Convert audio between formats using FFmpeg
 */
export async function convertAudio(
  inputPath: string,
  outputFormat: string,
  bitrate: string = '192k'
): Promise<{ filePath: string; fileId: string }> {
  await ensureTempDir();
  const fileId = generateFileId();
  const outputPath = getTempPath(fileId, outputFormat);

  let codecArgs = '';
  switch (outputFormat) {
    case 'mp3':
      codecArgs = `-c:a libmp3lame -b:a ${bitrate}`;
      break;
    case 'wav':
      codecArgs = '-c:a pcm_s16le';
      break;
    case 'flac':
      codecArgs = '-c:a flac';
      break;
    case 'aac':
      codecArgs = `-c:a aac -b:a ${bitrate}`;
      break;
    case 'ogg':
      codecArgs = `-c:a libvorbis -b:a ${bitrate}`;
      break;
    case 'm4a':
      codecArgs = `-c:a aac -b:a ${bitrate}`;
      break;
    default:
      codecArgs = `-c:a libmp3lame -b:a ${bitrate}`;
  }

  execSync(
    `ffmpeg -i "${inputPath}" ${codecArgs} -y "${outputPath}"`,
    { timeout: 300000, stdio: 'pipe' }
  );

  return { filePath: outputPath, fileId };
}

/**
 * Compress audio by re-encoding to MP3 at a target bitrate
 */
export async function compressAudio(
  inputPath: string,
  bitrate: string = '128k'
): Promise<{ filePath: string; fileId: string }> {
  return convertAudio(inputPath, 'mp3', bitrate);
}
