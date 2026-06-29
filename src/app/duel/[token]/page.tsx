'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardDescription, CardTitle } from '@/components/ui/card';
import { Badge, Input, Label, Select } from '@/components/ui/form';
import type { Character } from '@/domain/entities';
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

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setError('');
    setMessage('');

    const body =
      mode === 'character' && characterId
        ? { slot, characterId, seasonPointsBefore: Number(seasonPointsBefore) }
        : {
            slot,
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
    <div className="mx-auto max-w-xl space-y-6">
      <section className="space-y-2 text-center">
        <p className="text-accent text-sm tracking-[0.2em] uppercase">
          {ARENA_COPY.duelRegistration}
        </p>
        <h1 className="text-2xl font-bold sm:text-3xl">{ARENA_COPY.prepareForArena}</h1>
        <p className="text-muted">
          {ARENA_COPY.arbiter}: {duel.judgeName}
        </p>
      </section>

      <Card>
        <div className="flex flex-wrap gap-2">
          <Badge tone={duel.isClassified ? 'warning' : 'default'}>
            {duelTypeLabel(duel.isClassified)}
          </Badge>
          <Badge>{duelStatusLabel(duel.status)}</Badge>
        </div>

        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          {(['A', 'B'] as const).map((slotKey) => {
            const player = slotKey === 'A' ? duel.playerA : duel.playerB;
            const corner = slotKey === 'A' ? ARENA_COPY.cornerA : ARENA_COPY.cornerB;
            return (
              <div
                key={slotKey}
                className="border-card-border/70 rounded-xl border bg-stone-950/30 p-4"
              >
                <p className="text-muted text-xs uppercase">{corner}</p>
                <p className="font-medium">{player?.name ?? ARENA_COPY.challengerVacant}</p>
                {player && (
                  <>
                    {player.playerDisplayName && (
                      <p className="text-accent text-xs">{player.playerDisplayName}</p>
                    )}
                    <p className="text-muted text-sm">
                      {player.characterClass} · {ARENA_COPY.bracket} {player.bracket}
                    </p>
                  </>
                )}
              </div>
            );
          })}
        </div>

        {duel.status === 'completed' ? (
          <p className="text-muted mt-4 text-sm">{ARENA_COPY.duelAlreadySealed}</p>
        ) : (
          <>
            <CardTitle className="mt-6">{ARENA_COPY.yourEnrollment}</CardTitle>
            <CardDescription>
              {isPlayer ? ARENA_COPY.enrollmentHintPlayer : ARENA_COPY.enrollmentHintGuest}
            </CardDescription>

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
              <div>
                <Label>{ARENA_COPY.arenaSide}</Label>
                <Select
                  value={slot}
                  onChange={(e) => setSlot(e.target.value as 'A' | 'B')}
                >
                  <option value="A">{ARENA_COPY.cornerA}</option>
                  <option value="B">{ARENA_COPY.cornerB}</option>
                </Select>
              </div>

              {isPlayer && characters.length > 0 && (
                <>
                  <div className="flex gap-2">
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
                            {ARENA_COPY.bracket} {BRACKET_BY_CLASS[selectedCharacter.characterClass]}
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

              <Button type="submit" className="w-full">
                {ARENA_COPY.confirmEnrollment}
              </Button>
            </form>
          </>
        )}
      </Card>
    </div>
  );
}
