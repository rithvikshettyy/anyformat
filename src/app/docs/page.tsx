'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  BookOpen,
  Terminal,
  Shield,
  HelpCircle,
  ChevronDown,
  Lock,
  Check,
  Copy,
  AlertCircle,
  Server,
  Trash2,
  Settings
} from 'lucide-react';

// Navigation configuration
const NAV_ITEMS = [
  {
    id: 'getting-started',
    label: 'Getting Started',
    icon: BookOpen,
  },
  {
    id: 'tools-reference',
    label: 'Tools Reference',
    icon: Settings,
    subItems: [
      { id: 'tools-pdf', label: 'PDF Tools' },
      { id: 'tools-image', label: 'Image Tools' },
      { id: 'tools-document', label: 'Document Tools' },
      { id: 'tools-video', label: 'Video Tools' },
      { id: 'tools-audio', label: 'Audio Tools' },
      { id: 'tools-archive', label: 'Archive Tools' },
    ]
  },
  {
    id: 'api-reference',
    label: 'API Reference',
    icon: Terminal,
    subItems: [
      { id: 'api-convert', label: 'Conversion Endpoints' },
      { id: 'api-job', label: 'Job Status Endpoint' },
      { id: 'api-download', label: 'Download Endpoint' },
    ]
  },
  {
    id: 'privacy-security',
    label: 'Privacy & Security',
    icon: Shield,
  },
  {
    id: 'faq',
    label: 'FAQ',
    icon: HelpCircle,
  }
];

// FAQ Configuration
const FAQS = [
  {
    q: 'Is AnyFormat really free to use?',
    a: 'Yes, absolutely. AnyFormat is 100% free, open-source, and self-hosted. There are no hidden subscription fees, premium tiers, or artificial limits on the number of conversions you can perform.'
  },
  {
    q: 'Are my uploaded files safe?',
    a: 'Yes. Privacy is a core design principle of AnyFormat. Your uploaded files are stored in temporarily isolated, UUID-named directories inside the local system disk. We never send your files to external APIs, cloud servers, or third-party agencies. All operations run strictly on-premise.'
  },
  {
    q: 'What is the file size limit?',
    a: 'To guarantee high availability and prevent Denial-of-Service attacks on server resources, there is a global file size limit of 50MB per upload across all tools and formats.'
  },
  {
    q: 'Do I need to sign up or create an account?',
    a: 'No account is required to convert files. All basic services are accessible immediately. User authentication is only available for dashboard preferences and custom history logging if configured by the instance administrator.'
  },
  {
    q: 'How long are my files stored on the server?',
    a: 'Uploaded and output files are automatically purged from the server temp directory after 30 minutes. This is enforced by a automated system cleanup task. You can also delete files manually immediately after downloading them.'
  },
  {
    q: 'Does AnyFormat add watermarks to my outputs?',
    a: 'Never. Unlike standard online conversion portals, AnyFormat respects the integrity of your documents and media. Your files are converted in their native formats without watermarks, modifications, or promotional overlays.'
  },
  {
    q: 'Can I deploy and host AnyFormat on my own server?',
    a: 'Yes! AnyFormat is designed for easy self-hosting. The codebase is distributed under an open source license, allowing you to deploy it on your local server, home lab, or private cloud using Docker, Node, or PM2.'
  },
  {
    q: 'Is there an API available for developer integrations?',
    a: 'Yes. AnyFormat includes a complete developer API. You can programmatically enqueue file conversions, check their real-time execution status, and download the resulting buffers. Refer to the API Reference section of this guide for endpoint payloads.'
  }
];

// Code copy block helper
const CopyCodeBlock = ({ code, language }: { code: string; language: string }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="relative group my-4">
      <div className="flex items-center justify-between px-4 py-1.5 bg-[#141414] border-t border-x border-surface-border rounded-t-lg text-xs font-mono text-text-secondary select-none">
        <span>{language}</span>
        <button
          onClick={handleCopy}
          className="text-text-secondary hover:text-text-primary transition-colors flex items-center gap-1"
          aria-label="Copy code block"
        >
          {copied ? (
            <>
              <Check className="w-3.5 h-3.5 text-green-500" />
              <span className="text-green-500">Copied!</span>
            </>
          ) : (
            <>
              <Copy className="w-3.5 h-3.5" />
              <span>Copy</span>
            </>
          )}
        </button>
      </div>
      <pre className="overflow-x-auto p-4 bg-[#181818] border border-surface-border rounded-b-lg text-sm font-mono text-accent leading-relaxed max-h-96">
        <code>{code}</code>
      </pre>
    </div>
  );
};

export default function DocsPage() {
  const [activeSection, setActiveSection] = useState('getting-started');
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  // IntersectionObserver to sync sidebar navigation with content scroll
  useEffect(() => {
    const elementIds: string[] = [];
    NAV_ITEMS.forEach((item) => {
      elementIds.push(item.id);
      if (item.subItems) {
        item.subItems.forEach((sub) => elementIds.push(sub.id));
      }
    });

    const observerOptions = {
      root: null,
      rootMargin: '-15% 0px -70% 0px',
      threshold: 0,
    };

    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          setActiveSection(entry.target.id);
        }
      });
    }, observerOptions);

    elementIds.forEach((id) => {
      const el = document.getElementById(id);
      if (el) observer.observe(el);
    });

    return () => {
      elementIds.forEach((id) => {
        const el = document.getElementById(id);
        if (el) observer.unobserve(el);
      });
    };
  }, []);

  const handleNavClick = (id: string) => {
    setActiveSection(id);
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({
        behavior: 'smooth',
        block: 'start'
      });
    }
  };

  return (
    <div className="relative min-h-screen bg-background">
      {/* Decorative background grid pattern */}
      <div className="absolute inset-0 grid-bg pointer-events-none opacity-50" />

      <div className="relative max-w-6xl mx-auto px-4 sm:px-6 py-12 md:py-16 flex flex-col lg:flex-row gap-10">
        
        {/* Left Sticky Sidebar Navigation */}
        <aside className="lg:w-64 flex-shrink-0 lg:sticky lg:top-24 lg:self-start lg:max-h-[calc(100vh-8rem)] overflow-y-auto z-10 pr-2">
          
          {/* Mobile navigation tab scroll (visible only on small screens) */}
          <div className="lg:hidden sticky top-16 bg-background/95 backdrop-blur border-b border-surface-border -mx-4 px-4 py-3 flex gap-2 overflow-x-auto no-scrollbar z-30">
            {NAV_ITEMS.map((item) => {
              const Icon = item.icon;
              const isActive = activeSection === item.id || item.subItems?.some(s => s.id === activeSection);
              return (
                <button
                  key={item.id}
                  onClick={() => handleNavClick(item.id)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-colors border
                    ${isActive
                      ? 'bg-accent/15 border-accent text-accent'
                      : 'bg-surface border-surface-border text-text-secondary hover:text-text-primary'
                    }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  {item.label}
                </button>
              );
            })}
          </div>

          {/* Desktop Nav List */}
          <nav className="hidden lg:block space-y-6">
            {NAV_ITEMS.map((item) => {
              const Icon = item.icon;
              const isParentActive = activeSection === item.id || item.subItems?.some(sub => sub.id === activeSection);

              return (
                <div key={item.id} className="space-y-1">
                  <button
                    onClick={() => handleNavClick(item.id)}
                    className={`flex items-center gap-2.5 w-full text-left py-2 px-3 rounded-lg text-sm font-medium transition-all duration-200
                      ${isParentActive 
                        ? 'bg-accent/10 text-accent font-semibold border-l-2 border-accent pl-2.5'
                        : 'text-text-secondary hover:text-text-primary hover:bg-surface-hover'
                      }`}
                  >
                    <Icon className="w-4.5 h-4.5" />
                    <span>{item.label}</span>
                  </button>

                  {/* Sub-navigation items for category and route specifics */}
                  {item.subItems && (
                    <div className="pl-8 border-l border-surface-border ml-5 space-y-1 mt-1">
                      {item.subItems.map((sub) => (
                        <button
                          key={sub.id}
                          onClick={() => handleNavClick(sub.id)}
                          className={`block w-full text-left py-1 text-xs transition-colors duration-150
                            ${activeSection === sub.id
                              ? 'text-accent font-medium'
                              : 'text-text-secondary hover:text-text-primary'
                            }`}
                        >
                          {sub.label}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </nav>
        </aside>

        {/* Right Content Area */}
        <main className="flex-1 min-w-0 space-y-16 lg:space-y-24 text-text-primary">

          {/* Header Title Section */}
          <div className="space-y-4">
            <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-gradient">
              Documentation & Guides
            </h1>
            <p className="text-text-secondary text-lg max-w-3xl leading-relaxed">
              Welcome to the AnyFormat guide. Below you will find detailed documentation on getting started, tools capabilities, internal REST API endpoints, and our self-hosted privacy architecture.
            </p>
          </div>

          <hr className="border-surface-border" />

          {/* 1. GETTING STARTED */}
          <section id="getting-started" className="scroll-mt-24 space-y-6">
            <div className="flex items-center gap-3">
              <BookOpen className="w-7 h-7 text-accent" />
              <h2 className="text-2xl md:text-3xl font-bold tracking-tight">Getting Started</h2>
            </div>
            
            <div className="space-y-4 text-text-secondary leading-relaxed">
              <p>
                AnyFormat is a private, lightweight, and modern **self-hosted file converter** designed to replace remote online services. It processes all tasks directly on your server, ensuring that sensitive documents and assets never leave your control.
              </p>
              <p>
                No third-party trackers, no metadata harvesting, and no subscription walls. Just professional-grade, byte-level file conversion utilities available at your disposal.
              </p>

              <h3 className="text-lg font-semibold text-text-primary mt-6">How to Use AnyFormat</h3>
              <ol className="list-decimal pl-5 space-y-2 mt-2">
                <li>
                  <span className="text-text-primary font-medium">Select a Tool:</span> Navigate to the <a href="/tools" className="text-accent hover:underline">Tools</a> catalog and select a conversion or utility tool matching your file format.
                </li>
                <li>
                  <span className="text-text-primary font-medium">Upload File:</span> Drag and drop or browse to select your source file. All formats are validated strictly by their magic numbers (byte arrays) on upload.
                </li>
                <li>
                  <span className="text-text-primary font-medium">Configure Options:</span> Fine-tune options such as quality, resolution, output bitrate, page rotations, or passwords.
                </li>
                <li>
                  <span className="text-text-primary font-medium">Convert & Download:</span> Click &quot;Convert&quot; to enqueue the task. A spring-animated progress bar will monitor the real-time execution status. Click download once complete.
                </li>
              </ol>

              {/* Warning Alert about Size Limit */}
              <div className="flex gap-3 p-4 bg-accent-glow border border-accent/25 rounded-xl mt-6 text-sm text-text-primary">
                <AlertCircle className="w-5 h-5 text-accent flex-shrink-0" />
                <div>
                  <span className="font-semibold text-accent">Notice:</span> A global file size limit of <span className="font-semibold text-accent">50MB</span> is enforced across all tools to guarantee server stability. Uploads exceeding this threshold will be automatically rejected.
                </div>
              </div>
            </div>
          </section>

          <hr className="border-surface-border" />

          {/* 2. TOOLS REFERENCE */}
          <section id="tools-reference" className="scroll-mt-24 space-y-8">
            <div className="flex items-center gap-3">
              <Settings className="w-7 h-7 text-accent" />
              <h2 className="text-2xl md:text-3xl font-bold tracking-tight">Tools Reference</h2>
            </div>
            
            <p className="text-text-secondary leading-relaxed">
              AnyFormat offers 6 core categories containing specialized file conversion utilities. All conversion processes are managed via an asynchronous queue system running on Redis and Bull with a concurrency factor of 3 to maximize processing throughput.
            </p>

            {/* PDF Tools Reference */}
            <div id="tools-pdf" className="scroll-mt-24 p-6 bg-surface border border-surface-border rounded-xl space-y-4">
              <div className="flex items-center justify-between border-b border-surface-border pb-3">
                <h3 className="text-xl font-bold text-text-primary flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#e03d2f]" />
                  PDF Tools
                </h3>
                <span className="text-xs bg-[#e03d2f]/10 text-[#e03d2f] border border-[#e03d2f]/25 px-2.5 py-0.5 rounded-full font-medium">Limit: 50MB</span>
              </div>
              <p className="text-sm text-text-secondary">
                Professional PDF generation, editing, compressing, and encryption suite utilizing secure CLI binaries and high-performance libraries.
              </p>
              
              <div className="overflow-x-auto mt-4">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-surface-border text-text-secondary font-medium">
                      <th className="py-2.5 pr-4">Tool</th>
                      <th className="py-2.5 px-4">Description</th>
                      <th className="py-2.5 px-4">Inputs</th>
                      <th className="py-2.5 pl-4">Outputs</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-surface-border text-text-secondary">
                    <tr>
                      <td className="py-3 pr-4 font-semibold text-text-primary">Merge PDFs</td>
                      <td className="py-3 px-4">Combines multiple PDF documents into a single sequential file.</td>
                      <td className="py-3 px-4">.pdf</td>
                      <td className="py-3 pl-4">.pdf</td>
                    </tr>
                    <tr>
                      <td className="py-3 pr-4 font-semibold text-text-primary">Split PDF</td>
                      <td className="py-3 px-4">Extracts defined page ranges or separates pages.</td>
                      <td className="py-3 px-4">.pdf</td>
                      <td className="py-3 pl-4">.pdf</td>
                    </tr>
                    <tr>
                      <td className="py-3 pr-4 font-semibold text-text-primary">Compress PDF</td>
                      <td className="py-3 px-4">Reduces file sizes using Ghostscript engine rendering (72 to 300 DPI).</td>
                      <td className="py-3 px-4">.pdf</td>
                      <td className="py-3 pl-4">.pdf</td>
                    </tr>
                    <tr>
                      <td className="py-3 pr-4 font-semibold text-text-primary">PDF to Word</td>
                      <td className="py-3 px-4">Converts complex PDF text structures into editable DOCX format via LibreOffice.</td>
                      <td className="py-3 px-4">.pdf</td>
                      <td className="py-3 pl-4">.docx</td>
                    </tr>
                    <tr>
                      <td className="py-3 pr-4 font-semibold text-text-primary">PDF to Excel</td>
                      <td className="py-3 px-4">Converts document tables to XLSX spreadsheets headlessly.</td>
                      <td className="py-3 px-4">.pdf</td>
                      <td className="py-3 pl-4">.xlsx</td>
                    </tr>
                    <tr>
                      <td className="py-3 pr-4 font-semibold text-text-primary">PPT to PDF</td>
                      <td className="py-3 px-4">Converts PowerPoint slide decks into PDF documents.</td>
                      <td className="py-3 px-4">.ppt, .pptx, .odp</td>
                      <td className="py-3 pl-4">.pdf</td>
                    </tr>
                    <tr>
                      <td className="py-3 pr-4 font-semibold text-text-primary">Protect PDF</td>
                      <td className="py-3 px-4">Encrypts PDF document using secure AES-256 password protection.</td>
                      <td className="py-3 px-4">.pdf</td>
                      <td className="py-3 pl-4">.pdf</td>
                    </tr>
                    <tr>
                      <td className="py-3 pr-4 font-semibold text-text-primary">OCR PDF</td>
                      <td className="py-3 px-4">Recognizes text characters from scans or image pages using Tesseract.</td>
                      <td className="py-3 px-4">.pdf, .jpg, .png</td>
                      <td className="py-3 pl-4">.pdf, .txt</td>
                    </tr>
                    <tr>
                      <td className="py-3 pr-4 font-semibold text-text-primary">Rotate / Watermark</td>
                      <td className="py-3 px-4">Alters page layouts or overlays structured text stamps onto PDF backgrounds.</td>
                      <td className="py-3 px-4">.pdf</td>
                      <td className="py-3 pl-4">.pdf</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            {/* Image Tools Reference */}
            <div id="tools-image" className="scroll-mt-24 p-6 bg-surface border border-surface-border rounded-xl space-y-4">
              <div className="flex items-center justify-between border-b border-surface-border pb-3">
                <h3 className="text-xl font-bold text-text-primary flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#3b82f6]" />
                  Image Tools
                </h3>
                <span className="text-xs bg-[#3b82f6]/10 text-[#3b82f6] border border-[#3b82f6]/25 px-2.5 py-0.5 rounded-full font-medium">Limit: 50MB</span>
              </div>
              <p className="text-sm text-text-secondary">
                Powerful rasterizing, processing, resizing, and analysis tools utilizing Sharp and AI segmentation engines.
              </p>
              
              <div className="overflow-x-auto mt-4">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-surface-border text-text-secondary font-medium">
                      <th className="py-2.5 pr-4">Tool</th>
                      <th className="py-2.5 px-4">Description</th>
                      <th className="py-2.5 px-4">Inputs</th>
                      <th className="py-2.5 pl-4">Outputs</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-surface-border text-text-secondary">
                    <tr>
                      <td className="py-3 pr-4 font-semibold text-text-primary">Convert Image</td>
                      <td className="py-3 px-4">Transfers formats between modern raster assets and vector images.</td>
                      <td className="py-3 px-4">.jpg, .png, .webp, .avif, .svg, .gif, .tiff, .bmp</td>
                      <td className="py-3 pl-4">.jpg, .png, .webp, .avif</td>
                    </tr>
                    <tr>
                      <td className="py-3 pr-4 font-semibold text-text-primary">Compress & Resize</td>
                      <td className="py-3 px-4">Reduces byte weight via custom resolution scales or compression factor.</td>
                      <td className="py-3 px-4">.jpg, .png, .webp, .avif, .gif, .tiff, .bmp</td>
                      <td className="py-3 pl-4">.jpg, .png, .webp</td>
                    </tr>
                    <tr>
                      <td className="py-3 pr-4 font-semibold text-text-primary">EXIF Purger</td>
                      <td className="py-3 px-4">Irreversibly purges GPS coordinate logs, camera metadata, and creator profiles.</td>
                      <td className="py-3 px-4">.jpg, .png, .webp, .tiff, .pdf, .docx</td>
                      <td className="py-3 pl-4">Matches Input</td>
                    </tr>
                    <tr>
                      <td className="py-3 pr-4 font-semibold text-text-primary">Remove Background</td>
                      <td className="py-3 px-4">Automatically segments foreground and purges background image using AI models.</td>
                      <td className="py-3 px-4">.jpg, .png, .webp</td>
                      <td className="py-3 pl-4">.png (transparent)</td>
                    </tr>
                    <tr>
                      <td className="py-3 pr-4 font-semibold text-text-primary">Palette Extractor</td>
                      <td className="py-3 px-4">Analyzes image to return hexadecimal arrays of dominant color codes.</td>
                      <td className="py-3 px-4">.jpg, .png, .webp</td>
                      <td className="py-3 pl-4">.json (hex array)</td>
                    </tr>
                    <tr>
                      <td className="py-3 pr-4 font-semibold text-text-primary">QR Generator</td>
                      <td className="py-3 px-4">Generates scannable QR Codes from custom inputs.</td>
                      <td className="py-3 px-4">Raw text / URLs</td>
                      <td className="py-3 pl-4">.png</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            {/* Document Tools Reference */}
            <div id="tools-document" className="scroll-mt-24 p-6 bg-surface border border-surface-border rounded-xl space-y-4">
              <div className="flex items-center justify-between border-b border-surface-border pb-3">
                <h3 className="text-xl font-bold text-text-primary flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#8b5cf6]" />
                  Document Tools
                </h3>
                <span className="text-xs bg-[#8b5cf6]/10 text-[#8b5cf6] border border-[#8b5cf6]/25 px-2.5 py-0.5 rounded-full font-medium">Limit: 50MB</span>
              </div>
              <p className="text-sm text-text-secondary">
                Document standard conversions, LaTeX code compilation helpers, and analytical text processing tools.
              </p>
              
              <div className="overflow-x-auto mt-4">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-surface-border text-text-secondary font-medium">
                      <th className="py-2.5 pr-4">Tool</th>
                      <th className="py-2.5 px-4">Description</th>
                      <th className="py-2.5 px-4">Inputs</th>
                      <th className="py-2.5 pl-4">Outputs</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-surface-border text-text-secondary">
                    <tr>
                      <td className="py-3 pr-4 font-semibold text-text-primary">Document to PDF</td>
                      <td className="py-3 px-4">Converts Office documents (Word, Excel, PPT) to PDF.</td>
                      <td className="py-3 px-4">.docx, .xlsx, .pptx, .doc, .xls, .ppt, .odt, .ods, .odp</td>
                      <td className="py-3 pl-4">.pdf</td>
                    </tr>
                    <tr>
                      <td className="py-3 pr-4 font-semibold text-text-primary">PDF to Document</td>
                      <td className="py-3 px-4">Extracts PDF contents back to standard Office format structures.</td>
                      <td className="py-3 px-4">.pdf</td>
                      <td className="py-3 pl-4">.docx, .xlsx, .pptx</td>
                    </tr>
                    <tr>
                      <td className="py-3 pr-4 font-semibold text-text-primary">To LaTeX Converter</td>
                      <td className="py-3 px-4">Compiles Word and PDF structures into formatted scientific LaTeX scripts.</td>
                      <td className="py-3 px-4">.docx, .pdf</td>
                      <td className="py-3 pl-4">.tex</td>
                    </tr>
                    <tr>
                      <td className="py-3 pr-4 font-semibold text-text-primary">OCR to Markdown</td>
                      <td className="py-3 px-4">Performs OCR text extraction, compiling paragraphs into clean markdown syntax.</td>
                      <td className="py-3 px-4">.pdf, .jpg, .png</td>
                      <td className="py-3 pl-4">.md</td>
                    </tr>
                    <tr>
                      <td className="py-3 pr-4 font-semibold text-text-primary">Word Counter</td>
                      <td className="py-3 px-4">Analyzes documents or files to count words, characters, and sentences.</td>
                      <td className="py-3 px-4">Raw text, .txt, .md, .docx, .pdf</td>
                      <td className="py-3 pl-4">.json (word metrics)</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            {/* Video Tools Reference */}
            <div id="tools-video" className="scroll-mt-24 p-6 bg-surface border border-surface-border rounded-xl space-y-4">
              <div className="flex items-center justify-between border-b border-surface-border pb-3">
                <h3 className="text-xl font-bold text-text-primary flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#f59e0b]" />
                  Video Tools
                </h3>
                <span className="text-xs bg-[#f59e0b]/10 text-[#f59e0b] border border-[#f59e0b]/25 px-2.5 py-0.5 rounded-full font-medium">Limit: 50MB</span>
              </div>
              <p className="text-sm text-text-secondary">
                Video encoding, visual compression, and media streams extraction powered by FFmpeg.
              </p>
              
              <div className="overflow-x-auto mt-4">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-surface-border text-text-secondary font-medium">
                      <th className="py-2.5 pr-4">Tool</th>
                      <th className="py-2.5 px-4">Description</th>
                      <th className="py-2.5 px-4">Inputs</th>
                      <th className="py-2.5 pl-4">Outputs</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-surface-border text-text-secondary">
                    <tr>
                      <td className="py-3 pr-4 font-semibold text-text-primary">Convert Video</td>
                      <td className="py-3 px-4">Encodes video streams to high-compatibility formats.</td>
                      <td className="py-3 px-4">.mp4, .mov, .avi, .mkv, .webm</td>
                      <td className="py-3 pl-4">.mp4, .mov, .avi, .mkv, .webm, .gif</td>
                    </tr>
                    <tr>
                      <td className="py-3 pr-4 font-semibold text-text-primary">Compress Video</td>
                      <td className="py-3 px-4">Reduces visual bitrate using Constant Rate Factor (CRF 18-51).</td>
                      <td className="py-3 px-4">.mp4, .mov, .avi, .mkv, .webm</td>
                      <td className="py-3 pl-4">.mp4</td>
                    </tr>
                    <tr>
                      <td className="py-3 pr-4 font-semibold text-text-primary">Extract Audio</td>
                      <td className="py-3 px-4">Strips visual components and exports the audio track directly.</td>
                      <td className="py-3 px-4">.mp4, .mov, .avi, .mkv, .webm</td>
                      <td className="py-3 pl-4">.mp3, .wav, .flac, .aac, .ogg</td>
                    </tr>
                    <tr>
                      <td className="py-3 pr-4 font-semibold text-text-primary">Social Downloader</td>
                      <td className="py-3 px-4">Downloads audio/video media streams from remote URLs (YouTube, Reels, TikTok).</td>
                      <td className="py-3 px-4">Valid video URLs</td>
                      <td className="py-3 pl-4">.mp4, .mp3</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            {/* Audio Tools Reference */}
            <div id="tools-audio" className="scroll-mt-24 p-6 bg-surface border border-surface-border rounded-xl space-y-4">
              <div className="flex items-center justify-between border-b border-surface-border pb-3">
                <h3 className="text-xl font-bold text-text-primary flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#10b981]" />
                  Audio Tools
                </h3>
                <span className="text-xs bg-[#10b981]/10 text-[#10b981] border border-[#10b981]/25 px-2.5 py-0.5 rounded-full font-medium">Limit: 50MB</span>
              </div>
              <p className="text-sm text-text-secondary">
                Audio transcoding engine allowing fine bitrate and frequency compression via FFmpeg.
              </p>
              
              <div className="overflow-x-auto mt-4">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-surface-border text-text-secondary font-medium">
                      <th className="py-2.5 pr-4">Tool</th>
                      <th className="py-2.5 px-4">Description</th>
                      <th className="py-2.5 px-4">Inputs</th>
                      <th className="py-2.5 pl-4">Outputs</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-surface-border text-text-secondary">
                    <tr>
                      <td className="py-3 pr-4 font-semibold text-text-primary">Convert Audio</td>
                      <td className="py-3 px-4">Transcodes audio codecs, supporting variable bitrates (96k to 320k).</td>
                      <td className="py-3 px-4">.mp3, .wav, .flac, .aac, .ogg, .m4a, .wma</td>
                      <td className="py-3 pl-4">.mp3, .wav, .flac, .aac, .ogg</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            {/* Archive Tools Reference */}
            <div id="tools-archive" className="scroll-mt-24 p-6 bg-surface border border-surface-border rounded-xl space-y-4">
              <div className="flex items-center justify-between border-b border-surface-border pb-3">
                <h3 className="text-xl font-bold text-text-primary flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#ec4899]" />
                  Archive Tools
                </h3>
                <span className="text-xs bg-[#ec4899]/10 text-[#ec4899] border border-[#ec4899]/25 px-2.5 py-0.5 rounded-full font-medium">Limit: 50MB</span>
              </div>
              <p className="text-sm text-text-secondary">
                High-efficiency archive creation and extraction utilities securing files compression.
              </p>
              
              <div className="overflow-x-auto mt-4">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-surface-border text-text-secondary font-medium">
                      <th className="py-2.5 pr-4">Tool</th>
                      <th className="py-2.5 px-4">Description</th>
                      <th className="py-2.5 px-4">Inputs</th>
                      <th className="py-2.5 pl-4">Outputs</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-surface-border text-text-secondary">
                    <tr>
                      <td className="py-3 pr-4 font-semibold text-text-primary">Create Archive</td>
                      <td className="py-3 px-4">Compresses any combination of supported uploads into zipped containers.</td>
                      <td className="py-3 px-4">Any Supported Files</td>
                      <td className="py-3 pl-4">.zip, .tar, .tar.gz</td>
                    </tr>
                    <tr>
                      <td className="py-3 pr-4 font-semibold text-text-primary">Extract Archive</td>
                      <td className="py-3 px-4">Decompresses compressed folder archives into standard directories.</td>
                      <td className="py-3 px-4">.zip, .rar, .7z, .tar, .gz, .tar.gz</td>
                      <td className="py-3 pl-4">.zip (contents)</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </section>

          <hr className="border-surface-border" />

          {/* 3. API REFERENCE */}
          <section id="api-reference" className="scroll-mt-24 space-y-8">
            <div className="flex items-center gap-3">
              <Terminal className="w-7 h-7 text-accent" />
              <h2 className="text-2xl md:text-3xl font-bold tracking-tight">API Reference</h2>
            </div>
            
            <p className="text-text-secondary leading-relaxed">
              AnyFormat features a robust internal REST API that powers its conversion frontend. You can query these routes directly from custom scripts or external client integrations. All API payloads accept and return JSON schemas.
            </p>

            {/* Conversion Endpoints */}
            <div id="api-convert" className="scroll-mt-24 space-y-6">
              <h3 className="text-xl font-bold text-text-primary">Conversion API Endpoints</h3>
              <p className="text-sm text-text-secondary">
                To run file conversions, submit a `POST` request to the endpoint corresponding to the tool&apos;s category. The body must be encoded as `multipart/form-data`.
              </p>

              {/* Endpoint table */}
              <div className="overflow-x-auto bg-surface border border-surface-border rounded-xl p-5">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-surface-border text-text-secondary font-medium">
                      <th className="py-2.5 pr-4">Method</th>
                      <th className="py-2.5 px-4">Endpoint</th>
                      <th className="py-2.5 pl-4">Category Action Type</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-surface-border text-text-secondary font-mono">
                    <tr>
                      <td className="py-3 pr-4"><span className="text-green-500 font-bold bg-green-500/10 px-2 py-0.5 rounded">POST</span></td>
                      <td className="py-3 px-4 text-text-primary">/api/convert/image</td>
                      <td className="py-3 pl-4">Image operations (`convert`, `resize`, `compress`, `bg-remove`)</td>
                    </tr>
                    <tr>
                      <td className="py-3 pr-4"><span className="text-green-500 font-bold bg-green-500/10 px-2 py-0.5 rounded">POST</span></td>
                      <td className="py-3 px-4 text-text-primary">/api/convert/pdf</td>
                      <td className="py-3 pl-4">PDF operations (`merge`, `split`, `compress`, `protect`, `ocr`)</td>
                    </tr>
                    <tr>
                      <td className="py-3 pr-4"><span className="text-green-500 font-bold bg-green-500/10 px-2 py-0.5 rounded">POST</span></td>
                      <td className="py-3 px-4 text-text-primary">/api/convert/document</td>
                      <td className="py-3 pl-4">Document operations (`convert`, `to-latex`, `ocr-to-md`)</td>
                    </tr>
                    <tr>
                      <td className="py-3 pr-4"><span className="text-green-500 font-bold bg-green-500/10 px-2 py-0.5 rounded">POST</span></td>
                      <td className="py-3 px-4 text-text-primary">/api/convert/video</td>
                      <td className="py-3 pl-4">Video operations (`convert`, `compress`, `extract`, `download`)</td>
                    </tr>
                    <tr>
                      <td className="py-3 pr-4"><span className="text-green-500 font-bold bg-green-500/10 px-2 py-0.5 rounded">POST</span></td>
                      <td className="py-3 px-4 text-text-primary">/api/convert/audio</td>
                      <td className="py-3 pl-4">Audio operations (`convert`)</td>
                    </tr>
                    <tr>
                      <td className="py-3 pr-4"><span className="text-green-500 font-bold bg-green-500/10 px-2 py-0.5 rounded">POST</span></td>
                      <td className="py-3 px-4 text-text-primary">/api/convert/archive</td>
                      <td className="py-3 pl-4">Archive operations (`create`, `extract`)</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* API Request details */}
              <div className="space-y-4">
                <h4 className="text-sm font-semibold text-text-primary">Multipart Form Parameters</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs text-text-secondary leading-relaxed">
                  <div className="bg-[#141414] border border-surface-border p-4 rounded-lg space-y-2">
                    <div className="font-semibold text-text-primary">Request Headers</div>
                    <code className="block text-accent font-mono bg-background p-1.5 rounded">Content-Type: multipart/form-data</code>
                    <div className="text-text-muted mt-2">Specify the boundary string automatically generated by your HTTP client or browser form.</div>
                  </div>
                  <div className="bg-[#141414] border border-surface-border p-4 rounded-lg space-y-2">
                    <div className="font-semibold text-text-primary">Common Parameters</div>
                    <ul className="list-disc pl-4 space-y-1">
                      <li><span className="font-mono text-accent font-semibold">file</span> (Required): The input file buffer. Supports array uploads for PDF merge / Image-to-PDF / Archive create.</li>
                      <li><span className="font-mono text-accent">action</span> (Optional): Action subtype.</li>
                      <li><span className="font-mono text-accent">outputFormat</span> (Optional): Target format.</li>
                    </ul>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="text-sm font-semibold text-text-primary">Example Fetch Call</div>
                  <CopyCodeBlock
                    language="javascript"
                    code={`const formData = new FormData();
formData.append('file', imageFile); // File binary
formData.append('action', 'convert');
formData.append('outputFormat', 'webp');
formData.append('quality', '85');

const response = await fetch('/api/convert/image', {
  method: 'POST',
  body: formData
});

const result = await response.json();
console.log(result);`}
                  />
                </div>

                <div className="space-y-2">
                  <div className="text-sm font-semibold text-text-primary">Immediate JSON Response</div>
                  <p className="text-xs text-text-secondary">
                    All conversion endpoints return an asynchronous job ID immediately instead of blocking the request:
                  </p>
                  <CopyCodeBlock
                    language="json"
                    code={`{
  "success": true,
  "data": {
    "jobId": "73d72b22-835b-426c-8438-fb36696dbf1a"
  }
}`}
                  />
                </div>
              </div>
            </div>

            {/* Job Status Endpoint */}
            <div id="api-job" className="scroll-mt-24 space-y-4">
              <h3 className="text-xl font-bold text-text-primary flex items-center gap-2">
                <span className="text-blue-500 font-bold bg-blue-500/10 px-2 py-0.5 rounded font-mono text-xs">GET</span>
                /api/job/[jobId]
              </h3>
              <p className="text-sm text-text-secondary">
                Poll this endpoint to query the real-time execution status, progress percentage, and final download metadata of your conversion job.
              </p>

              <div className="space-y-4">
                <div>
                  <div className="text-sm font-semibold text-text-primary">Example Response: Job in Progress</div>
                  <CopyCodeBlock
                    language="json"
                    code={`{
  "success": true,
  "data": {
    "id": "73d72b22-835b-426c-8438-fb36696dbf1a",
    "status": "active",
    "progress": 45,
    "result": null,
    "error": null
  }
}`}
                  />
                </div>

                <div>
                  <div className="text-sm font-semibold text-text-primary">Example Response: Job Completed</div>
                  <CopyCodeBlock
                    language="json"
                    code={`{
  "success": true,
  "data": {
    "id": "73d72b22-835b-426c-8438-fb36696dbf1a",
    "status": "completed",
    "progress": 100,
    "result": {
      "id": "9bb72a2b-2771-46da-bc43-23ff19ea81aa",
      "fileName": "converted.webp",
      "fileSize": 348210,
      "outputFormat": "webp",
      "downloadUrl": "/api/download/9bb72a2b-2771-46da-bc43-23ff19ea81aa",
      "expiresAt": 1781524922777
    },
    "error": null
  }
}`}
                  />
                </div>
              </div>
            </div>

            {/* Download Endpoint */}
            <div id="api-download" className="scroll-mt-24 space-y-4">
              <h3 className="text-xl font-bold text-text-primary flex items-center gap-2">
                <span className="text-blue-500 font-bold bg-blue-500/10 px-2 py-0.5 rounded font-mono text-xs">GET</span>
                /api/download/[fileId]
              </h3>
              <p className="text-sm text-text-secondary">
                Retrieves the binary file buffer directly. Returns correct MIME headers and triggers standard browser attachment downloads.
              </p>

              <div className="bg-[#141414] border border-surface-border p-4 rounded-lg text-xs space-y-2">
                <div className="font-semibold text-text-primary">HTTP Response Headers</div>
                <div className="font-mono text-accent space-y-1 bg-background p-2.5 rounded">
                  <div>Content-Type: [matches output MIME, e.g. image/webp]</div>
                  <div>Content-Disposition: attachment; filename=&quot;converted.webp&quot;</div>
                  <div>Cache-Control: no-store, must-revalidate</div>
                </div>
              </div>
            </div>
          </section>

          <hr className="border-surface-border" />

          {/* 4. PRIVACY & SECURITY */}
          <section id="privacy-security" className="scroll-mt-24 space-y-6">
            <div className="flex items-center gap-3">
              <Shield className="w-7 h-7 text-accent" />
              <h2 className="text-2xl md:text-3xl font-bold tracking-tight">Privacy & Security</h2>
            </div>
            
            <p className="text-text-secondary leading-relaxed">
              AnyFormat is engineered from the ground up to respect data residency guidelines and user privacy. Unlike traditional cloud conversion services, your documents are protected by strict hardware isolation boundaries.
            </p>

            {/* Security architecture grids */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
              <div className="p-5 bg-surface border border-surface-border rounded-xl space-y-2">
                <div className="flex items-center gap-2 font-semibold text-text-primary">
                  <Server className="w-5 h-5 text-accent" />
                  Local Server Processing
                </div>
                <p className="text-xs text-text-secondary leading-relaxed">
                  All file conversion processes occur locally on your server node. No third-party network requests are generated, preventing tracking, telemetry logging, or cloud storage risks.
                </p>
              </div>

              <div className="p-5 bg-surface border border-surface-border rounded-xl space-y-2">
                <div className="flex items-center gap-2 font-semibold text-text-primary">
                  <Lock className="w-5 h-5 text-accent" />
                  Isolated Disk Directories
                </div>
                <p className="text-xs text-text-secondary leading-relaxed">
                  Uploaded files are sanitized using standard character filters to prevent path traversal. They are stored inside randomly-generated UUID folders in `/tmp/anyformat`, isolating memory segments.
                </p>
              </div>

              <div className="p-5 bg-surface border border-surface-border rounded-xl space-y-2">
                <div className="flex items-center gap-2 font-semibold text-text-primary">
                  <Trash2 className="w-5 h-5 text-accent" />
                  Auto-purging Lifecycle
                </div>
                <p className="text-xs text-text-secondary leading-relaxed">
                  Temporary assets, upload buffers, and final outputs are marked with strict expiration logs. An automated background worker deletes all file folders precisely 30 minutes after creation.
                </p>
              </div>

              <div className="p-5 bg-surface border border-surface-border rounded-xl space-y-2">
                <div className="flex items-center gap-2 font-semibold text-text-primary">
                  <Shield className="w-5 h-5 text-accent" />
                  Zero Third-party Tracking
                </div>
                <p className="text-xs text-text-secondary leading-relaxed">
                  No cookie tracking engines, advertisement trackers, or analytics scripts are loaded in AnyFormat. Your usage remains 100% private, anonymous, and secured.
                </p>
              </div>
            </div>
          </section>

          <hr className="border-surface-border" />

          {/* 5. FAQ */}
          <section id="faq" className="scroll-mt-24 space-y-6">
            <div className="flex items-center gap-3">
              <HelpCircle className="w-7 h-7 text-accent" />
              <h2 className="text-2xl md:text-3xl font-bold tracking-tight">Frequently Asked Questions</h2>
            </div>
            
            <p className="text-text-secondary leading-relaxed">
              Find answers to common questions about AnyFormat&apos;s features, operations, and deployment parameters.
            </p>

            {/* Accordion List */}
            <div className="space-y-3 mt-6">
              {FAQS.map((faq, index) => {
                const isOpen = openFaq === index;
                return (
                  <div
                    key={index}
                    className="border border-surface-border bg-surface rounded-xl overflow-hidden transition-all duration-200"
                  >
                    <button
                      onClick={() => setOpenFaq(isOpen ? null : index)}
                      className="w-full flex items-center justify-between p-5 text-left font-medium text-sm md:text-base text-text-primary hover:bg-surface-hover transition-colors"
                    >
                      <span>{faq.q}</span>
                      <ChevronDown
                        className={`w-4 h-4 text-text-secondary transition-transform duration-200 ${isOpen ? 'rotate-180 text-accent' : ''}`}
                      />
                    </button>
                    
                    <AnimatePresence initial={false}>
                      {isOpen && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.2, ease: 'easeInOut' }}
                        >
                          <div className="px-5 pb-5 pt-1 text-xs md:text-sm text-text-secondary border-t border-surface-border/50 leading-relaxed bg-[#1b1b1b]">
                            {faq.a}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                );
              })}
            </div>
          </section>

        </main>
      </div>
    </div>
  );
}
