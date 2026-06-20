'use client';

import { useSession, signIn } from 'next-auth/react';
import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { useHistory } from '@/hooks/useHistory';
import { formatFileSize } from '@/lib/constants';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';

interface ShortLink {
  shortCode: string;
  longUrl: string;
  createdAt: string;
  clicks: number;
}

type Tab = 'conversions' | 'links' | 'billing';

export default function DashboardPage() {
  const { data: session, status: authStatus } = useSession();
  const { entries, clearHistory } = useHistory();
  const [tab, setTab] = useState<Tab>('conversions');
  const [links, setLinks] = useState<ShortLink[]>([]);
  const [linksLoading, setLinksLoading] = useState(false);
  const tier = (session?.user as { tier?: string } | undefined)?.tier || 'free';

  const fetchLinks = useCallback(async () => {
    setLinksLoading(true);
    try {
      const res = await fetch('/api/links');
      const data = await res.json();
      if (data.success) setLinks(data.data || []);
    } catch {}
    setLinksLoading(false);
  }, []);

  useEffect(() => {
    if (tab === 'links' && session) fetchLinks();
  }, [tab, session, fetchLinks]);

  async function handleDeleteLink(code: string) {
    await fetch('/api/links', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code }),
    });
    setLinks((prev) => prev.filter((l) => l.shortCode !== code));
  }

  if (authStatus === 'loading') {
    return (
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-20 text-center">
        <div className="animate-spin w-8 h-8 border-2 border-accent border-t-transparent rounded-full mx-auto" />
      </div>
    );
  }

  if (!session) {
    return (
      <div className="relative">
        <div className="absolute inset-0 grid-bg pointer-events-none" />
        <div className="relative max-w-lg mx-auto px-4 sm:px-6 py-20 text-center">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="card-base p-10">
            <h1 className="text-2xl font-bold mb-2">Sign in required</h1>
            <p className="text-text-secondary mb-6">Sign in to view your dashboard</p>
            <Button size="lg" onClick={() => signIn('google')}>Sign in with Google</Button>
          </motion.div>
        </div>
      </div>
    );
  }

  return (
    <div className="relative">
      <div className="absolute inset-0 grid-bg pointer-events-none" />
      <div className="relative max-w-6xl mx-auto px-4 sm:px-6 py-12 md:py-20">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
          <h1 className="text-3xl font-bold mb-1">Dashboard</h1>
          <p className="text-text-secondary">Manage your conversions, links, and billing</p>
        </motion.div>

        {/* Tabs */}
        <div className="flex gap-1 mb-6 bg-surface rounded-xl p-1 border border-surface-border w-fit">
          {(['conversions', 'links', 'billing'] as Tab[]).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors capitalize ${
                tab === t ? 'bg-accent text-white' : 'text-text-muted hover:text-text-primary'
              }`}
            >
              {t}
            </button>
          ))}
        </div>

        {/* Conversions Tab */}
        {tab === 'conversions' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <div className="flex justify-end mb-4">
              {entries.length > 0 && (
                <Button variant="ghost" size="sm" onClick={clearHistory}>Clear history</Button>
              )}
            </div>
            {entries.length === 0 ? (
              <div className="card-base p-12 text-center">
                <h3 className="text-lg font-semibold mb-1">No conversions yet</h3>
                <p className="text-text-muted text-sm mb-4">Convert a file to see it here</p>
                <Button variant="secondary" size="sm" onClick={() => window.location.href = '/tools'}>Browse tools</Button>
              </div>
            ) : (
              <div className="card-base overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-surface-border">
                        <th className="text-left text-xs font-medium text-text-muted uppercase tracking-wider px-5 py-3">Date</th>
                        <th className="text-left text-xs font-medium text-text-muted uppercase tracking-wider px-5 py-3">Tool</th>
                        <th className="text-left text-xs font-medium text-text-muted uppercase tracking-wider px-5 py-3">Input</th>
                        <th className="text-left text-xs font-medium text-text-muted uppercase tracking-wider px-5 py-3">Size</th>
                        <th className="text-left text-xs font-medium text-text-muted uppercase tracking-wider px-5 py-3">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {entries.map((entry, i) => (
                        <motion.tr key={entry.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.02 }} className="border-b border-surface-border last:border-b-0 hover:bg-surface-hover/50">
                          <td className="px-5 py-3.5 text-sm text-text-muted whitespace-nowrap">
                            {new Date(entry.timestamp).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                          </td>
                          <td className="px-5 py-3.5 text-sm text-text-primary font-medium">{entry.toolName}</td>
                          <td className="px-5 py-3.5 text-sm text-text-secondary max-w-[200px] truncate">{entry.inputFile}</td>
                          <td className="px-5 py-3.5 text-sm text-text-muted">{formatFileSize(entry.outputSize)}</td>
                          <td className="px-5 py-3.5">
                            <Badge variant={entry.status === 'completed' ? 'success' : entry.status === 'error' ? 'error' : 'warning'}>{entry.status}</Badge>
                          </td>
                        </motion.tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </motion.div>
        )}

        {/* Links Tab */}
        {tab === 'links' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            {linksLoading ? (
              <div className="text-center py-12">
                <div className="animate-spin w-8 h-8 border-2 border-accent border-t-transparent rounded-full mx-auto" />
              </div>
            ) : links.length === 0 ? (
              <div className="card-base p-12 text-center">
                <h3 className="text-lg font-semibold mb-1">No short links yet</h3>
                <p className="text-text-muted text-sm mb-4">Create a short link to see it here</p>
                <Button variant="secondary" size="sm" onClick={() => window.location.href = '/tools/utility/link-shortener'}>Create link</Button>
              </div>
            ) : (
              <div className="card-base overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-surface-border">
                        <th className="text-left text-xs font-medium text-text-muted uppercase tracking-wider px-5 py-3">Short Code</th>
                        <th className="text-left text-xs font-medium text-text-muted uppercase tracking-wider px-5 py-3">Destination</th>
                        <th className="text-left text-xs font-medium text-text-muted uppercase tracking-wider px-5 py-3">Clicks</th>
                        <th className="text-left text-xs font-medium text-text-muted uppercase tracking-wider px-5 py-3">Created</th>
                        <th className="text-left text-xs font-medium text-text-muted uppercase tracking-wider px-5 py-3"></th>
                      </tr>
                    </thead>
                    <tbody>
                      {links.map((link, i) => (
                        <motion.tr key={link.shortCode} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.02 }} className="border-b border-surface-border last:border-b-0 hover:bg-surface-hover/50">
                          <td className="px-5 py-3.5 text-sm">
                            <a href={`/s/${link.shortCode}`} target="_blank" rel="noopener noreferrer" className="text-accent hover:underline font-mono">
                              /s/{link.shortCode}
                            </a>
                          </td>
                          <td className="px-5 py-3.5 text-sm text-text-secondary max-w-[300px] truncate">{link.longUrl}</td>
                          <td className="px-5 py-3.5 text-sm text-text-primary font-semibold">{link.clicks}</td>
                          <td className="px-5 py-3.5 text-sm text-text-muted whitespace-nowrap">
                            {new Date(link.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                          </td>
                          <td className="px-5 py-3.5">
                            <button onClick={() => handleDeleteLink(link.shortCode)} className="text-red-400 hover:text-red-300 text-xs">Delete</button>
                          </td>
                        </motion.tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </motion.div>
        )}

        {/* Billing Tab */}
        {tab === 'billing' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <div className="card-base p-8 max-w-lg">
              <h3 className="text-lg font-bold mb-4">Current Plan</h3>
              <div className="flex items-center gap-3 mb-6">
                <span className={`px-3 py-1 rounded-full text-sm font-semibold ${
                  tier === 'enterprise' ? 'bg-accent/20 text-accent' : 'bg-surface-hover text-text-muted'
                }`}>
                  {tier === 'enterprise' ? 'Enterprise' : 'Free'}
                </span>
                {tier === 'enterprise' && <span className="text-text-muted text-sm">₹599/month</span>}
              </div>
              <div className="space-y-2 text-sm text-text-secondary mb-6">
                <p>Short links: {tier === 'enterprise' ? 'Unlimited' : '15/month'}</p>
                <p>Custom aliases: {tier === 'enterprise' ? 'Yes' : 'No'}</p>
                <p>File conversions: Unlimited</p>
              </div>
              {tier !== 'enterprise' && (
                <Button size="sm" onClick={() => window.location.href = '/pricing'}>Upgrade to Enterprise</Button>
              )}
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}
