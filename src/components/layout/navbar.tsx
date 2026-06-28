'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/cn';

interface Session {
  username: string;
  email: string;
  roles: ('admin' | 'judge' | 'player')[];
  displayName: string;
}

interface NavLink {
  href: string;
  label: string;
  active: boolean;
}

function NavLinks({
  links,
  onNavigate,
  vertical = false,
}: {
  links: NavLink[];
  onNavigate?: () => void;
  vertical?: boolean;
}) {
  return (
    <>
      {links.map((link) => (
        <Link
          key={link.href}
          href={link.href}
          onClick={onNavigate}
          className={cn(
            'rounded-lg px-3 py-2.5 text-sm transition hover:bg-white/5',
            vertical ? 'block w-full' : 'whitespace-nowrap',
            link.active && 'text-accent bg-white/5',
          )}
        >
          {link.label}
        </Link>
      ))}
    </>
  );
}

export function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const [session, setSession] = useState<Session | null>(null);
  const [menuPath, setMenuPath] = useState<string | null>(null);
  const menuOpen = menuPath === pathname;

  useEffect(() => {
    fetch('/api/auth/me')
      .then((res) => res.json())
      .then((data) => setSession(data.session))
      .catch(() => setSession(null));
  }, [pathname]);

  useEffect(() => {
    document.body.style.overflow = menuOpen ? 'hidden' : '';
    return () => {
      document.body.style.overflow = '';
    };
  }, [menuOpen]);

  function closeMenu() {
    setMenuPath(null);
  }

  function toggleMenu() {
    setMenuPath((current) => (current === pathname ? null : pathname));
  }

  async function logout() {
    await fetch('/api/auth/logout', { method: 'POST' });
    setSession(null);
    router.push('/');
    router.refresh();
  }

  const publicLinks: NavLink[] = [
    { href: '/', label: 'Ranking', active: pathname === '/' },
    { href: '/regras', label: 'Regras', active: pathname === '/regras' },
  ];

  const roleLinks: NavLink[] = [
    ...(session?.roles?.includes('player')
      ? [{ href: '/player', label: 'Meu painel', active: pathname.startsWith('/player') }]
      : []),
    ...(session?.roles?.includes('judge')
      ? [{ href: '/judge', label: 'Juiz', active: pathname.startsWith('/judge') }]
      : []),
    ...(session?.roles?.includes('admin')
      ? [{ href: '/admin', label: 'Admin', active: pathname.startsWith('/admin') }]
      : []),
  ];

  const allLinks = [...publicLinks, ...roleLinks];

  return (
    <header className="border-card-border/80 bg-background/80 sticky top-0 z-50 border-b backdrop-blur-md">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-3 sm:py-4">
        <Link href="/" className="group flex min-w-0 shrink items-center gap-2 sm:gap-3">
          <span className="bg-accent/15 text-accent ring-accent/30 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ring-1">
            ⚔
          </span>
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold tracking-wide">Arena Duel</p>
            <p className="text-muted hidden text-xs sm:block">D&D 5.5 · Ranking</p>
          </div>
        </Link>

        <nav className="hidden items-center gap-1 md:flex">
          <NavLinks links={allLinks} />
          {session ? (
            <div className="border-card-border ml-2 flex items-center gap-2 border-l pl-3">
              <span className="text-muted hidden text-sm lg:inline">{session.displayName}</span>
              <Button variant="ghost" onClick={logout}>
                Sair
              </Button>
            </div>
          ) : (
            <Link href="/login" className="ml-1">
              <Button variant="secondary">Entrar</Button>
            </Link>
          )}
        </nav>

        <button
          type="button"
          className="border-card-border hover:bg-white/5 inline-flex h-10 w-10 items-center justify-center rounded-lg border md:hidden"
          aria-expanded={menuOpen}
          aria-label={menuOpen ? 'Fechar menu' : 'Abrir menu'}
          onClick={toggleMenu}
        >
          <span className="sr-only">{menuOpen ? 'Fechar' : 'Menu'}</span>
          {menuOpen ? (
            <svg
              viewBox="0 0 24 24"
              className="h-5 w-5"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              aria-hidden="true"
            >
              <path strokeLinecap="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          ) : (
            <svg
              viewBox="0 0 24 24"
              className="h-5 w-5"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              aria-hidden="true"
            >
              <path strokeLinecap="round" d="M4 7h16M4 12h16M4 17h16" />
            </svg>
          )}
        </button>
      </div>

      {menuOpen && (
        <>
          <button
            type="button"
            className="fixed inset-0 z-40 bg-black/50 md:hidden"
            aria-label="Fechar menu"
            onClick={closeMenu}
          />
          <nav className="border-card-border bg-background fixed inset-x-0 top-[61px] z-50 max-h-[calc(100dvh-61px)] overflow-y-auto border-b px-4 py-4 md:hidden">
            <div className="space-y-1">
              <NavLinks links={allLinks} onNavigate={closeMenu} vertical />
            </div>
            <div className="border-card-border mt-4 border-t pt-4">
              {session ? (
                <div className="space-y-3">
                  <p className="text-muted text-sm">{session.displayName}</p>
                  <Button variant="ghost" className="w-full" onClick={logout}>
                    Sair
                  </Button>
                </div>
              ) : (
                <Link href="/login" onClick={closeMenu}>
                  <Button variant="secondary" className="w-full">
                    Entrar
                  </Button>
                </Link>
              )}
            </div>
          </nav>
        </>
      )}
    </header>
  );
}
