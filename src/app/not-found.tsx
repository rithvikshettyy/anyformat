import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="relative min-h-[60vh] flex items-center justify-center">
      <div className="absolute inset-0 grid-bg pointer-events-none" />
      <div className="relative text-center px-4">
        <h1 className="text-8xl font-bold text-accent mb-4">404</h1>
        <h2 className="text-2xl font-semibold text-text-primary mb-2">Page not found</h2>
        <p className="text-text-muted mb-8 max-w-md mx-auto">
          The page you&apos;re looking for doesn&apos;t exist or has been moved.
        </p>
        <div className="flex gap-4 justify-center">
          <Link
            href="/"
            className="px-6 py-3 bg-accent hover:bg-accent-hover text-white font-semibold rounded-xl transition-colors"
          >
            Go Home
          </Link>
          <Link
            href="/tools"
            className="px-6 py-3 border border-surface-border hover:bg-surface-hover font-semibold rounded-xl transition-colors"
          >
            Browse Tools
          </Link>
        </div>
      </div>
    </div>
  );
}
