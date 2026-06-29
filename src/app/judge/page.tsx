'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardDescription, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/form';
import type { Duel } from '@/domain/entities';
import { ARENA_COPY, duelStatusLabel, duelTypeLabel } from '@/shared/constants/arena-copy';

export default function JudgePage() {
  const router = useRouter();
  const [duels, setDuels] = useState<Duel[]>([]);
  const [link, setLink] = useState('');
  const [loading, setLoading] = useState(true);

  async function fetchDuels() {
    const response = await fetch('/api/judge/duels');
    const data = await response.json();
    return (data.duels ?? []) as Duel[];
  }

  async function load() {
    setDuels(await fetchDuels());
  }

  useEffect(() => {
    let active = true;

    async function bootstrap() {
      const me = await fetch('/api/auth/me').then((r) => r.json());
      if (!active) return;
      if (!me.session?.roles?.includes('judge')) {
        router.push('/login');
        return;
      }

      const nextDuels = await fetchDuels();
      if (!active) return;
      setDuels(nextDuels);
      setLoading(false);
    }

    void bootstrap();
    return () => {
      active = false;
    };
  }, [router]);

  async function createDuel() {
    const response = await fetch('/api/judge/duels', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ isClassified: true }),
    });
    const data = await response.json();
    if (response.ok) {
      const url = `${window.location.origin}/duel/${data.duel.token}`;
      setLink(url);
      await load();
    }
  }

  async function copyLink() {
    if (link) await navigator.clipboard.writeText(link);
  }

  async function removeDuel(id: string) {
    if (!window.confirm(ARENA_COPY.confirmDeleteDuel)) return;

    const response = await fetch(`/api/judge/duels/${id}`, { method: 'DELETE' });
    if (!response.ok) {
      const data = await response.json();
      window.alert(data.error ?? 'Erro ao excluir');
      return;
    }

    await load();
  }

  if (loading) return <p className="text-muted">Carregando...</p>;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-accent text-sm tracking-[0.2em] uppercase">{ARENA_COPY.siteTagline}</p>
          <h1 className="text-2xl font-bold sm:text-3xl">{ARENA_COPY.judgePanel}</h1>
          <p className="text-muted">{ARENA_COPY.judgePanelSubtitle}</p>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
          <Link href="/regras" className="w-full sm:w-auto">
            <Button variant="secondary" className="w-full sm:w-auto">
              {ARENA_COPY.viewRules}
            </Button>
          </Link>
          <Button onClick={createDuel} className="w-full sm:w-auto">
            {ARENA_COPY.summonDuel}
          </Button>
        </div>
      </div>

      {link && (
        <Card>
          <CardTitle>{ARENA_COPY.convocationRune}</CardTitle>
          <CardDescription>{ARENA_COPY.convocationHint}</CardDescription>
          <div className="mt-3 flex flex-col gap-2 sm:flex-row">
            <code className="flex-1 break-all rounded-lg bg-stone-950/60 px-3 py-2 text-xs sm:text-sm">
              {link}
            </code>
            <Button variant="secondary" onClick={copyLink} className="w-full sm:w-auto">
              {ARENA_COPY.copyRune}
            </Button>
          </div>
        </Card>
      )}

      <Card>
        <CardTitle>{ARENA_COPY.judgeChronicles}</CardTitle>
        <div className="mt-4 space-y-3">
          {duels.length === 0 && (
            <p className="text-muted text-sm">{ARENA_COPY.noDuelsCreated}</p>
          )}
          {duels.map((duel) => (
            <div
              key={duel.id}
              className="border-card-border/70 flex flex-col gap-3 rounded-xl border bg-stone-950/30 p-4 sm:flex-row sm:items-center sm:justify-between"
            >
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="font-medium break-words">
                    {duel.playerA?.name ?? `${ARENA_COPY.cornerA} ?`} vs{' '}
                    {duel.playerB?.name ?? `${ARENA_COPY.cornerB} ?`}
                  </p>
                  <Badge tone={duel.status === 'completed' ? 'success' : 'warning'}>
                    {duelStatusLabel(duel.status)}
                  </Badge>
                </div>
                <p className="text-muted text-sm">
                  Runa {duel.token} · {duelTypeLabel(duel.isClassified)}
                  {duel.result
                    ? ` · ${duel.result.pointsA}/${duel.result.pointsB} ${ARENA_COPY.gloryShort}`
                    : ''}
                </p>
              </div>
              <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
                <Link href={`/duel/${duel.token}`} className="w-full sm:w-auto">
                  <Button variant="secondary" className="w-full sm:w-auto">
                    {ARENA_COPY.convocationRune}
                  </Button>
                </Link>
                <Link href={`/judge/duel/${duel.id}`} className="w-full sm:w-auto">
                  <Button className="w-full sm:w-auto">
                    {duel.status === 'completed'
                      ? ARENA_COPY.editChronicle
                      : ARENA_COPY.registerVerdict}
                  </Button>
                </Link>
                <Button
                  variant="ghost"
                  className="w-full sm:w-auto"
                  onClick={() => void removeDuel(duel.id)}
                >
                  {ARENA_COPY.delete}
                </Button>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
