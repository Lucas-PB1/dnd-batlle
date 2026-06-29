'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardDescription, CardTitle } from '@/components/ui/card';
import type { Arena, Duel, DuelOutcome } from '@/domain/entities';
import { useArenas } from '@/hooks/use-arenas';
import { calculateDuelPoints } from '@/domain/services/scoring-service';
import { rollD20, rollDie } from '@/lib/dice';
import { getArenaByDice } from '@/lib/arena-utils';
import { RULES_SECTIONS } from '@/shared/constants/rules-guide';
import { ARENA_COPY } from '@/shared/constants/arena-copy';

interface JudgeToolsProps {
  duel: Duel;
  arena: string;
  outcome: DuelOutcome;
  onArenaChange: (arena: string) => void;
}

export function JudgeTools({ duel, arena, outcome, onArenaChange }: JudgeToolsProps) {
  const { activeArenas, maxDiceValue } = useArenas();
  const [arenaRoll, setArenaRoll] = useState<number | null>(null);
  const [initiativeA, setInitiativeA] = useState<number | null>(null);
  const [initiativeB, setInitiativeB] = useState<number | null>(null);
  const [checked, setChecked] = useState<boolean[]>(
    RULES_SECTIONS.judgeChecklist.steps.map(() => false),
  );

  const arenaInfo = getArenaByDice(activeArenas, Number(arena));
  const lastRoll = arenaRoll ?? Number(arena);

  const bracketA = duel.playerA?.bracket;
  const bracketB = duel.playerB?.bracket;

  const pointsPreview =
    bracketA && bracketB
      ? {
          a: calculateDuelPoints({
            bracketA,
            bracketB,
            outcome,
            forPlayer: 'A',
          }).points,
          b: calculateDuelPoints({
            bracketA,
            bracketB,
            outcome,
            forPlayer: 'B',
          }).points,
        }
      : null;

  function rollArena() {
    const roll = rollDie(maxDiceValue);
    setArenaRoll(roll);
    const matched = getArenaByDice(activeArenas, roll);
    onArenaChange(String(matched?.diceValue ?? roll));
  }

  function rollInitiative() {
    setInitiativeA(rollD20());
    setInitiativeB(rollD20());
  }

  function toggleCheck(index: number) {
    setChecked((current) => current.map((value, i) => (i === index ? !value : value)));
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardTitle>{ARENA_COPY.judgeTools}</CardTitle>
        <CardDescription>{ARENA_COPY.judgeToolsHint}</CardDescription>

        <div className="mt-4 space-y-4">
          <div className="border-card-border/70 rounded-xl border bg-stone-950/30 p-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium">{ARENA_COPY.rollArena}</p>
                <p className="text-muted text-xs">
                  {ARENA_COPY.rollArenaHint} (d{maxDiceValue})
                </p>
              </div>
              <Button type="button" variant="secondary" className="w-full sm:w-auto" onClick={rollArena}>
                🎲 Rolar d{maxDiceValue}
              </Button>
            </div>
            {lastRoll && arenaInfo && (
              <div className="border-accent/30 bg-accent/10 mt-3 rounded-lg border px-3 py-2">
                <p className="text-accent text-sm font-semibold">
                  d{maxDiceValue} = {lastRoll} · {arenaInfo.name}
                </p>
                <p className="text-muted mt-1 text-xs">{arenaInfo.effect}</p>
              </div>
            )}
          </div>

          <div className="border-card-border/70 rounded-xl border bg-stone-950/30 p-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium">{ARENA_COPY.rollInitiative}</p>
                <p className="text-muted text-xs">{ARENA_COPY.rollInitiativeHint}</p>
              </div>
              <Button type="button" variant="secondary" className="w-full sm:w-auto" onClick={rollInitiative}>
                🎲 Rolar ambos
              </Button>
            </div>
            {(initiativeA !== null || initiativeB !== null) && (
              <div className="mt-3 grid grid-cols-2 gap-2 text-sm">
                <div className="rounded-lg bg-stone-950/60 px-3 py-2">
                  <p className="text-muted text-xs">{ARENA_COPY.cornerA}</p>
                  <p className="font-semibold">{initiativeA ?? '—'}</p>
                </div>
                <div className="rounded-lg bg-stone-950/60 px-3 py-2">
                  <p className="text-muted text-xs">{ARENA_COPY.cornerB}</p>
                  <p className="font-semibold">{initiativeB ?? '—'}</p>
                </div>
              </div>
            )}
          </div>

          {pointsPreview && duel.isClassified && (
            <div className="border-card-border/70 rounded-xl border bg-stone-950/30 p-4">
              <p className="text-sm font-medium">{ARENA_COPY.gloryPreview}</p>
              <div className="mt-2 flex flex-wrap gap-3 text-sm">
                <span>
                  {duel.playerA?.name}:{' '}
                  <strong className="text-accent">+{pointsPreview.a} {ARENA_COPY.gloryShort}</strong>
                </span>
                <span>
                  {duel.playerB?.name}:{' '}
                  <strong className="text-accent">+{pointsPreview.b} {ARENA_COPY.gloryShort}</strong>
                </span>
              </div>
            </div>
          )}

          {!duel.isClassified && (
            <p className="text-muted text-xs">{ARENA_COPY.friendlyNoGlory}</p>
          )}
        </div>
      </Card>

      <Card>
        <CardTitle>{ARENA_COPY.checklist}</CardTitle>
        <CardDescription>{ARENA_COPY.checklistHint}</CardDescription>
        <ul className="mt-4 space-y-2">
          {RULES_SECTIONS.judgeChecklist.steps.map((step, index) => (
            <li key={step}>
              <label className="flex cursor-pointer items-start gap-3 text-sm">
                <input
                  type="checkbox"
                  checked={checked[index]}
                  onChange={() => toggleCheck(index)}
                  className="border-card-border accent-accent mt-0.5 rounded"
                />
                <span className={checked[index] ? 'text-muted line-through' : undefined}>
                  {step}
                </span>
              </label>
            </li>
          ))}
        </ul>
      </Card>
    </div>
  );
}
