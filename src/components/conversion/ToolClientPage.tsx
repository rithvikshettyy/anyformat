'use client';

import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface WordCounterResult {
  words: number;
  characters: number;
  charactersNoSpaces: number;
  lines: number;
  paragraphs: number;
}

interface ColorPaletteColor {
  hex: string;
  percentage: number;
}

interface ColorPaletteResult {
  palette: ColorPaletteColor[];
}
import { useParams, notFound } from 'next/navigation';
import Link from 'next/link';
import DropZone from '@/components/upload/DropZone';
import FormatPicker from '@/components/upload/FormatPicker';
import ProgressBar from '@/components/conversion/ProgressBar';
import Button from '@/components/ui/Button';
import Select from '@/components/ui/Select';
import { useConversion } from '@/hooks/useConversion';
import { getTool, getCategoryInfo, ACTION_ICONS } from '@/lib/tools-registry';
import { ConversionCategory } from '@/types';
import { MAX_FILE_SIZE } from '@/lib/constants';
import { Turnstile } from '@marsidev/react-turnstile';

export default function ToolClientPage() {
  const params = useParams();
  const category = params.category as string;
  const toolSlug = params.tool as string;

  const tool = getTool(category, toolSlug);
  const categoryInfo = getCategoryInfo(category);

  if (!tool || !categoryInfo) {
    notFound();
  }

  // --- Common States ---
  const [files, setFiles] = useState<File[]>([]);
  const [url, setUrl] = useState('');
  const [inputFormat, setInputFormat] = useState(tool.inputFormats[0] || '');
  const [outputFormat, setOutputFormat] = useState(tool.outputFormats[0] || '');
  const [options, setOptions] = useState<Record<string, string>>(() => {
    const defaults: Record<string, string> = {};
    tool.options?.forEach((opt) => {
      defaults[opt.name] = String(opt.defaultValue);
    });
    return defaults;
  });
  const [turnstileToken, setTurnstileToken] = useState<string | null>(null);

  const { status, progress, result, error, startConversion, reset } =
    useConversion(category as ConversionCategory);

  // --- Copy Feedback State ---
  const [copiedText, setCopiedText] = useState<string | null>(null);
  const showCopyFeedback = (text: string) => {
    setCopiedText(text);
    setTimeout(() => setCopiedText(null), 2000);
  };

  // --- QR Code Generator States ---
  const [qrText, setQrText] = useState('');

  // --- Link Shortener States ---
  const [shortLongUrl, setShortLongUrl] = useState('');
  const [customAlias, setCustomAlias] = useState('');
  const [shortenResult, setShortenResult] = useState<{ shortUrl: string; shortCode: string; longUrl: string } | null>(null);
  const [shortenError, setShortenError] = useState<string | null>(null);
  const [shortenLoading, setShortenLoading] = useState(false);

  // --- Word Counter Client-side States ---
  const [wordCountTab, setWordCountTab] = useState<'paste' | 'upload'>('paste');
  const [pastedText, setPastedText] = useState('');
  const pastedStats = useMemo(() => {
    const text = pastedText.trim();
    if (!text) {
      return { words: 0, characters: 0, charactersNoSpaces: 0, lines: 0, paragraphs: 0, readTime: 0 };
    }
    const words = text.split(/\s+/).filter((w) => w.length > 0).length;
    const characters = pastedText.length;
    const charactersNoSpaces = pastedText.replace(/\s/g, '').length;
    const lines = pastedText.split('\n').length;
    const paragraphs = pastedText.split(/\n\s*\n/).filter((p) => p.trim().length > 0).length;
    const readTime = Math.ceil(words / 200); // 200 words per minute average reading speed
    return { words, characters, charactersNoSpaces, lines, paragraphs, readTime };
  }, [pastedText]);

  // --- SEO Generator States ---
  const [seoTitle, setSeoTitle] = useState('');
  const [seoDesc, setSeoDesc] = useState('');
  const [seoKeywords, setSeoKeywords] = useState('');
  const [seoAuthor, setSeoAuthor] = useState('');
  const [seoRobotsIndex, setSeoRobotsIndex] = useState(true);
  const [seoRobotsFollow, setSeoRobotsFollow] = useState(true);
  const [seoOgImage, setSeoOgImage] = useState('');

  const generatedSeoHtml = useMemo(() => {
    const robotsContent = `${seoRobotsIndex ? 'index' : 'noindex'}, ${seoRobotsFollow ? 'follow' : 'nofollow'}`;
    let html = `<!-- HTML Meta Tags -->\n`;
    if (seoTitle) html += `<title>${seoTitle}</title>\n`;
    if (seoDesc) html += `<meta name="description" content="${seoDesc}">\n`;
    if (seoKeywords) html += `<meta name="keywords" content="${seoKeywords}">\n`;
    if (seoAuthor) html += `<meta name="author" content="${seoAuthor}">\n`;
    html += `<meta name="robots" content="${robotsContent}">\n\n`;

    html += `<!-- Open Graph / Facebook -->\n`;
    html += `<meta property="og:type" content="website">\n`;
    if (seoTitle) html += `<meta property="og:title" content="${seoTitle}">\n`;
    if (seoDesc) html += `<meta property="og:description" content="${seoDesc}">\n`;
    if (seoOgImage) html += `<meta property="og:image" content="${seoOgImage}">\n\n`;

    html += `<!-- Twitter -->\n`;
    html += `<meta name="twitter:card" content="summary_large_image">\n`;
    if (seoTitle) html += `<meta name="twitter:title" content="${seoTitle}">\n`;
    if (seoDesc) html += `<meta name="twitter:description" content="${seoDesc}">\n`;
    if (seoOgImage) html += `<meta name="twitter:image" content="${seoOgImage}">`;

    return html;
  }, [seoTitle, seoDesc, seoKeywords, seoAuthor, seoRobotsIndex, seoRobotsFollow, seoOgImage]);

  const generatedRobotsTxt = useMemo(() => {
    let txt = `User-agent: *\n`;
    txt += `${seoRobotsIndex ? 'Allow' : 'Disallow'}: /\n`;
    txt += `Disallow: /api/\n`;
    txt += `Disallow: /dashboard/\n`;
    return txt;
  }, [seoRobotsIndex]);

  // --- Handlers ---
  const acceptFormats = useMemo(() => {
    if (tool.inputFormats.includes('*')) return undefined;
    return tool.inputFormats.map((f) => `.${f}`).join(',');
  }, [tool.inputFormats]);

  const handleConvert = () => {
    const isUrlInput = tool.inputFormats.includes('url');
    if (tool.slug === 'qr-generator') {
      if (!qrText) return;
      const formData = new FormData();
      formData.append('action', 'qr-generate');
      formData.append('text', qrText);
      startConversion([], {
        action: 'qr-generate',
        toolName: tool.name,
        text: qrText,
        turnstileToken: turnstileToken || '',
      });
      return;
    }

    if (!isUrlInput && files.length === 0) return;
    if (isUrlInput && !url) return;

    const convertOptions: Record<string, string> = {
      action: tool.action,
      outputFormat,
      toolName: tool.name,
      turnstileToken: turnstileToken || '',
      ...options,
    };

    if (isUrlInput) {
      convertOptions.url = url;
    }

    // Map actions
    if (tool.slug === 'bg-removal') {
      convertOptions.action = 'bg-remove';
    } else if (tool.slug === 'color-palette') {
      convertOptions.action = 'extract-palette';
    } else if (tool.slug === 'word-counter') {
      convertOptions.action = 'word-count';
    }

    startConversion(isUrlInput ? [] : files, convertOptions);
  };

  const handleLinkShortenSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!shortLongUrl) return;

    setShortenLoading(true);
    setShortenError(null);
    setShortenResult(null);

    try {
      const formData = new FormData();
      formData.append('action', 'shorten-link');
      formData.append('longUrl', shortLongUrl);
      if (customAlias) {
        formData.append('customCode', customAlias);
      }
      if (turnstileToken) {
        formData.append('turnstileToken', turnstileToken);
      }

      const response = await fetch('/api/convert/utility', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();
      if (!data.success) {
        throw new Error(data.error || 'Failed to shorten link');
      }

      setShortenResult(data.data);
      // Add to local storage history manually for custom tools
      try {
        const history = JSON.parse(localStorage.getItem('convertx-history') || '[]');
        history.unshift({
          id: data.data.shortCode,
          toolSlug: 'link-shortener',
          toolName: 'Link Shortener',
          inputFile: shortLongUrl,
          outputFile: data.data.shortUrl,
          inputSize: 0,
          outputSize: 0,
          status: 'completed',
          timestamp: Date.now(),
        });
        localStorage.setItem('convertx-history', JSON.stringify(history.slice(0, 50)));
      } catch {}
    } catch (err) {
      setShortenError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setShortenLoading(false);
    }
  };

  const handleReset = () => {
    reset();
    setFiles([]);
    setUrl('');
    setQrText('');
    setShortLongUrl('');
    setCustomAlias('');
    setShortenResult(null);
    setShortenError(null);
    setTurnstileToken(null);
  };

  const handleFilesSelected = (selected: File[]) => {
    setFiles(selected);
    const ext = selected[0]?.name.split('.').pop()?.toLowerCase() || '';
    if (tool.inputFormats.includes(ext)) {
      setInputFormat(ext);
    }
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    showCopyFeedback(label);
  };

  const downloadTextFile = (text: string, filename: string) => {
    const element = document.createElement('a');
    const file = new Blob([text], { type: 'text/plain' });
    element.href = URL.createObjectURL(file);
    element.download = filename;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  const iconPath = ACTION_ICONS[tool.icon] || ACTION_ICONS.convert;

  return (
    <div className="relative">
      <div className="absolute inset-0 grid-bg pointer-events-none" />

      <div className="relative max-w-3xl mx-auto px-4 sm:px-6 py-12 md:py-20">
        {/* Breadcrumb */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex items-center gap-2 text-sm text-text-muted mb-6"
        >
          <Link href="/tools" className="hover:text-text-secondary transition-colors">
            Tools
          </Link>
          <span>/</span>
          <Link
            href={`/tools?category=${category}`}
            className="hover:text-text-secondary transition-colors"
          >
            {categoryInfo.name}
          </Link>
          <span>/</span>
          <span className="text-text-secondary">{tool.name}</span>
        </motion.div>

        {/* Tool Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex items-center gap-4 mb-3">
            <div
              className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0"
              style={{ backgroundColor: `${categoryInfo.color}15` }}
            >
              <svg
                className="w-6 h-6"
                style={{ color: categoryInfo.color }}
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={1.5}
              >
                <path strokeLinecap="round" strokeLinejoin="round" d={iconPath} />
              </svg>
            </div>
            <div>
              <h1 className="text-2xl md:text-3xl font-bold">{tool.name}</h1>
              <p className="text-text-secondary">{tool.description}</p>
            </div>
          </div>
        </motion.div>

        {/* Copy Feedback Toast */}
        <AnimatePresence>
          {copiedText && (
            <motion.div
              initial={{ opacity: 0, y: 20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -20, scale: 0.95 }}
              className="fixed bottom-8 left-1/2 -translate-x-1/2 z-50 bg-accent text-white px-4 py-2 rounded-xl text-sm font-medium shadow-lg shadow-accent/25 flex items-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
              Copied {copiedText}!
            </motion.div>
          )}
        </AnimatePresence>

        {/* Dynamic Tool Content */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="space-y-6"
        >
          {/* ========================================================================= */}
          {/* 1. LINK SHORTENER                                                         */}
          {/* ========================================================================= */}
          {tool.slug === 'link-shortener' && (
            <div className="space-y-6">
              {!shortenResult ? (
                <form onSubmit={handleLinkShortenSubmit} className="card-base p-6 space-y-5">
                  <div className="space-y-4">
                    <div>
                      <label className="text-xs font-semibold text-text-muted uppercase tracking-wider block mb-2">
                        Destination URL (Long URL)
                      </label>
                      <input
                        type="url"
                        required
                        placeholder="https://example.com/very-long-link-to-shorten"
                        value={shortLongUrl}
                        onChange={(e) => setShortLongUrl(e.target.value)}
                        disabled={shortenLoading}
                        className="w-full bg-background border border-surface-border rounded-xl px-4 py-3.5 text-base text-text-primary focus:outline-none focus:ring-2 focus:ring-accent placeholder:text-text-muted transition-all"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-text-muted uppercase tracking-wider block mb-2">
                        Custom Alias (Optional)
                      </label>
                      <div className="flex items-center bg-background border border-surface-border rounded-xl focus-within:ring-2 focus-within:ring-accent transition-all">
                        <span className="shrink-0 pl-4 pr-3 text-text-muted text-sm border-r border-surface-border">
                          {typeof window !== 'undefined' ? window.location.host : ''}/s/
                        </span>
                        <input
                          type="text"
                          placeholder="custom-name"
                          value={customAlias}
                          onChange={(e) => setCustomAlias(e.target.value)}
                          disabled={shortenLoading}
                          autoComplete="off"
                          className="w-full bg-transparent border-none rounded-r-xl px-4 py-3.5 text-base text-text-primary focus:outline-none placeholder:text-text-muted"
                        />
                      </div>
                    </div>
                  </div>

                  {shortenError && (
                    <div className="bg-red-900/20 border border-red-900/50 rounded-xl p-4 text-center">
                      <p className="text-red-400 text-sm">{shortenError}</p>
                    </div>
                  )}

                  {/* Turnstile Widget */}
                  <div className="flex justify-center my-4">
                    <Turnstile
                      siteKey={process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY || '1x00000000000000000000AA'}
                      onSuccess={(token) => setTurnstileToken(token)}
                      onExpire={() => setTurnstileToken(null)}
                      onError={() => setTurnstileToken(null)}
                    />
                  </div>

                  <div className="flex justify-center pt-2">
                    <Button type="submit" size="lg" loading={shortenLoading} disabled={!turnstileToken}>
                      Shorten Link
                    </Button>
                  </div>
                </form>
              ) : (
                <motion.div
                  initial={{ opacity: 0, scale: 0.98 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="card-base p-8 text-center space-y-6"
                >
                  <div className="w-16 h-16 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center mx-auto">
                    <svg className="w-8 h-8 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                    </svg>
                  </div>

                  <div>
                    <h3 className="text-xl font-bold text-text-primary mb-1">Link Shortened Successfully!</h3>
                    <p className="text-sm text-text-muted truncate max-w-lg mx-auto">Points to: {shortenResult.longUrl}</p>
                  </div>

                  <div className="bg-background border border-surface-border rounded-xl p-4 flex items-center justify-between max-w-md mx-auto">
                    <span className="font-mono text-accent text-lg font-semibold truncate select-all">{shortenResult.shortUrl}</span>
                    <div className="flex gap-2 flex-shrink-0">
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={() => copyToClipboard(shortenResult.shortUrl, 'Short Link')}
                      >
                        Copy
                      </Button>
                      <a href={shortenResult.shortUrl} target="_blank" rel="noopener noreferrer">
                        <Button size="sm">Visit</Button>
                      </a>
                    </div>
                  </div>

                  <div className="pt-2">
                    <Button variant="ghost" size="sm" onClick={handleReset}>
                      Shorten another URL
                    </Button>
                  </div>
                </motion.div>
              )}
            </div>
          )}

          {/* ========================================================================= */}
          {/* 2. SEO TAG GENERATOR                                                      */}
          {/* ========================================================================= */}
          {tool.slug === 'seo-generator' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
              {/* Form Input */}
              <div className="card-base p-6 space-y-4">
                <p className="text-xs text-text-muted uppercase tracking-wider font-semibold mb-2">SEO Configurations</p>
                
                <div className="space-y-3">
                  <div>
                    <label className="text-xs font-semibold text-text-secondary block mb-1">Website Title</label>
                    <input
                      type="text"
                      placeholder="e.g. AnyFormat - Free Converter"
                      value={seoTitle}
                      onChange={(e) => setSeoTitle(e.target.value)}
                      className="w-full bg-background border border-surface-border rounded-lg px-3 py-2 text-sm text-text-primary focus:outline-none focus:ring-1 focus:ring-accent"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-text-secondary block mb-1">Meta Description</label>
                    <textarea
                      placeholder="Describe your site for search engine results..."
                      value={seoDesc}
                      rows={3}
                      onChange={(e) => setSeoDesc(e.target.value)}
                      className="w-full bg-background border border-surface-border rounded-lg px-3 py-2 text-sm text-text-primary focus:outline-none focus:ring-1 focus:ring-accent resize-none"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-text-secondary block mb-1">Keywords (Comma Separated)</label>
                    <input
                      type="text"
                      placeholder="converter, pdf, online tools"
                      value={seoKeywords}
                      onChange={(e) => setSeoKeywords(e.target.value)}
                      className="w-full bg-background border border-surface-border rounded-lg px-3 py-2 text-sm text-text-primary focus:outline-none focus:ring-1 focus:ring-accent"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-text-secondary block mb-1">Author Name</label>
                    <input
                      type="text"
                      placeholder="AnyFormat Team"
                      value={seoAuthor}
                      onChange={(e) => setSeoAuthor(e.target.value)}
                      className="w-full bg-background border border-surface-border rounded-lg px-3 py-2 text-sm text-text-primary focus:outline-none focus:ring-1 focus:ring-accent"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-text-secondary block mb-1">OpenGraph Image URL</label>
                    <input
                      type="url"
                      placeholder="https://example.com/og-image.jpg"
                      value={seoOgImage}
                      onChange={(e) => setSeoOgImage(e.target.value)}
                      className="w-full bg-background border border-surface-border rounded-lg px-3 py-2 text-sm text-text-primary focus:outline-none focus:ring-1 focus:ring-accent"
                    />
                  </div>

                  <div className="flex items-center gap-6 pt-2">
                    <label className="flex items-center gap-2 cursor-pointer text-sm text-text-secondary">
                      <input
                        type="checkbox"
                        checked={seoRobotsIndex}
                        onChange={(e) => setSeoRobotsIndex(e.target.checked)}
                        className="accent-accent w-4 h-4 rounded"
                      />
                      Search Indexable (Index)
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer text-sm text-text-secondary">
                      <input
                        type="checkbox"
                        checked={seoRobotsFollow}
                        onChange={(e) => setSeoRobotsFollow(e.target.checked)}
                        className="accent-accent w-4 h-4 rounded"
                      />
                      Follow Links (Follow)
                    </label>
                  </div>
                </div>
              </div>

              {/* Code Preview */}
              <div className="space-y-6">
                {/* HTML Meta Tags */}
                <div className="card-base p-6 space-y-4">
                  <div className="flex items-center justify-between">
                    <p className="text-xs text-text-muted uppercase tracking-wider font-semibold">HTML Meta Tags</p>
                    <Button size="sm" variant="secondary" onClick={() => copyToClipboard(generatedSeoHtml, 'Meta Tags')}>
                      Copy Code
                    </Button>
                  </div>
                  <pre className="bg-background border border-surface-border rounded-xl p-4 text-xs font-mono text-text-secondary overflow-x-auto max-h-48">
                    {generatedSeoHtml}
                  </pre>
                </div>

                {/* Robots.txt */}
                <div className="card-base p-6 space-y-4">
                  <div className="flex items-center justify-between">
                    <p className="text-xs text-text-muted uppercase tracking-wider font-semibold">robots.txt</p>
                    <div className="flex gap-2">
                      <Button size="sm" variant="secondary" onClick={() => copyToClipboard(generatedRobotsTxt, 'robots.txt')}>
                        Copy
                      </Button>
                      <Button size="sm" onClick={() => downloadTextFile(generatedRobotsTxt, 'robots.txt')}>
                        Download
                      </Button>
                    </div>
                  </div>
                  <pre className="bg-background border border-surface-border rounded-xl p-4 text-xs font-mono text-text-secondary overflow-x-auto">
                    {generatedRobotsTxt}
                  </pre>
                </div>
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* 3. QR CODE GENERATOR                                                      */}
          {/* ========================================================================= */}
          {tool.slug === 'qr-generator' && (
            <div className="space-y-6">
              {status !== 'idle' ? (
                <ProgressBar
                  progress={progress}
                  status={status}
                  error={error}
                  downloadUrl={result?.downloadUrl}
                  fileName={result?.fileName}
                  fileSize={result?.fileSize}
                  outputFormat={result?.outputFormat}
                  expiresAt={result?.expiresAt}
                  onReset={handleReset}
                />
              ) : (
                <div className="card-base p-6 space-y-5">
                  <div>
                    <label className="text-xs font-semibold text-text-muted uppercase tracking-wider block mb-2">
                      Enter QR Code Text or URL
                    </label>
                    <textarea
                      placeholder="Type your text or paste your URL link here..."
                      value={qrText}
                      onChange={(e) => setQrText(e.target.value)}
                      rows={4}
                      className="w-full bg-background border border-surface-border rounded-xl px-4 py-3 text-base text-text-primary focus:outline-none focus:ring-2 focus:ring-accent placeholder:text-text-muted transition-all resize-none"
                    />
                  </div>

                  {/* Turnstile Widget */}
                  <div className="flex justify-center my-4">
                    <Turnstile
                      siteKey={process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY || '1x00000000000000000000AA'}
                      onSuccess={(token) => setTurnstileToken(token)}
                      onExpire={() => setTurnstileToken(null)}
                      onError={() => setTurnstileToken(null)}
                    />
                  </div>

                  <div className="flex justify-center pt-2">
                    <Button
                      size="lg"
                      onClick={handleConvert}
                      disabled={!qrText || !turnstileToken}
                    >
                      Generate QR Code
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ========================================================================= */}
          {/* 4. WORD COUNTER                                                           */}
          {/* ========================================================================= */}
          {tool.slug === 'word-counter' && (
            <div className="space-y-6">
              {/* Tabs */}
              <div className="flex border-b border-surface-border">
                <button
                  onClick={() => { setWordCountTab('paste'); handleReset(); }}
                  className={`px-6 py-3 font-medium text-sm border-b-2 transition-all ${
                    wordCountTab === 'paste'
                      ? 'border-accent text-accent'
                      : 'border-transparent text-text-muted hover:text-text-secondary'
                  }`}
                >
                  Type / Paste Text
                </button>
                <button
                  onClick={() => { setWordCountTab('upload'); handleReset(); }}
                  className={`px-6 py-3 font-medium text-sm border-b-2 transition-all ${
                    wordCountTab === 'upload'
                      ? 'border-accent text-accent'
                      : 'border-transparent text-text-muted hover:text-text-secondary'
                  }`}
                >
                  Analyze File (PDF, DOCX, TXT)
                </button>
              </div>

              {wordCountTab === 'paste' ? (
                <div className="space-y-6">
                  <div className="card-base p-6">
                    <textarea
                      placeholder="Start typing or paste your content here to instantly count words..."
                      value={pastedText}
                      onChange={(e) => setPastedText(e.target.value)}
                      rows={8}
                      className="w-full bg-transparent text-base text-text-primary placeholder:text-text-muted focus:outline-none resize-none"
                    />
                    {pastedText && (
                      <div className="flex justify-end pt-3">
                        <Button variant="ghost" size="sm" onClick={() => setPastedText('')}>
                          Clear Text
                        </Button>
                      </div>
                    )}
                  </div>

                  {/* Real-time Stats Grid */}
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-4">
                    {[
                      { label: 'Words', value: pastedStats.words },
                      { label: 'Characters', value: pastedStats.characters },
                      { label: 'Chars (No Space)', value: pastedStats.charactersNoSpaces },
                      { label: 'Lines', value: pastedStats.lines },
                      { label: 'Paragraphs', value: pastedStats.paragraphs },
                      { label: 'Reading Time', value: `${pastedStats.readTime} min` },
                    ].map((stat, idx) => (
                      <div key={idx} className="card-base p-4 text-center">
                        <p className="text-[26px] font-bold text-accent">{stat.value}</p>
                        <p className="text-xs text-text-secondary font-medium uppercase tracking-wider mt-1">{stat.label}</p>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="space-y-6">
                  {status === 'completed' && result ? (
                    <div className="space-y-6">
                      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
                        {[
                          { label: 'Words', value: (result as unknown as WordCounterResult).words },
                          { label: 'Characters', value: (result as unknown as WordCounterResult).characters },
                          { label: 'Chars (No Space)', value: (result as unknown as WordCounterResult).charactersNoSpaces },
                          { label: 'Lines', value: (result as unknown as WordCounterResult).lines },
                          { label: 'Paragraphs', value: (result as unknown as WordCounterResult).paragraphs },
                        ].map((stat, idx) => (
                          <div key={idx} className="card-base p-4 text-center">
                            <p className="text-[26px] font-bold text-accent">{stat.value}</p>
                            <p className="text-xs text-text-secondary font-medium uppercase tracking-wider mt-1">{stat.label}</p>
                          </div>
                        ))}
                      </div>
                      <div className="flex justify-center">
                        <Button onClick={handleReset}>Analyze Another File</Button>
                      </div>
                    </div>
                  ) : status !== 'idle' ? (
                    <ProgressBar
                      progress={progress}
                      status={status}
                      error={error}
                      onReset={handleReset}
                    />
                  ) : (
                    <>
                      <DropZone
                        onFilesSelected={handleFilesSelected}
                        accept={acceptFormats}
                        multiple={false}
                        maxSize={MAX_FILE_SIZE.document}
                      />
                      {files.length > 0 && (
                        <div className="space-y-4 mt-4 w-full">
                          <div className="card-base p-4 text-left">
                            <p className="text-xs text-text-muted uppercase tracking-wider mb-2">
                              Selected file
                            </p>
                            {files.map((f, i) => (
                              <div
                                key={i}
                                className="flex items-center gap-2 text-sm text-text-secondary py-1"
                              >
                                <svg className="w-4 h-4 text-accent flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                                </svg>
                                <span className="truncate">{f.name}</span>
                                <span className="text-text-muted text-xs ml-auto">
                                  {(f.size / 1024 / 1024).toFixed(1)} MB
                                </span>
                              </div>
                            ))}
                          </div>
                          {/* Turnstile Widget */}
                          <div className="flex justify-center my-4">
                            <Turnstile
                              siteKey={process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY || '1x00000000000000000000AA'}
                              onSuccess={(token) => setTurnstileToken(token)}
                              onExpire={() => setTurnstileToken(null)}
                              onError={() => setTurnstileToken(null)}
                            />
                          </div>

                          <div className="flex justify-center">
                            <Button
                              size="lg"
                              onClick={handleConvert}
                              disabled={!turnstileToken}
                            >
                              Analyze File
                            </Button>
                          </div>
                        </div>
                      )}
                    </>
                  )}
                </div>
              )}
            </div>
          )}

          {/* ========================================================================= */}
          {/* 5. COLOR PALETTE EXTRACTOR                                                */}
          {/* ========================================================================= */}
          {tool.slug === 'color-palette' && (
            <div className="space-y-6">
              {status === 'completed' && result && (result as unknown as ColorPaletteResult).palette ? (
                <div className="space-y-6">
                  <div className="card-base overflow-hidden">
                    {/* Palette Bar Grid */}
                    <div className="flex h-36 w-full">
                      {(result as unknown as ColorPaletteResult).palette.map((color: ColorPaletteColor, idx: number) => (
                        <div
                          key={idx}
                          className="h-full flex-1 relative group cursor-pointer transition-all duration-300 hover:flex-[1.4]"
                          style={{ backgroundColor: color.hex }}
                          onClick={() => copyToClipboard(color.hex, `Hex Color ${color.hex}`)}
                        >
                          <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center text-white">
                            <span className="font-mono font-bold text-sm tracking-wider">{color.hex}</span>
                            <span className="text-xs mt-1">{color.percentage}%</span>
                            <span className="text-[10px] uppercase font-semibold mt-2 px-1.5 py-0.5 bg-white/20 rounded">Copy</span>
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Palette Swatches List */}
                    <div className="p-6 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                      {(result as unknown as ColorPaletteResult).palette.map((color: ColorPaletteColor, idx: number) => (
                        <div
                          key={idx}
                          onClick={() => copyToClipboard(color.hex, `Hex Color ${color.hex}`)}
                          className="flex items-center gap-3 p-3 bg-background border border-surface-border rounded-xl cursor-pointer hover:border-accent transition-all duration-200"
                        >
                          <div className="w-8 h-8 rounded-lg shadow-inner flex-shrink-0" style={{ backgroundColor: color.hex }} />
                          <div className="flex-1 min-w-0">
                            <p className="font-mono text-sm font-semibold text-text-primary">{color.hex}</p>
                            <p className="text-xs text-text-muted">{color.percentage}% of image</p>
                          </div>
                          <svg className="w-4 h-4 text-text-muted hover:text-accent flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2" />
                          </svg>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="flex justify-center">
                    <Button onClick={handleReset}>Extract Another Palette</Button>
                  </div>
                </div>
              ) : status !== 'idle' ? (
                <ProgressBar
                  progress={progress}
                  status={status}
                  error={error}
                  onReset={handleReset}
                />
              ) : (
                <>
                  <DropZone
                    onFilesSelected={handleFilesSelected}
                    accept={acceptFormats}
                    multiple={false}
                    maxSize={MAX_FILE_SIZE.image}
                  />
                  {files.length > 0 && (
                    <div className="space-y-4 mt-4 w-full">
                      <div className="card-base p-4 text-left">
                        <p className="text-xs text-text-muted uppercase tracking-wider mb-2">
                          Selected file
                        </p>
                        {files.map((f, i) => (
                          <div
                            key={i}
                            className="flex items-center gap-2 text-sm text-text-secondary py-1"
                          >
                            <svg className="w-4 h-4 text-accent flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                            </svg>
                            <span className="truncate">{f.name}</span>
                            <span className="text-text-muted text-xs ml-auto">
                              {(f.size / 1024 / 1024).toFixed(1)} MB
                            </span>
                          </div>
                        ))}
                      </div>
                      {/* Turnstile Widget */}
                      <div className="flex justify-center my-4">
                        <Turnstile
                          siteKey={process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY || '1x00000000000000000000AA'}
                          onSuccess={(token) => setTurnstileToken(token)}
                          onExpire={() => setTurnstileToken(null)}
                          onError={() => setTurnstileToken(null)}
                        />
                      </div>

                      <div className="flex justify-center">
                        <Button
                          size="lg"
                          onClick={handleConvert}
                          disabled={!turnstileToken}
                        >
                          Extract Color Palette
                        </Button>
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          )}

          {/* ========================================================================= */}
          {/* 6. STANDARD Uploader / Flow (e.g. background removal & other normal tools) */}
          {/* ========================================================================= */}
          {tool.slug !== 'link-shortener' &&
            tool.slug !== 'seo-generator' &&
            tool.slug !== 'qr-generator' &&
            tool.slug !== 'word-counter' &&
            tool.slug !== 'color-palette' && (
              <>
                {status !== 'idle' ? (
                  <ProgressBar
                    progress={progress}
                    status={status}
                    error={error}
                    downloadUrl={result?.downloadUrl}
                    fileName={result?.fileName}
                    fileSize={result?.fileSize}
                    outputFormat={result?.outputFormat}
                    expiresAt={result?.expiresAt}
                    onReset={handleReset}
                  />
                ) : (
                  <>
                    {tool.inputFormats.includes('url') ? (
                      <div className="card-base p-6 space-y-5">
                        <div>
                          <label className="text-xs font-semibold text-text-muted uppercase tracking-wider block mb-2">
                            Media URL
                          </label>
                          <input
                            type="url"
                            placeholder="Paste YouTube, Reels, TikTok, or Shorts link here..."
                            value={url}
                            onChange={(e) => setUrl(e.target.value)}
                            className="w-full bg-background border border-surface-border rounded-xl px-4 py-3.5 text-base text-text-primary focus:outline-none focus:ring-2 focus:ring-accent placeholder:text-text-muted transition-all"
                          />
                        </div>

                        {/* Tool-specific Options */}
                        {tool.options && tool.options.length > 0 && (
                          <div className="space-y-4 pt-2">
                            {tool.options.map((opt) => (
                              <div key={opt.name}>
                                {opt.type === 'select' && opt.choices && (
                                  <Select
                                    label={opt.label}
                                    options={opt.choices}
                                    value={options[opt.name] || String(opt.defaultValue)}
                                    onChange={(e) =>
                                      setOptions((prev) => ({
                                        ...prev,
                                        [opt.name]: e.target.value,
                                      }))
                                    }
                                  />
                                )}
                              </div>
                            ))}
                          </div>
                        )}

                        {/* Turnstile Widget */}
                        <div className="flex justify-center my-4">
                          <Turnstile
                            siteKey={process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY || '1x00000000000000000000AA'}
                            onSuccess={(token) => setTurnstileToken(token)}
                            onExpire={() => setTurnstileToken(null)}
                            onError={() => setTurnstileToken(null)}
                          />
                        </div>

                        <div className="flex justify-center pt-2">
                          <Button
                            size="lg"
                            onClick={handleConvert}
                            disabled={!url || !turnstileToken}
                          >
                            Download & Convert
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <>
                        <DropZone
                          onFilesSelected={handleFilesSelected}
                          accept={acceptFormats}
                          multiple={tool.multiFile}
                          maxSize={MAX_FILE_SIZE[tool.category as ConversionCategory]}
                        />

                        {files.length > 0 && (
                          <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="space-y-5"
                          >
                            {/* File List */}
                            <div className="card-base p-4">
                              <p className="text-xs text-text-muted uppercase tracking-wider mb-2">
                                Selected {files.length === 1 ? 'file' : 'files'}
                              </p>
                              {files.map((f, i) => (
                                <div
                                  key={i}
                                  className="flex items-center gap-2 text-sm text-text-secondary py-1"
                                >
                                  <svg className="w-4 h-4 text-accent flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                                  </svg>
                                  <span className="truncate">{f.name}</span>
                                  <span className="text-text-muted text-xs ml-auto">
                                    {(f.size / 1024 / 1024).toFixed(1)} MB
                                  </span>
                                </div>
                              ))}
                            </div>

                            {/* Format Picker */}
                            {tool.outputFormats.length > 1 && (
                              <FormatPicker
                                inputFormats={tool.inputFormats.filter((f) => f !== '*')}
                                outputFormats={tool.outputFormats}
                                inputFormat={inputFormat}
                                outputFormat={outputFormat}
                                onInputChange={setInputFormat}
                                onOutputChange={setOutputFormat}
                              />
                            )}

                            {/* Tool Options */}
                            {tool.options && tool.options.length > 0 && (
                              <div className="card-base p-4 space-y-4">
                                <p className="text-xs text-text-muted uppercase tracking-wider">
                                  Options
                                </p>
                                {tool.options.map((opt) => (
                                  <div key={opt.name}>
                                    {opt.type === 'select' && opt.choices && (
                                      <Select
                                        label={opt.label}
                                        options={opt.choices}
                                        value={options[opt.name] || String(opt.defaultValue)}
                                        onChange={(e) =>
                                          setOptions((prev) => ({
                                            ...prev,
                                            [opt.name]: e.target.value,
                                          }))
                                        }
                                      />
                                    )}
                                    {opt.type === 'range' && (
                                      <div>
                                        <label className="text-xs font-medium text-text-secondary uppercase tracking-wider">
                                          {opt.label}: {options[opt.name] || opt.defaultValue}
                                        </label>
                                        <input
                                          type="range"
                                          min={opt.min}
                                          max={opt.max}
                                          step={opt.step}
                                          value={options[opt.name] || opt.defaultValue}
                                          onChange={(e) =>
                                            setOptions((prev) => ({
                                              ...prev,
                                              [opt.name]: e.target.value,
                                            }))
                                          }
                                          className="w-full mt-2 accent-accent"
                                        />
                                      </div>
                                    )}
                                    {opt.type === 'password' && (
                                      <div>
                                        <label className="text-xs font-medium text-text-secondary uppercase tracking-wider block mb-1.5">
                                          {opt.label}
                                        </label>
                                        <input
                                          type="password"
                                          value={options[opt.name] || String(opt.defaultValue)}
                                          onChange={(e) =>
                                            setOptions((prev) => ({
                                              ...prev,
                                              [opt.name]: e.target.value,
                                            }))
                                          }
                                          className="w-full bg-background border border-surface-border rounded-lg px-4 py-2.5 text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-accent"
                                        />
                                      </div>
                                    )}
                                    {opt.type === 'text' && (
                                      <div>
                                        <label className="text-xs font-medium text-text-secondary uppercase tracking-wider block mb-1.5">
                                          {opt.label}
                                        </label>
                                        <input
                                          type="text"
                                          value={options[opt.name] || String(opt.defaultValue)}
                                          onChange={(e) =>
                                            setOptions((prev) => ({
                                              ...prev,
                                              [opt.name]: e.target.value,
                                            }))
                                          }
                                          className="w-full bg-background border border-surface-border rounded-lg px-4 py-2.5 text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-accent"
                                        />
                                      </div>
                                    )}
                                    {opt.type === 'number' && (
                                      <div>
                                        <label className="text-xs font-medium text-text-secondary uppercase tracking-wider block mb-1.5">
                                          {opt.label}
                                        </label>
                                        <input
                                          type="number"
                                          min={opt.min}
                                          max={opt.max}
                                          value={options[opt.name] || opt.defaultValue}
                                          onChange={(e) =>
                                            setOptions((prev) => ({
                                              ...prev,
                                              [opt.name]: e.target.value,
                                            }))
                                          }
                                          className="w-full bg-background border border-surface-border rounded-lg px-4 py-2.5 text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-accent"
                                        />
                                      </div>
                                    )}
                                  </div>
                                ))}
                              </div>
                            )}

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
                                disabled={!turnstileToken}
                              >
                                {tool.action === 'merge'
                                  ? `Merge ${files.length} files`
                                  : tool.action === 'compress'
                                  ? 'Compress'
                                  : tool.action === 'extract'
                                  ? 'Extract'
                                  : `Convert to ${outputFormat.toUpperCase()}`}
                              </Button>
                            </div>
                          </motion.div>
                        )}
                      </>
                    )}

                  </>
                )}
              </>
            )}
        </motion.div>
      </div>
    </div>
  );
}
