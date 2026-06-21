'use client';

import { useState, useMemo, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import ToolCard from './ToolCard';
import { AVAILABLE_TOOLS, CATEGORIES } from '@/lib/tools-registry';

interface ToolsListClientProps {
  initialCategory: string;
}

export default function ToolsListClient({ initialCategory }: ToolsListClientProps) {
  const router = useRouter();
  const pathname = usePathname();

  const [activeCategory, setActiveCategory] = useState(initialCategory);
  const [searchQuery, setSearchQuery] = useState('');

  // Sync state if initialCategory changes from URL navigation (e.g. forward/back buttons)
  useEffect(() => {
    setActiveCategory(initialCategory);
  }, [initialCategory]);

  const handleCategoryChange = (categorySlug: string) => {
    setActiveCategory(categorySlug);
    // Sync to URL query param
    if (categorySlug === 'all') {
      router.push(pathname);
    } else {
      router.push(`${pathname}?category=${categorySlug}`);
    }
  };

  const filteredTools = useMemo(() => {
    return AVAILABLE_TOOLS.filter((tool) => {
      // 1. Filter by category
      const matchesCategory = activeCategory === 'all' || tool.category === activeCategory;

      // 2. Filter by search query (name or description)
      const query = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !query ||
        tool.name.toLowerCase().includes(query) ||
        tool.description.toLowerCase().includes(query);

      return matchesCategory && matchesSearch;
    });
  }, [activeCategory, searchQuery]);

  return (
    <div className="space-y-8">
      {/* Search & Category Filter Header Row */}
      <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4 border-b border-surface-border pb-6">
        {/* Category Filter Tabs */}
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => handleCategoryChange('all')}
            className={`
              px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200
              ${
                activeCategory === 'all'
                  ? 'bg-accent text-white border border-transparent'
                  : 'bg-surface text-text-secondary hover:text-text-primary border border-surface-border hover:border-text-muted'
              }
            `}
          >
            All ({AVAILABLE_TOOLS.length})
          </button>
          {CATEGORIES.filter((cat) => AVAILABLE_TOOLS.some(t => t.category === cat.slug)).map((cat) => {
            const count = AVAILABLE_TOOLS.filter(t => t.category === cat.slug).length;
            return (
              <button
                key={cat.slug}
                onClick={() => handleCategoryChange(cat.slug)}
                className={`
                  px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200
                  ${
                    activeCategory === cat.slug
                      ? 'bg-accent text-white border border-transparent'
                      : 'bg-surface text-text-secondary hover:text-text-primary border border-surface-border hover:border-text-muted'
                  }
                `}
              >
                {cat.name} ({count})
              </button>
            );
          })}
        </div>

        {/* Search Bar Input */}
        <div className="relative w-full md:w-80">
          <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-text-muted">
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
          </span>
          <input
            type="text"
            placeholder="Search tools..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-surface border border-surface-border text-text-primary placeholder:text-text-muted rounded-lg pl-10 pr-8 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-accent transition-all duration-200"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute inset-y-0 right-0 flex items-center pr-2.5 text-text-muted hover:text-text-primary"
            >
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          )}
        </div>
      </div>

      {/* Tools Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {filteredTools.map((tool, i) => (
          <ToolCard key={`${tool.category}-${tool.slug}`} tool={tool} index={i} />
        ))}
      </div>

      {filteredTools.length === 0 && (
        <div className="text-center py-20">
          <p className="text-text-muted">No tools match your criteria</p>
        </div>
      )}
    </div>
  );
}
