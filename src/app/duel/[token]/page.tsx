'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { useParams } from 'next/navigation';
import {
  CheckCircleIcon,
  LockClosedIcon,
  UserIcon,
} from '@heroicons/react/24/outline';
import { Button } from '@/components/ui/button';
import { Card, CardDescription, CardTitle } from '@/components/ui/card';
import { Badge, Input, Label, Select } from '@/components/ui/form';
import type { Character } from '@/domain/entities';
import { cn } from '@/lib/cn';
import { BRACKET_BY_CLASS } from '@/shared/constants/game-rules';
import {
  ARENA_COPY,
  duelStatusLabel,
  duelTypeLabel,
} from '@/shared/constants/arena-copy';

interface DuelPublic {
  token: string;
  status: string;
  isClassified: boolean;
  judgeName: string;
  playerA?: {
    name: string;
    characterClass: string;
    bracket: string;
    playerDisplayName?: string;
    portraitUrl?: string;
  };
  playerB?: {
    name: string;
    characterClass: string;
    bracket: string;
    playerDisplayName?: string;
    portraitUrl?: string;
  };
}

function DuelSlotCard({
  corner,
  player,
  slotKey,
  selected,
  selectable,
  onSelect,
}: {
  corner: string;
  player?: DuelPublic['playerA'];
  slotKey: 'A' | 'B';
  selected: boolean;
  selectable: boolean;
  onSelect: (slot: 'A' | 'B') => void;
}) {
  const occupied = Boolean(player);

  return (
    <button
      type="button"
      disabled={!selectable}
      onClick={() => selectable && onSelect(slotKey)}
      className={cn(
        'relative flex min-h-[9.5rem] w-full flex-col rounded-xl border p-4 text-left transition',
        occupied
          ? 'border-emerald-500/35 bg-emerald-950/20'
          : selectable
            ? selected
              ? 'border-accent bg-accent/10 ring-1 ring-accent/40'
              : 'border-card-border/70 bg-stone-950/30 hover:border-accent/40 hover:bg-stone-950/50'
            : 'border-card-border/50 bg-stone-950/20 opacity-80',
        selectable && 'cursor-pointer',
        !selectable && 'cursor-default',
      )}
    >
      <div className="mb-3 flex items-center justify-between gap-2">
        <p className="text-muted text-[10px] font-semibold tracking-[0.18em] uppercase">
          {corner}
        </p>
        <Badge tone={occupied ? 'success' : selectable ? 'warning' : 'default'}>
          {occupied ? ARENA_COPY.slotOccupied : ARENA_COPY.slotAvailable}
        </Badge>
      </div>

      {occupied && player ? (
        <>
          <p className="text-base font-semibold leading-tight">{player.name}</p>
          {player.playerDisplayName && (
            <p className="text-accent mt-1 text-xs">{player.playerDisplayName}</p>
          )}
          <p className="text-muted mt-2 text-sm">
            {player.characterClass} · {ARENA_COPY.bracket} {player.bracket}
          </p>
        </>
      ) : (
        <>
          <div className="border-card-border/60 text-muted mb-2 flex h-10 w-10 items-center justify-center rounded-full border border-dashed">
            <UserIcon className="h-5 w-5" aria-hidden />
          </div>
          <p className="font-medium">{ARENA_COPY.challengerVacant}</p>
          {selectable && (
            <p className="text-muted mt-2 text-xs">
              {selected ? 'Vaga selecionada' : 'Toque para escolher'}
            </p>
          )}
        </>
      )}
    </button>
  );
}

export default function DuelRegistrationPage() {
  const params = useParams<{ token: string }>();
  const [duel, setDuel] = useState<DuelPublic | null>(null);
  const [characters, setCharacters] = useState<Character[]>([]);
  const [session, setSession] = useState<{ roles: string[] } | null>(null);
  const [mode, setMode] = useState<'character' | 'manual'>('character');
  const [slot, setSlot] = useState<'A' | 'B'>('A');
  const [characterId, setCharacterId] = useState('');
  const [name, setName] = useState('');
  const [characterClass, setCharacterClass] = useState('');
  const [classes, setClasses] = useState<string[]>([]);
  const [subclass, setSubclass] = useState('');
  const [seasonPointsBefore, setSeasonPointsBefore] = useState('0');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    let active = true;

    async function bootstrap() {
      const response = await fetch(`/api/duel/${params.token}`);
      const data = await response.json();
      if (!active) return;
      if (!response.ok) {
        setError(data.error ?? ARENA_COPY.invalidConvocation);
        setLoading(false);
        return;
      }
      setDuel(data.duel);
      setClasses(data.classes ?? []);
      setCharacters(data.characters ?? []);
      setSession(data.session ?? null);
      if (data.classes?.[0]) setCharacterClass(data.classes[0]);
      if (data.characters?.[0]) {
        setCharacterId(data.characters[0].id);
        setMode('character');
      } else if (!data.session?.roles?.includes('player')) {
        setMode('manual');
      }
      setLoading(false);
    }

    void bootstrap();
    return () => {
      active = false;
    };
  }, [params.token]);

  const slotAOpen = !duel?.playerA;
  const slotBOpen = !duel?.playerB;
  const filledCount = (duel?.playerA ? 1 : 0) + (duel?.playerB ? 1 : 0);
  const arenaFull =
    duel?.status === 'ready' ||
    duel?.status === 'completed' ||
    (!slotAOpen && !slotBOpen);
  const canEnroll = duel != null && duel.status !== 'completed' && !arenaFull;

  const availableSlots = useMemo(() => {
    const slots: ('A' | 'B')[] = [];
    if (slotAOpen) slots.push('A');
    if (slotBOpen) slots.push('B');
    return slots;
  }, [slotAOpen, slotBOpen]);

  const activeSlot = availableSlots.includes(slot)
    ? slot
    : (availableSlots[0] ?? slot);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    if (!canEnroll) return;

    setError('');
    setMessage('');
    setSubmitting(true);

    const body =
      mode === 'character' && characterId
        ? { slot: activeSlot, characterId, seasonPointsBefore: Number(seasonPointsBefore) }
        : {
            slot: activeSlot,
            name,
            characterClass,
            subclass: subclass || undefined,
            seasonPointsBefore: Number(seasonPointsBefore),
          };

    const response = await fetch(`/api/duel/${params.token}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });

    const data = await response.json();
    setSubmitting(false);

    if (!response.ok) {
      setError(data.error ?? 'Erro ao registrar');
      return;
    }

    setMessage(ARENA_COPY.enrollmentSaved);
    setDuel(data.duel);
  }

  if (loading) return <p className="text-muted">Convocando a arena...</p>;
  if (error && !duel) return <p className="text-danger">{error}</p>;
  if (!duel) return null;

  const bracket = BRACKET_BY_CLASS[characterClass];
  const isPlayer = session?.roles?.includes('player');
  const selectedCharacter = characters.find((item) => item.id === characterId);

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <section className="space-y-2 text-center">
        <p className="text-accent text-sm tracking-[0.2em] uppercase">
          {ARENA_COPY.duelRegistration}
        </p>
        <h1 className="text-2xl font-bold sm:text-3xl">{ARENA_COPY.prepareForArena}</h1>
        <p className="text-muted">
          {ARENA_COPY.arbiter}: {duel.judgeName}
        </p>
      </section>

      <Card className="panel-amber overflow-hidden">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap gap-2">
            <Badge tone={duel.isClassified ? 'warning' : 'default'}>
              {duelTypeLabel(duel.isClassified)}
            </Badge>
            <Badge tone={duel.status === 'completed' ? 'success' : arenaFull ? 'success' : 'warning'}>
              {duelStatusLabel(duel.status)}
            </Badge>
          </div>
          <p className="text-muted text-xs tabular-nums sm:text-sm">
            {filledCount}/2 desafiantes
          </p>
        </div>

        <div className="mt-5 grid items-stretch gap-3 sm:grid-cols-[1fr_auto_1fr]">
          <DuelSlotCard
            corner={ARENA_COPY.cornerA}
            player={duel.playerA}
            slotKey="A"
            selected={activeSlot === 'A'}
            selectable={canEnroll && slotAOpen}
            onSelect={setSlot}
          />
          <div className="text-muted flex items-center justify-center text-sm font-bold tracking-widest sm:flex-col">
            VS
          </div>
          <DuelSlotCard
            corner={ARENA_COPY.cornerB}
            player={duel.playerB}
            slotKey="B"
            selected={activeSlot === 'B'}
            selectable={canEnroll && slotBOpen}
            onSelect={setSlot}
          />
        </div>

        {duel.status === 'completed' && (
          <div className="border-card-border/70 mt-6 flex items-start gap-3 rounded-xl border bg-stone-950/30 p-4">
            <LockClosedIcon className="text-muted mt-0.5 h-5 w-5 shrink-0" aria-hidden />
            <p className="text-muted text-sm">{ARENA_COPY.duelAlreadySealed}</p>
          </div>
        )}

        {arenaFull && duel.status !== 'completed' && (
          <div className="border-emerald-500/30 mt-6 flex items-start gap-3 rounded-xl border bg-emerald-950/20 p-4">
            <CheckCircleIcon className="text-emerald mt-0.5 h-5 w-5 shrink-0" aria-hidden />
            <div>
              <p className="font-medium text-emerald-200">{ARENA_COPY.arenaFullTitle}</p>
              <p className="text-muted mt-1 text-sm">{ARENA_COPY.arenaFullHint}</p>
            </div>
          </div>
        )}

        {canEnroll && (
          <>
            <CardTitle className="mt-6">{ARENA_COPY.yourEnrollment}</CardTitle>
            <CardDescription>
              {availableSlots.length === 1
                ? `Inscrição aberta apenas no ${activeSlot === 'A' ? ARENA_COPY.cornerA : ARENA_COPY.cornerB}.`
                : isPlayer
                  ? ARENA_COPY.enrollmentHintPlayer
                  : ARENA_COPY.enrollmentHintGuest}
            </CardDescription>

            {availableSlots.length > 1 && (
              <p className="text-muted mt-2 text-xs">{ARENA_COPY.slotPickHint}</p>
            )}

            {!isPlayer && (
              <p className="text-muted mt-3 text-sm">
                <Link href="/login" className="text-accent hover:underline">
                  Entrar
                </Link>{' '}
                ou{' '}
                <Link href="/register" className="text-accent hover:underline">
                  inscrever-se no coliseu
                </Link>
              </p>
            )}

            <form onSubmit={submit} className="mt-4 space-y-4">
              {isPlayer && characters.length > 0 && (
                <>
                  <div className="flex flex-wrap gap-2">
                    <Button
                      type="button"
                      variant={mode === 'character' ? 'primary' : 'secondary'}
                      onClick={() => setMode('character')}
                    >
                      {ARENA_COPY.myHeroes}
                    </Button>
                    <Button
                      type="button"
                      variant={mode === 'manual' ? 'primary' : 'secondary'}
                      onClick={() => setMode('manual')}
                    >
                      {ARENA_COPY.manualSheet}
                    </Button>
                  </div>

                  {mode === 'character' && (
                    <div>
                      <Label>Herói</Label>
                      <Select
                        value={characterId}
                        onChange={(e) => setCharacterId(e.target.value)}
                      >
                        {characters.map((character) => (
                          <option key={character.id} value={character.id}>
                            {character.name} · {character.characterClass}
                            {character.isDead ? ' (morto)' : ''}
                          </option>
                        ))}
                      </Select>
                      {selectedCharacter && (
                        <div className="border-card-border/70 mt-3 rounded-xl border bg-stone-950/30 p-3 text-sm">
                          {selectedCharacter.description && (
                            <p className="text-muted">{selectedCharacter.description}</p>
                          )}
                          {selectedCharacter.generation && (
                            <p className="text-muted mt-1 text-xs">
                              {selectedCharacter.generation}
                            </p>
                          )}
                          <p className="text-muted mt-1 text-xs">
                            {ARENA_COPY.bracket}{' '}
                            {BRACKET_BY_CLASS[selectedCharacter.characterClass]}
                          </p>
                        </div>
                      )}
                    </div>
                  )}
                </>
              )}

              {(mode === 'manual' || !isPlayer || characters.length === 0) && (
                <>
                  <div>
                    <Label>{ARENA_COPY.heroName}</Label>
                    <Input value={name} onChange={(e) => setName(e.target.value)} required />
                  </div>
                  <div>
                    <Label>Classe</Label>
                    <Select
                      value={characterClass}
                      onChange={(e) => setCharacterClass(e.target.value)}
                    >
                      {classes.map((item) => (
                        <option key={item} value={item}>
                          {item}
                        </option>
                      ))}
                    </Select>
                    {bracket && (
                      <p className="text-muted mt-1 text-xs">
                        {ARENA_COPY.bracket} automática: {bracket}
                      </p>
                    )}
                  </div>
                  <div>
                    <Label>Subclasse (opcional)</Label>
                    <Input value={subclass} onChange={(e) => setSubclass(e.target.value)} />
                  </div>
                </>
              )}

              <div>
                <Label>{ARENA_COPY.gloryBeforeDuel}</Label>
                <Input
                  type="number"
                  min={0}
                  inputMode="numeric"
                  value={seasonPointsBefore}
                  onChange={(e) => setSeasonPointsBefore(e.target.value)}
                />
              </div>

              {error && <p className="text-danger text-sm">{error}</p>}
              {message && <p className="text-success text-sm">{message}</p>}

              <Button type="submit" className="w-full" disabled={submitting}>
                {submitting ? ARENA_COPY.enrollmentSubmitting : ARENA_COPY.confirmEnrollment}
              </Button>
            </form>
          </>
        )}
      </Card>
    </div>
  );
}
