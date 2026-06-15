'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import DropZone from '@/components/upload/DropZone';
import FormatPicker from '@/components/upload/FormatPicker';
import ProgressBar from '@/components/conversion/ProgressBar';
import DownloadCard from '@/components/conversion/DownloadCard';
import Button from '@/components/ui/Button';
import { useConversion } from '@/hooks/useConversion';
import { IMAGE_FORMATS } from '@/lib/constants';
import { Turnstile } from '@marsidev/react-turnstile';

/**
 * Handles the interactive upload, format picker, progress, and download
 * states on the home landing page. Built as a Client Component for optimization.
 */
export default function HomeConverter() {
  const [files, setFiles] = useState<File[]>([]);
  const [inputFormat, setInputFormat] = useState('jpg');
  const [outputFormat, setOutputFormat] = useState('png');
  const [turnstileToken, setTurnstileToken] = useState<string | null>(null);
  
  const { status, progress, result, error, startConversion, reset } =
    useConversion('image');

  const handleFilesSelected = (selected: File[]) => {
    setFiles(selected);
    // Auto-detect input format
    const ext = selected[0]?.name.split('.').pop()?.toLowerCase() || 'jpg';
    if (IMAGE_FORMATS.includes(ext as typeof IMAGE_FORMATS[number])) {
      setInputFormat(ext);
    }
  };

  const handleConvert = () => {
    if (files.length === 0) return;
    startConversion(files, {
      action: 'convert',
      outputFormat,
      turnstileToken: turnstileToken || '',
    });
  };

  const handleReset = () => {
    reset();
    setFiles([]);
    setTurnstileToken(null);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay: 0.1 }}
      className="max-w-2xl mx-auto space-y-6"
    >
      {status === 'completed' && result ? (
        <DownloadCard result={result} onReset={handleReset} />
      ) : (
        <>
          <DropZone
            onFilesSelected={handleFilesSelected}
            accept=".jpg,.jpeg,.png,.webp,.avif,.gif,.svg,.tiff,.bmp"
            disabled={status === 'uploading' || status === 'processing'}
          />

          {files.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-4"
            >
              {/* Selected File */}
              <div className="flex items-center justify-center gap-2 text-sm">
                <svg className="w-4 h-4 text-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
                <span className="text-text-secondary">
                  {files[0].name}
                </span>
              </div>

              {/* Format Picker */}
              <FormatPicker
                inputFormats={Array.from(IMAGE_FORMATS)}
                outputFormats={['jpg', 'png', 'webp', 'avif']}
                inputFormat={inputFormat}
                outputFormat={outputFormat}
                onInputChange={setInputFormat}
                onOutputChange={setOutputFormat}
              />

              {/* Turnstile Widget */}
              <div className="flex justify-center my-4">
                <Turnstile
                  siteKey={process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY || '1x00000000000000000000AA'}
                  onSuccess={(token) => setTurnstileToken(token)}
                  onExpire={() => setTurnstileToken(null)}
                  onError={() => setTurnstileToken(null)}
                />
              </div>

              {/* Convert Button */}
              <div className="flex justify-center">
                <Button
                  size="lg"
                  onClick={handleConvert}
                  loading={
                    status === 'uploading' || status === 'processing'
                  }
                  disabled={files.length === 0 || !turnstileToken}
                >
                  Convert to {outputFormat.toUpperCase()}
                </Button>
              </div>
            </motion.div>
          )}

          {/* Progress */}
          {(status === 'uploading' || status === 'processing') && (
            <ProgressBar progress={progress} status={status} />
          )}

          {/* Error */}
          {error && (
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-red-400 text-sm text-center"
            >
              {error}
            </motion.p>
          )}
        </>
      )}
    </motion.div>
  );
}
