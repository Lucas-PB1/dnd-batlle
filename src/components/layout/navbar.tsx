'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/cn';

interface Session {
  username: string;
  role: 'admin' | 'judge';
  displayName: string;
}

export function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const [session, setSession] = useState<Session | null>(null);

  useEffect(() => {
    fetch('/api/auth/me')
      .then((res) => res.json())
      .then((data) => setSession(data.session))
      .catch(() => setSession(null));
  }, [pathname]);

  async function logout() {
    await fetch('/api/auth/logout', { method: 'POST' });
    setSession(null);
    router.push('/');
    router.refresh();
  }

  return (
    <header className="border-card-border/80 bg-background/80 sticky top-0 z-50 border-b backdrop-blur-md">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4">
        <Link href="/" className="group flex items-center gap-3">
          <span className="bg-accent/15 text-accent ring-accent/30 flex h-9 w-9 items-center justify-center rounded-xl ring-1">
            ⚔
          </span>
          <div>
            <p className="text-sm font-semibold tracking-wide">Arena Duel</p>
            <p className="text-muted text-xs">D&D 5.5 · Ranking</p>
          </div>
        </Link>

        <nav className="flex items-center gap-2">
          <Link
            href="/"
            className={cn(
              'rounded-lg px-3 py-2 text-sm transition hover:bg-white/5',
              pathname === '/' && 'text-accent',
            )}
          >
            Ranking
          </Link>

          {session?.role === 'judge' && (
            <Link
              href="/judge"
              className={cn(
                'rounded-lg px-3 py-2 text-sm transition hover:bg-white/5',
                pathname.startsWith('/judge') && 'text-accent',
              )}
            >
              Juiz
            </Link>
          )}

          {session?.role === 'admin' && (
            <Link
              href="/admin"
              className={cn(
                'rounded-lg px-3 py-2 text-sm transition hover:bg-white/5',
                pathname.startsWith('/admin') && 'text-accent',
              )}
            >
              Admin
            </Link>
          )}

          {session ? (
            <div className="border-card-border ml-2 flex items-center gap-2 border-l pl-3">
              <span className="text-muted hidden text-sm sm:inline">
                {session.displayName}
              </span>
              <Button variant="ghost" onClick={logout}>
                Sair
              </Button>
            </div>
          ) : (
            <Link href="/login">
              <Button variant="secondary">Entrar</Button>
            </Link>
          )}
        </nav>
      </div>
    </header>
  );
}
