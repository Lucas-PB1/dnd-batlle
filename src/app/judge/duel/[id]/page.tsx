'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { JudgeTools } from '@/components/judge/judge-tools';
import { Button } from '@/components/ui/button';
import { Card, CardDescription, CardTitle } from '@/components/ui/card';
import { Input, Label, Select } from '@/components/ui/form';
import type { Duel, DuelOutcome } from '@/domain/entities';
import { ARENAS } from '@/shared/constants/game-rules';

export default function JudgeDuelPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const [duel, setDuel] = useState<Duel | null>(null);
  const [arena, setArena] = useState('1');
  const [outcome, setOutcome] = useState<DuelOutcome>('player_a');
  const [rounds, setRounds] = useState('10');
  const [notes, setNotes] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const me = await fetch('/api/auth/me').then((r) => r.json());
      if (!me.session || me.session.role !== 'judge') {
        router.push('/login');
        return;
      }

      const response = await fetch(`/api/judge/duels/${params.id}`);
      const data = await response.json();
      setDuel(data.duel ?? null);
      setLoading(false);
    }

    load();
  }, [params.id, router]);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setError('');

    const response = await fetch(`/api/judge/duels/${params.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        arena: Number(arena),
        outcome,
        rounds: Number(rounds),
        notes: notes || undefined,
      }),
    });

    const data = await response.json();
    if (!response.ok) {
      setError(data.error ?? 'Erro ao registrar');
      return;
    }

    router.push('/judge');
    router.refresh();
  }

  if (loading) return <p className="text-muted">Carregando...</p>;
  if (!duel) return <p className="text-danger">Duelo não encontrado.</p>;

  const selectedArena = ARENAS[Number(arena)];

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold sm:text-3xl">Registrar resultado</h1>
        <p className="text-muted text-sm sm:text-base">
          Sorteie arena, conduza o combate e registre o placar.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <JudgeTools
          duel={duel}
          arena={arena}
          outcome={outcome}
          onArenaChange={setArena}
        />

        <Card>
          <CardTitle>
            {duel.playerA?.name ?? 'A'} vs {duel.playerB?.name ?? 'B'}
          </CardTitle>
          <CardDescription className="break-words">
            {duel.playerA?.characterClass} (Faixa {duel.playerA?.bracket}) vs{' '}
            {duel.playerB?.characterClass} (Faixa {duel.playerB?.bracket})
            {duel.isClassified ? ' · Classificado' : ' · Amistoso'}
          </CardDescription>

          <form onSubmit={submit} className="mt-6 space-y-4">
            <div>
              <Label>Arena (d6)</Label>
              <Select value={arena} onChange={(e) => setArena(e.target.value)}>
                {Object.entries(ARENAS).map(([key, value]) => (
                  <option key={key} value={key}>
                    {key}. {value.name}
                  </option>
                ))}
              </Select>
              {selectedArena && (
                <p className="text-muted mt-1 text-xs">{selectedArena.effect}</p>
              )}
            </div>

            <div>
              <Label>Resultado</Label>
              <Select
                value={outcome}
                onChange={(e) => setOutcome(e.target.value as DuelOutcome)}
              >
                <option value="player_a">Vitória jogador A — {duel.playerA?.name}</option>
                <option value="player_b">Vitória jogador B — {duel.playerB?.name}</option>
                <option value="draw">Empate</option>
              </Select>
            </div>

            <div>
              <Label>Rodadas</Label>
              <Input
                type="number"
                min={1}
                max={25}
                inputMode="numeric"
                value={rounds}
                onChange={(e) => setRounds(e.target.value)}
              />
              <p className="text-muted mt-1 text-xs">Empate automático após 25 rodadas.</p>
            </div>

            <div>
              <Label>Observações (opcional)</Label>
              <Input value={notes} onChange={(e) => setNotes(e.target.value)} />
            </div>

            {error && <p className="text-danger text-sm">{error}</p>}

            <Button type="submit" className="w-full">
              Finalizar duelo
            </Button>
          </form>
        </Card>
      </div>
    </div>
  );
}
