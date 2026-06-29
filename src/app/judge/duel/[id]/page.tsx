'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { JudgeTools } from '@/components/judge/judge-tools';
import { Button } from '@/components/ui/button';
import { Card, CardDescription, CardTitle } from '@/components/ui/card';
import { Input, Label, Select } from '@/components/ui/form';
import type { Duel, DuelOutcome } from '@/domain/entities';
import { calculateDuelPoints } from '@/domain/services/scoring-service';
import { useArenas } from '@/hooks/use-arenas';
import { getArenaByDice } from '@/lib/arena-utils';
import { ARENA_COPY, duelTypeLabel } from '@/shared/constants/arena-copy';

function recalculateGlory(duel: Duel, outcome: DuelOutcome) {
  if (!duel.playerA || !duel.playerB) return { pointsA: '0', pointsB: '0' };

  return {
    pointsA: String(
      calculateDuelPoints({
        bracketA: duel.playerA.bracket,
        bracketB: duel.playerB.bracket,
        outcome,
        forPlayer: 'A',
      }).points,
    ),
    pointsB: String(
      calculateDuelPoints({
        bracketA: duel.playerA.bracket,
        bracketB: duel.playerB.bracket,
        outcome,
        forPlayer: 'B',
      }).points,
    ),
  };
}

export default function JudgeDuelPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const [duel, setDuel] = useState<Duel | null>(null);
  const [arena, setArena] = useState('1');
  const [outcome, setOutcome] = useState<DuelOutcome>('player_a');
  const [rounds, setRounds] = useState('10');
  const [notes, setNotes] = useState('');
  const [pointsA, setPointsA] = useState('0');
  const [pointsB, setPointsB] = useState('0');
  const [isClassified, setIsClassified] = useState(true);
  const [manualGlory, setManualGlory] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [backHref, setBackHref] = useState('/judge');
  const { activeArenas } = useArenas();

  useEffect(() => {
    async function load() {
      const me = await fetch('/api/auth/me').then((r) => r.json());
      const canAccess =
        me.session?.roles?.includes('judge') || me.session?.roles?.includes('admin');
      if (!canAccess) {
        router.push('/login');
        return;
      }

      setBackHref(me.session?.roles?.includes('admin') ? '/admin' : '/judge');

      const response = await fetch(`/api/judge/duels/${params.id}`);
      const data = await response.json();
      const nextDuel = (data.duel ?? null) as Duel | null;
      setDuel(nextDuel);

      if (nextDuel) {
        setIsClassified(nextDuel.isClassified);
        if (nextDuel.result) {
          setArena(String(nextDuel.arena ?? 1));
          setOutcome(nextDuel.result.outcome);
          setRounds(String(nextDuel.result.rounds));
          setNotes(nextDuel.result.notes ?? '');
          setPointsA(String(nextDuel.result.pointsA));
          setPointsB(String(nextDuel.result.pointsB));
        }
      }

      setLoading(false);
    }

    load();
  }, [params.id, router]);

  function handleOutcomeChange(value: DuelOutcome) {
    setOutcome(value);
    if (duel && duel.status === 'completed' && !manualGlory) {
      const recalculated = recalculateGlory(duel, value);
      setPointsA(recalculated.pointsA);
      setPointsB(recalculated.pointsB);
    }
  }

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setError('');

    const isCompleted = duel?.status === 'completed';
    const payload: Record<string, unknown> = isCompleted
      ? {
          arena: Number(arena),
          outcome,
          rounds: Number(rounds),
          notes: notes || undefined,
          isClassified,
        }
      : {
          arena: Number(arena),
          outcome,
          rounds: Number(rounds),
          notes: notes || undefined,
        };

    if (isCompleted && manualGlory) {
      payload.pointsA = Number(pointsA);
      payload.pointsB = Number(pointsB);
    }

    if (!isCompleted) {
      payload.isClassified = isClassified;
    }

    const response = await fetch(`/api/judge/duels/${params.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    const data = await response.json();
    if (!response.ok) {
      setError(data.error ?? 'Erro ao registrar');
      return;
    }

    router.push(backHref);
    router.refresh();
  }

  async function removeDuel() {
    if (!window.confirm(ARENA_COPY.confirmDeleteDuel)) return;

    const response = await fetch(`/api/judge/duels/${params.id}`, { method: 'DELETE' });
    if (!response.ok) {
      const data = await response.json();
      setError(data.error ?? 'Erro ao excluir');
      return;
    }

    router.push(backHref);
    router.refresh();
  }

  if (loading) return <p className="text-muted">Carregando...</p>;
  if (!duel) return <p className="text-danger">Duelo não encontrado.</p>;

  const selectedArena = getArenaByDice(activeArenas, Number(arena));
  const nameA = duel.playerA?.name ?? ARENA_COPY.cornerA;
  const nameB = duel.playerB?.name ?? ARENA_COPY.cornerB;
  const isCompleted = duel.status === 'completed';

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-accent text-sm tracking-[0.2em] uppercase">{ARENA_COPY.judgePanel}</p>
          <h1 className="text-2xl font-bold sm:text-3xl">
            {isCompleted ? ARENA_COPY.editChronicle : ARENA_COPY.registerResult}
          </h1>
          <p className="text-muted text-sm sm:text-base">{ARENA_COPY.registerResultSubtitle}</p>
        </div>
        <Button variant="ghost" onClick={() => void removeDuel()}>
          {ARENA_COPY.delete}
        </Button>
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
            {nameA} vs {nameB}
          </CardTitle>
          <CardDescription className="break-words">
            {duel.playerA?.characterClass} ({ARENA_COPY.bracket} {duel.playerA?.bracket}) vs{' '}
            {duel.playerB?.characterClass} ({ARENA_COPY.bracket} {duel.playerB?.bracket}) ·{' '}
            {duelTypeLabel(isClassified)}
          </CardDescription>

          <form onSubmit={submit} className="mt-6 space-y-4">
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={isClassified}
                onChange={(e) => setIsClassified(e.target.checked)}
                className="accent-accent rounded"
              />
              {ARENA_COPY.classifiedToggle}
            </label>

            <div>
              <Label>{ARENA_COPY.arenaField}</Label>
              <Select value={arena} onChange={(e) => setArena(e.target.value)}>
                {activeArenas.map((item) => (
                  <option key={item.id} value={item.diceValue}>
                    {item.diceValue}. {item.name}
                  </option>
                ))}
              </Select>
              {selectedArena && (
                <div className="text-muted mt-1 space-y-1 text-xs">
                  <p>{selectedArena.effect}</p>
                  {selectedArena.description && <p>{selectedArena.description}</p>}
                </div>
              )}
            </div>

            <div>
              <Label>{ARENA_COPY.verdict}</Label>
              <Select
                value={outcome}
                onChange={(e) => handleOutcomeChange(e.target.value as DuelOutcome)}
              >
                <option value="player_a">
                  {nameA} prevalece — {ARENA_COPY.cornerA}
                </option>
                <option value="player_b">
                  {nameB} prevalece — {ARENA_COPY.cornerB}
                </option>
                <option value="draw">Empate sangrento</option>
              </Select>
            </div>

            <div>
              <Label>{ARENA_COPY.combatRounds}</Label>
              <Input
                type="number"
                min={1}
                max={25}
                inputMode="numeric"
                value={rounds}
                onChange={(e) => setRounds(e.target.value)}
              />
              <p className="text-muted mt-1 text-xs">{ARENA_COPY.roundsHint}</p>
            </div>

            {isCompleted && (
              <div className="space-y-3 rounded-xl border border-card-border/70 bg-stone-950/30 p-4">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-sm font-medium">{ARENA_COPY.editGlory}</p>
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={() => {
                      if (!duel) return;
                      const recalculated = recalculateGlory(duel, outcome);
                      setPointsA(recalculated.pointsA);
                      setPointsB(recalculated.pointsB);
                      setManualGlory(false);
                    }}
                  >
                    Recalcular
                  </Button>
                </div>
                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={manualGlory}
                    onChange={(e) => setManualGlory(e.target.checked)}
                    className="accent-accent rounded"
                  />
                  Ajuste manual de glória
                </label>
                <div className="grid gap-3 sm:grid-cols-2">
                  <div>
                    <Label>{ARENA_COPY.gloryA}</Label>
                    <Input
                      type="number"
                      min={0}
                      value={pointsA}
                      disabled={!manualGlory}
                      onChange={(e) => setPointsA(e.target.value)}
                    />
                  </div>
                  <div>
                    <Label>{ARENA_COPY.gloryB}</Label>
                    <Input
                      type="number"
                      min={0}
                      value={pointsB}
                      disabled={!manualGlory}
                      onChange={(e) => setPointsB(e.target.value)}
                    />
                  </div>
                </div>
                <p className="text-muted text-xs">{ARENA_COPY.gloryRecalcHint}</p>
              </div>
            )}

            <div>
              <Label>{ARENA_COPY.chronicleNotes}</Label>
              <Input value={notes} onChange={(e) => setNotes(e.target.value)} />
            </div>

            {error && <p className="text-danger text-sm">{error}</p>}

            <Button type="submit" className="w-full">
              {isCompleted ? ARENA_COPY.save : ARENA_COPY.finalizeDuel}
            </Button>
          </form>
        </Card>
      </div>
    </div>
  );
}
