import Link from 'next/link';
import { ShieldCheckIcon } from '@heroicons/react/24/outline';
import { ARENA_COPY } from '@/shared/constants/arena-copy';

const FOOTER_LINKS = [
  { href: '/', label: 'Coliseu' },
  { href: '/regras', label: 'Regras' },
  { href: '/login', label: 'Entrar' },
] as const;

export function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="border-card-border/70 bg-card/50 mt-10 border-t backdrop-blur-sm">
      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-10">
        <div className="grid gap-8 sm:grid-cols-[1.4fr_1fr_1fr]">
          <div className="space-y-3">
            <Link href="/" className="group inline-flex items-center gap-2.5">
              <span className="bg-accent/15 text-accent ring-accent/25 flex h-9 w-9 items-center justify-center rounded-xl ring-1">
                <ShieldCheckIcon className="h-5 w-5" aria-hidden />
              </span>
              <div>
                <p className="text-sm font-semibold tracking-wide">{ARENA_COPY.siteName}</p>
                <p className="text-muted text-xs">D&D 5.5 · temporada do coliseu</p>
              </div>
            </Link>
            <p className="text-muted max-w-sm text-sm leading-relaxed">
              Duelos 1v1, panteão de glória e crônicas registradas pelo árbitro da arena.
            </p>
          </div>

          <div>
            <p className="text-accent-secondary mb-3 text-xs font-semibold tracking-[0.15em] uppercase">
              Navegação
            </p>
            <ul className="space-y-2">
              {FOOTER_LINKS.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-muted hover:text-accent text-sm transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <p className="text-emerald mb-3 text-xs font-semibold tracking-[0.15em] uppercase">
              Temporada
            </p>
            <ul className="text-muted space-y-2 text-sm">
              <li>Heróis e aventureiros no panteão</li>
              <li>Duelos classificados valem glória</li>
              <li>Faixas A, B e C no tom das regras</li>
            </ul>
          </div>
        </div>

        <div className="border-card-border/50 text-muted mt-8 flex flex-col items-center justify-between gap-2 border-t pt-6 text-xs sm:flex-row">
          <p>
            © {year} {ARENA_COPY.siteName}
          </p>
          <p className="text-accent/80">{ARENA_COPY.siteTagline}</p>
        </div>
      </div>
    </footer>
  );
}
