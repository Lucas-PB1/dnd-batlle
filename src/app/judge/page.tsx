'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardDescription, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/form';
import type { Duel } from '@/domain/entities';

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
      if (!me.session || me.session.role !== 'judge') {
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

  if (loading) return <p className="text-muted">Carregando...</p>;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold">Painel do Juiz</h1>
          <p className="text-muted">
            Gere links, acompanhe inscrições e registre resultados.
          </p>
        </div>
        <Button onClick={createDuel}>Gerar novo duelo</Button>
      </div>

      {link && (
        <Card>
          <CardTitle>Link do duelo</CardTitle>
          <CardDescription>
            Envie para os jogadores preencherem nome e classe
          </CardDescription>
          <div className="mt-3 flex flex-col gap-2 sm:flex-row">
            <code className="flex-1 truncate rounded-lg bg-stone-950/60 px-3 py-2 text-sm">
              {link}
            </code>
            <Button variant="secondary" onClick={copyLink}>
              Copiar
            </Button>
          </div>
        </Card>
      )}

      <Card>
        <CardTitle>Seus duelos</CardTitle>
        <div className="mt-4 space-y-3">
          {duels.length === 0 && (
            <p className="text-muted text-sm">Nenhum duelo criado.</p>
          )}
          {duels.map((duel) => (
            <div
              key={duel.id}
              className="border-card-border/70 flex flex-col gap-3 rounded-xl border bg-stone-950/30 p-4 sm:flex-row sm:items-center sm:justify-between"
            >
              <div>
                <div className="flex items-center gap-2">
                  <p className="font-medium">
                    {duel.playerA?.name ?? 'Jogador A ?'} vs{' '}
                    {duel.playerB?.name ?? 'Jogador B ?'}
                  </p>
                  <Badge tone={duel.status === 'completed' ? 'success' : 'warning'}>
                    {duel.status}
                  </Badge>
                </div>
                <p className="text-muted text-sm">
                  Token: {duel.token} · {duel.isClassified ? 'Classificado' : 'Amistoso'}
                </p>
              </div>
              <div className="flex gap-2">
                <Link href={`/duel/${duel.token}`}>
                  <Button variant="secondary">Link</Button>
                </Link>
                {duel.status !== 'completed' && (
                  <Link href={`/judge/duel/${duel.id}`}>
                    <Button>Registrar resultado</Button>
                  </Link>
                )}
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
