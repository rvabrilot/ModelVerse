import { Brain } from 'lucide-react';
import Link from 'next/link';

export function AppHeader() {
  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto flex h-16 max-w-screen-2xl items-center px-4">
        <Link href="/" className="flex items-center space-x-2" aria-label="ModelVerse Home">
          <Brain className="h-7 w-7 text-primary" />
          <span className="text-xl font-semibold sm:text-2xl">ModelVerse</span>
        </Link>
        {/* Future navigation or user profile can go here */}
      </div>
    </header>
  );
}
