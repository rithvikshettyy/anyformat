import Link from 'next/link';
import HomeConverter from '@/components/conversion/HomeConverter';
import { TOOLS, CATEGORIES, CATEGORY_ICONS } from '@/lib/tools-registry';

/**
 * Optimized Home Landing Page.
 * Converted to React Server Component (RSC) to serve static HTML instantly
 * and eliminate JavaScript bundle overhead for layout, text, and SVG rendering.
 */
export default function HomePage() {
  return (
    <div className="relative">
      {/* Background Grid */}
      <div className="absolute inset-0 grid-bg pointer-events-none" />

      {/* Hero Section */}
      <section className="relative max-w-6xl mx-auto px-4 sm:px-6 pt-16 md:pt-24 pb-12">
        <div className="text-center mb-10 md:mb-14">
          <h1 className="text-4xl md:text-6xl font-bold tracking-tight mb-4">
            Convert any file,{' '}
            <span className="text-accent">free forever</span>
          </h1>
          <p className="text-text-secondary text-lg md:text-xl max-w-2xl mx-auto leading-relaxed">
            Self-hosted file conversion with zero tracking, no limits, and
            complete privacy. Your files never leave your server.
          </p>
        </div>

        {/* Upload Zone (Client Component) */}
        <div className="max-w-2xl mx-auto">
          <HomeConverter />
        </div>
      </section>

      {/* Tool Categories */}
      <section className="relative max-w-6xl mx-auto px-4 sm:px-6 py-16 md:py-24">
        <div className="text-center mb-10">
          <h2 className="text-2xl md:text-3xl font-bold mb-3">
            All the tools you need
          </h2>
          <p className="text-text-secondary max-w-lg mx-auto">
            {TOOLS.length} conversion tools across {CATEGORIES.length} categories, all running on your own
            server
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {CATEGORIES.map((cat) => (
            <div key={cat.slug}>
              <Link href={`/tools?category=${cat.slug}`}>
                <div className="card-base p-6 group cursor-pointer h-full hover:-translate-y-1 transition-transform duration-300">
                  <div
                    className="w-12 h-12 rounded-xl flex items-center justify-center mb-4 transition-colors"
                    style={{
                      backgroundColor: `${cat.color}15`,
                    }}
                  >
                    <svg
                      className="w-6 h-6 transition-colors"
                      style={{ color: cat.color }}
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={1.5}
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d={CATEGORY_ICONS[cat.slug]}
                      />
                    </svg>
                  </div>
                  <h3 className="text-text-primary font-semibold mb-1 group-hover:text-accent transition-colors">
                    {cat.name}
                  </h3>
                  <p className="text-text-muted text-sm leading-relaxed">
                    {cat.description}
                  </p>
                  <p
                    className="text-xs font-medium mt-3"
                    style={{ color: cat.color }}
                  >
                    {TOOLS.filter((t) => t.category === cat.slug).length} tools →
                  </p>
                </div>
              </Link>
            </div>
          ))}
        </div>
      </section>

      {/* How It Works */}
      <section className="relative max-w-6xl mx-auto px-4 sm:px-6 py-16 md:py-24">
        <div className="text-center mb-10">
          <h2 className="text-2xl md:text-3xl font-bold mb-3">
            Simple as 1-2-3
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-3xl mx-auto">
          {[
            {
              step: '01',
              title: 'Upload',
              desc: 'Drag and drop your file or browse to select',
              icon: 'M12 16.5V9.75m0 0l3 3m-3-3l-3 3M6.75 19.5a4.5 4.5 0 01-1.41-8.775 5.25 5.25 0 0110.338-2.32 3 3 0 013.438 3.42A3.75 3.75 0 0118 19.5H6.75z',
            },
            {
              step: '02',
              title: 'Convert',
              desc: 'Choose your output format and hit convert',
              icon: 'M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99',
            },
            {
              step: '03',
              title: 'Download',
              desc: 'Your converted file is ready for download',
              icon: 'M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3',
            },
          ].map((item) => (
            <div key={item.step} className="text-center hover:scale-105 transition-transform duration-300">
              <div className="w-14 h-14 rounded-2xl bg-surface border border-surface-border mx-auto mb-4 flex items-center justify-center">
                <svg
                  className="w-6 h-6 text-accent"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={1.5}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d={item.icon}
                  />
                </svg>
              </div>
              <div className="text-xs font-mono text-accent mb-2">
                {item.step}
              </div>
              <h3 className="text-text-primary font-semibold mb-1">
                {item.title}
              </h3>
              <p className="text-text-muted text-sm">{item.desc}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
