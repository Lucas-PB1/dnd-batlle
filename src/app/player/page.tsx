'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardDescription, CardTitle } from '@/components/ui/card';
import { Badge, Input, Label, Select } from '@/components/ui/form';
import type { Character, CharacterRankingEntry, PlayerRankingEntry } from '@/domain/entities';
import { BRACKET_BY_CLASS, CHARACTER_CLASSES } from '@/shared/constants/game-rules';
import { ARENA_COPY } from '@/shared/constants/arena-copy';

const emptyForm = {
  name: '',
  characterClass: CHARACTER_CLASSES[0] as string,
  subclass: '',
  description: '',
  generation: '',
  isDead: false,
};

function CharacterAvatar({ character }: { character: Character }) {
  if (character.portraitUrl) {
    return (
      // eslint-disable-next-line @next/next/no-img-element -- retratos podem ser data URLs locais
      <img
        src={character.portraitUrl}
        alt={character.name}
        className="h-14 w-14 shrink-0 rounded-xl object-cover ring-1 ring-white/10"
      />
    );
  }

  return (
    <div className="bg-accent/15 text-accent flex h-14 w-14 shrink-0 items-center justify-center rounded-xl text-lg font-bold ring-1 ring-amber-900/30">
      {character.name.slice(0, 1).toUpperCase()}
    </div>
  );
}

export default function PlayerPage() {
  const router = useRouter();
  const [characters, setCharacters] = useState<Character[]>([]);
  const [characterRanking, setCharacterRanking] = useState<CharacterRankingEntry[]>([]);
  const [playerRanking, setPlayerRanking] = useState<PlayerRankingEntry | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [editId, setEditId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState(emptyForm);
  const [editPortrait, setEditPortrait] = useState<string | null | undefined>(undefined);
  const [portraitPreview, setPortraitPreview] = useState('');
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(true);

  async function load() {
    const me = await fetch('/api/auth/me').then((r) => r.json());
    if (!me.session?.roles?.includes('player')) {
      router.push('/login');
      return;
    }

    const response = await fetch('/api/player/stats');
    const data = await response.json();
    setCharacters(data.characters ?? []);
    setCharacterRanking(data.stats?.characterRanking ?? []);
    setPlayerRanking(data.stats?.playerRanking ?? null);
    setLoading(false);
  }

  useEffect(() => {
    let active = true;

    async function bootstrap() {
      const me = await fetch('/api/auth/me').then((r) => r.json());
      if (!active) return;
      if (!me.session?.roles?.includes('player')) {
        router.push('/login');
        return;
      }

      const response = await fetch('/api/player/stats');
      const data = await response.json();
      if (!active) return;
      setCharacters(data.characters ?? []);
      setCharacterRanking(data.stats?.characterRanking ?? []);
      setPlayerRanking(data.stats?.playerRanking ?? null);
      setLoading(false);
    }

    void bootstrap();
    return () => {
      active = false;
    };
  }, [router]);

  function handlePortraitFile(
    file: File | null,
    target: 'create' | 'edit',
  ) {
    if (!file) {
      if (target === 'create') setPortraitPreview('');
      if (target === 'edit') setEditPortrait(null);
      return;
    }
    if (file.size > 150_000) {
      setError('Imagem muito grande (máx. 150KB)');
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      const value = String(reader.result);
      if (target === 'create') setPortraitPreview(value);
      if (target === 'edit') setEditPortrait(value);
    };
    reader.readAsDataURL(file);
  }

  async function createCharacter(event: React.FormEvent) {
    event.preventDefault();
    setError('');
    setMessage('');

    const response = await fetch('/api/player/characters', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...form,
        portraitUrl: portraitPreview || undefined,
      }),
    });

    const data = await response.json();
    if (!response.ok) {
      setError(data.error ?? 'Erro ao criar personagem');
      return;
    }

    setForm(emptyForm);
    setPortraitPreview('');
    await load();
  }

  function startEdit(character: Character) {
    setEditId(character.id);
    setEditForm({
      name: character.name,
      characterClass: character.characterClass,
      subclass: character.subclass ?? '',
      description: character.description ?? '',
      generation: character.generation ?? '',
      isDead: character.isDead,
    });
    setEditPortrait(undefined);
    setError('');
    setMessage('');
  }

  async function saveEdit(event: React.FormEvent) {
    event.preventDefault();
    if (!editId) return;

    setError('');
    setMessage('');

    const body: Record<string, unknown> = { ...editForm };
    if (editPortrait !== undefined) {
      body.portraitUrl = editPortrait;
    }

    const response = await fetch(`/api/player/characters/${editId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });

    const data = await response.json();
    if (!response.ok) {
      setError(data.error ?? 'Erro ao atualizar');
      return;
    }

    setEditId(null);
    setMessage(ARENA_COPY.heroUpdated);
    await load();
  }

  async function removeCharacter(id: string) {
    if (!window.confirm(ARENA_COPY.confirmDeleteHero)) return;

    setError('');
    setMessage('');

    const response = await fetch(`/api/player/characters/${id}`, { method: 'DELETE' });
    const data = await response.json();
    if (!response.ok) {
      setError(data.error ?? 'Erro ao remover');
      return;
    }

    if (editId === id) setEditId(null);
    setMessage(ARENA_COPY.heroRemoved);
    await load();
  }

  if (loading) return <p className="text-muted">Carregando...</p>;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold sm:text-3xl">{ARENA_COPY.mySanctum}</h1>
        <p className="text-muted">Heróis, glória e crônicas da sua jornada no coliseu</p>
      </div>

      {(message || error) && (
        <div className="space-y-1">
          {message && <p className="text-success text-sm">{message}</p>}
          {error && <p className="text-danger text-sm">{error}</p>}
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-4">
        <Card className="sm:col-span-1">
          <CardDescription>{ARENA_COPY.myGlory}</CardDescription>
          <p className="text-accent mt-2 text-3xl font-bold">{playerRanking?.points ?? 0}</p>
          <p className="text-muted mt-1 text-xs">Soma automática dos seus heróis</p>
        </Card>
        <Card>
          <CardDescription>{ARENA_COPY.record}</CardDescription>
          <p className="mt-2 text-lg font-semibold">
            {playerRanking?.wins ?? 0}/{playerRanking?.draws ?? 0}/{playerRanking?.losses ?? 0}
          </p>
        </Card>
        <Card>
          <CardDescription>{ARENA_COPY.duels}</CardDescription>
          <p className="mt-2 text-lg font-semibold">{playerRanking?.duels ?? 0}</p>
        </Card>
        <Card>
          <CardDescription>Heróis</CardDescription>
          <p className="mt-2 text-lg font-semibold">{characters.length}</p>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardTitle>{ARENA_COPY.newHero}</CardTitle>
          <CardDescription>
            Inscreva um campeão — qualquer geração da mesa, inclusive mortos na campanha
          </CardDescription>
          <form onSubmit={createCharacter} className="mt-4 space-y-3">
            <div>
              <Label>Nome</Label>
              <Input
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                required
              />
            </div>
            <div>
              <Label>Classe</Label>
              <Select
                value={form.characterClass}
                onChange={(e) => setForm({ ...form, characterClass: e.target.value })}
              >
                {CHARACTER_CLASSES.map((item) => (
                  <option key={item} value={item}>
                    {item}
                  </option>
                ))}
              </Select>
              <p className="text-muted mt-1 text-xs">
                {ARENA_COPY.bracket} {BRACKET_BY_CLASS[form.characterClass]}
              </p>
            </div>
            <div>
              <Label>Subclasse (opcional)</Label>
              <Input
                value={form.subclass}
                onChange={(e) => setForm({ ...form, subclass: e.target.value })}
              />
            </div>
            <div>
              <Label>Geração / nota (opcional)</Label>
              <Input
                placeholder="Ex: Gen 3, campanha principal..."
                value={form.generation}
                onChange={(e) => setForm({ ...form, generation: e.target.value })}
              />
            </div>
            <div>
              <Label>Descrição curta</Label>
              <Input
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
              />
            </div>
            <div>
              <Label>Retrato (opcional)</Label>
              <Input
                type="file"
                accept="image/*"
                onChange={(e) => handlePortraitFile(e.target.files?.[0] ?? null, 'create')}
              />
            </div>
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={form.isDead}
                onChange={(e) => setForm({ ...form, isDead: e.target.checked })}
                className="accent-accent rounded"
              />
              Personagem morto na campanha (pode duelar na arena)
            </label>
            <Button type="submit" className="w-full">
              Inscrever herói
            </Button>
          </form>
        </Card>

        <Card>
          <CardTitle>{ARENA_COPY.heroRoster}</CardTitle>
          <div className="mt-4 space-y-3">
            {characters.length === 0 && (
              <p className="text-muted text-sm">Nenhum herói inscrito ainda.</p>
            )}
            {characters.map((character) => {
              const rank = characterRanking.find((entry) => entry.characterId === character.id);
              const glory = rank?.points ?? 0;
              const wins = rank?.wins ?? 0;
              const draws = rank?.draws ?? 0;
              const losses = rank?.losses ?? 0;
              const isEditing = editId === character.id;

              return (
                <div
                  key={character.id}
                  className="border-card-border/70 rounded-xl border bg-stone-950/30 p-4"
                >
                  {isEditing ? (
                    <form onSubmit={saveEdit} className="space-y-3">
                      <p className="text-sm font-medium">{ARENA_COPY.editHero}</p>
                      <div>
                        <Label>Nome</Label>
                        <Input
                          value={editForm.name}
                          onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                          required
                        />
                      </div>
                      <div>
                        <Label>Classe</Label>
                        <Select
                          value={editForm.characterClass}
                          onChange={(e) =>
                            setEditForm({ ...editForm, characterClass: e.target.value })
                          }
                        >
                          {CHARACTER_CLASSES.map((item) => (
                            <option key={item} value={item}>
                              {item}
                            </option>
                          ))}
                        </Select>
                      </div>
                      <div>
                        <Label>Subclasse</Label>
                        <Input
                          value={editForm.subclass}
                          onChange={(e) => setEditForm({ ...editForm, subclass: e.target.value })}
                        />
                      </div>
                      <div>
                        <Label>Geração / nota</Label>
                        <Input
                          value={editForm.generation}
                          onChange={(e) =>
                            setEditForm({ ...editForm, generation: e.target.value })
                          }
                        />
                      </div>
                      <div>
                        <Label>Descrição</Label>
                        <Input
                          value={editForm.description}
                          onChange={(e) =>
                            setEditForm({ ...editForm, description: e.target.value })
                          }
                        />
                      </div>
                      <div>
                        <Label>Retrato</Label>
                        <Input
                          type="file"
                          accept="image/*"
                          onChange={(e) =>
                            handlePortraitFile(e.target.files?.[0] ?? null, 'edit')
                          }
                        />
                      </div>
                      <label className="flex items-center gap-2 text-sm">
                        <input
                          type="checkbox"
                          checked={editForm.isDead}
                          onChange={(e) =>
                            setEditForm({ ...editForm, isDead: e.target.checked })
                          }
                          className="accent-accent rounded"
                        />
                        Morto na campanha
                      </label>
                      <div className="flex flex-col gap-2 sm:flex-row">
                        <Button type="submit" className="flex-1">
                          {ARENA_COPY.save}
                        </Button>
                        <Button
                          type="button"
                          variant="secondary"
                          className="flex-1"
                          onClick={() => setEditId(null)}
                        >
                          {ARENA_COPY.cancel}
                        </Button>
                      </div>
                    </form>
                  ) : (
                    <div className="flex gap-3">
                      <CharacterAvatar character={character} />
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="font-medium">{character.name}</p>
                          {character.isDead && <Badge tone="warning">Morto</Badge>}
                        </div>
                        <p className="text-muted text-sm">
                          {character.characterClass}
                          {character.subclass ? ` · ${character.subclass}` : ''} ·{' '}
                          {ARENA_COPY.bracket} {BRACKET_BY_CLASS[character.characterClass]}
                        </p>
                        {character.generation && (
                          <p className="text-muted text-xs">{character.generation}</p>
                        )}
                        {character.description && (
                          <p className="text-muted mt-1 text-xs">{character.description}</p>
                        )}
                        <p className="text-accent mt-2 text-sm font-medium">
                          {glory} {ARENA_COPY.gloryShort.toLowerCase()} · {wins}V/{draws}E/
                          {losses}D
                          {rank?.duels === 0 || !rank ? ' · aguardando duelo' : ''}
                        </p>
                        <div className="mt-3 flex flex-wrap gap-2">
                          <Button
                            type="button"
                            variant="secondary"
                            onClick={() => startEdit(character)}
                          >
                            {ARENA_COPY.edit}
                          </Button>
                          <Button
                            type="button"
                            variant="ghost"
                            onClick={() => void removeCharacter(character.id)}
                          >
                            {ARENA_COPY.delete}
                          </Button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </Card>
      </div>
    </div>
  );
}
