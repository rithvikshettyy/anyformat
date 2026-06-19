'use client';

import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { useSession, signIn, signOut } from 'next-auth/react';
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Button from '@/components/ui/Button';

const NAV_ITEMS = [
  { href: '/', label: 'Home' },
  { href: '/tools', label: 'Tools' },
  { href: '/pricing', label: 'Pricing' },
  { href: '/dashboard', label: 'Dashboard' },
  { href: '/docs', label: 'Docs' },
];

export default function Header() {
  const pathname = usePathname();
  const { data: session } = useSession();
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 border-b border-surface-border bg-background/80 backdrop-blur-xl">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center group">
            <span className="text-xl md:text-2xl font-bold text-text-primary tracking-tight">
              Any<span className="text-accent">Format</span>
            </span>
          </Link>

          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center gap-1">
            {NAV_ITEMS.map((item) => {
              const active = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`
                    relative px-4 py-2 rounded-lg text-sm font-medium transition-colors
                    ${active ? 'text-text-primary' : 'text-text-secondary hover:text-text-primary'}
                  `}
                >
                  {active && (
                    <motion.div
                      layoutId="nav-active"
                      className="absolute inset-0 bg-surface rounded-lg border border-surface-border"
                      transition={{
                        type: 'spring',
                        stiffness: 380,
                        damping: 30,
                      }}
                    />
                  )}
                  <span className="relative z-10">{item.label}</span>
                </Link>
              );
            })}
          </nav>

          {/* Auth + Mobile Toggle */}
          <div className="flex items-center gap-3">
            <a
              href="https://github.com/rithvikshettyy"
              target="_blank"
              rel="noopener noreferrer"
              className="text-text-secondary hover:text-text-primary transition-colors p-1.5 rounded-lg hover:bg-surface border border-transparent hover:border-surface-border flex items-center justify-center"
              aria-label="GitHub Profile"
            >
              <svg
                className="w-6 h-6"
                fill="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  fillRule="evenodd"
                  clipRule="evenodd"
                  d="M12 2C6.477 2 2 6.477 2 12c0 4.42 2.865 8.167 6.839 9.49.5.092.682-.217.682-.48 0-.237-.008-.866-.013-1.7-2.782.603-3.369-1.34-3.369-1.34-.454-1.156-1.11-1.464-1.11-1.464-.908-.62.069-.608.069-.608 1.003.07 1.531 1.03 1.531 1.03.892 1.529 2.341 1.087 2.91.831.092-.646.35-1.086.636-1.336-2.22-.253-4.555-1.11-4.555-4.943 0-1.091.39-1.984 1.029-2.683-.103-.253-.446-1.27.098-2.647 0 0 .84-.269 2.75 1.025A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.294 2.747-1.025 2.747-1.025.546 1.377.203 2.394.1 2.647.64.699 1.028 1.592 1.028 2.683 0 3.842-2.339 4.687-4.566 4.935.359.309.678.919.678 1.852 0 1.336-.012 2.415-.012 2.743 0 .267.18.577.688.479C19.138 20.164 22 16.418 22 12c0-5.523-4.477-10-10-10z"
                />
              </svg>
            </a>

            {session ? (
              <div className="hidden md:flex items-center gap-3">

                <div className="flex items-center gap-2">
                  {session.user?.image && (
                    <Image
                      src={session.user.image}
                      alt="User Avatar"
                      width={28}
                      height={28}
                      className="rounded-full border border-surface-border"
                    />
                  )}
                  <span className="text-sm text-text-secondary">
                    {session.user?.name?.split(' ')[0]}
                  </span>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => signOut()}
                >
                  Sign out
                </Button>
              </div>
            ) : (
              <Button
                variant="secondary"
                size="sm"
                className="hidden md:inline-flex"
                onClick={() => signIn('google')}
              >
                Sign in
              </Button>
            )}

            {/* Mobile hamburger */}
            <button
              className="md:hidden p-2 text-text-secondary hover:text-text-primary"
              onClick={() => setMobileOpen(!mobileOpen)}
              aria-label="Toggle menu"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                {mobileOpen ? (
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
                )}
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="md:hidden overflow-hidden border-t border-surface-border"
          >
            <nav className="px-4 py-4 space-y-1">
              {NAV_ITEMS.map((item) => {
                const active = pathname === item.href;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setMobileOpen(false)}
                    className={`
                      block px-4 py-2.5 rounded-lg text-sm font-medium transition-colors
                      ${active ? 'bg-surface text-text-primary' : 'text-text-secondary hover:text-text-primary hover:bg-surface'}
                    `}
                  >
                    {item.label}
                  </Link>
                );
              })}
              <div className="pt-2 border-t border-surface-border mt-2">
                {session ? (
                  <button
                    onClick={() => { signOut(); setMobileOpen(false); }}
                    className="block w-full text-left px-4 py-2.5 rounded-lg text-sm text-text-secondary hover:text-text-primary hover:bg-surface"
                  >
                    Sign out ({session.user?.name?.split(' ')[0]})
                  </button>
                ) : (
                  <button
                    onClick={() => { signIn('google'); setMobileOpen(false); }}
                    className="block w-full text-left px-4 py-2.5 rounded-lg text-sm text-text-secondary hover:text-text-primary hover:bg-surface"
                  >
                    Sign in with Google
                  </button>
                )}
              </div>
            </nav>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
