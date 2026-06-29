'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardDescription, CardTitle } from '@/components/ui/card';
import { Badge, Input, Label } from '@/components/ui/form';
import type { Duel } from '@/domain/entities';
import {
  ARENA_COPY,
  duelStatusLabel,
  duelTypeLabel,
} from '@/shared/constants/arena-copy';

interface Judge {
  id: string;
  username: string;
  email?: string;
  displayName: string;
  active: boolean;
}

export default function AdminPage() {
  const router = useRouter();
  const [judges, setJudges] = useState<Judge[]>([]);
  const [duels, setDuels] = useState<Duel[]>([]);
  const [form, setForm] = useState({ email: '', password: '', displayName: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  async function fetchJudges() {
    const response = await fetch('/api/admin/judges');
    const data = await response.json();
    return (data.judges ?? []) as Judge[];
  }

  async function fetchDuels() {
    const response = await fetch('/api/admin/duels');
    const data = await response.json();
    return (data.duels ?? []) as Duel[];
  }

  async function loadAll() {
    const [nextJudges, nextDuels] = await Promise.all([fetchJudges(), fetchDuels()]);
    setJudges(nextJudges);
    setDuels(nextDuels);
  }

  useEffect(() => {
    let active = true;

    async function bootstrap() {
      const me = await fetch('/api/auth/me').then((r) => r.json());
      if (!active) return;
      if (!me.session?.roles?.includes('admin')) {
        router.push('/login');
        return;
      }

      const [nextJudges, nextDuels] = await Promise.all([fetchJudges(), fetchDuels()]);
      if (!active) return;
      setJudges(nextJudges);
      setDuels(nextDuels);
      setLoading(false);
    }

    void bootstrap();
    return () => {
      active = false;
    };
  }, [router]);

  async function createJudge(event: React.FormEvent) {
    event.preventDefault();
    setError('');

    const response = await fetch('/api/admin/judges', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    });

    const data = await response.json();
    if (!response.ok) {
      setError(data.error ?? ARENA_COPY.arbiterCreateFailed);
      return;
    }

    setForm({ email: '', password: '', displayName: '' });
    await loadAll();
  }

  async function toggleJudge(id: string, active: boolean) {
    await fetch(`/api/admin/judges/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ active }),
    });
    await loadAll();
  }

  async function removeDuel(id: string) {
    if (!window.confirm(ARENA_COPY.confirmDeleteDuel)) return;

    const response = await fetch(`/api/admin/duels/${id}`, { method: 'DELETE' });
    if (!response.ok) {
      const data = await response.json();
      window.alert(data.error ?? 'Erro ao excluir');
      return;
    }

    await loadAll();
  }

  if (loading) {
    return <p className="text-muted">Carregando...</p>;
  }

  return (
    <div className="space-y-8">
      <div>
        <p className="text-accent text-sm tracking-[0.2em] uppercase">{ARENA_COPY.siteTagline}</p>
        <h1 className="text-2xl font-bold sm:text-3xl">{ARENA_COPY.adminPanel}</h1>
        <p className="text-muted">{ARENA_COPY.adminPanelSubtitle}</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardTitle>{ARENA_COPY.newArbiter}</CardTitle>
          <CardDescription>{ARENA_COPY.newArbiterHint}</CardDescription>
          <form onSubmit={createJudge} className="mt-4 space-y-3">
            <div>
              <Label>{ARENA_COPY.displayName}</Label>
              <Input
                value={form.displayName}
                onChange={(e) => setForm({ ...form, displayName: e.target.value })}
              />
            </div>
            <div>
              <Label>E-mail</Label>
              <Input
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
              />
            </div>
            <div>
              <Label>{ARENA_COPY.loginPassword}</Label>
              <Input
                type="password"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
              />
            </div>
            {error && <p className="text-danger text-sm">{error}</p>}
            <Button type="submit" className="w-full sm:w-auto">
              {ARENA_COPY.registerArbiter}
            </Button>
          </form>
        </Card>

        <Card>
          <CardTitle>{ARENA_COPY.arbiterRoster}</CardTitle>
          <div className="mt-4 space-y-3">
            {judges.length === 0 && (
              <p className="text-muted text-sm">{ARENA_COPY.noArbitersYet}</p>
            )}
            {judges.map((judge) => (
              <div
                key={judge.id}
                className="border-card-border/70 flex flex-col gap-3 rounded-xl border bg-stone-950/30 p-4 sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="min-w-0">
                  <p className="font-medium">{judge.displayName}</p>
                  <p className="text-muted text-sm">{judge.email ?? `@${judge.username}`}</p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <Badge tone={judge.active ? 'success' : 'warning'}>
                    {judge.active ? ARENA_COPY.statusActive : ARENA_COPY.statusInactive}
                  </Badge>
                  <Button
                    variant="secondary"
                    className="flex-1 sm:flex-none"
                    onClick={() => toggleJudge(judge.id, !judge.active)}
                  >
                    {judge.active ? ARENA_COPY.deactivate : ARENA_COPY.activate}
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>

      <Card>
        <CardTitle>{ARENA_COPY.adminChronicles}</CardTitle>
        <CardDescription>{ARENA_COPY.adminChroniclesHint}</CardDescription>
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
                  {duel.judgeName} · Runa {duel.token} · {duelTypeLabel(duel.isClassified)}
                  {duel.result
                    ? ` · ${duel.result.pointsA}/${duel.result.pointsB} ${ARENA_COPY.gloryShort}`
                    : ''}
                </p>
              </div>
              <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
                <Link href={`/judge/duel/${duel.id}`} className="w-full sm:w-auto">
                  <Button variant="secondary" className="w-full sm:w-auto">
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
