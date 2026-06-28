'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardDescription, CardTitle } from '@/components/ui/card';
import { Badge, Input, Label, Select } from '@/components/ui/form';
import type { Character, CharacterRankingEntry, PlayerRankingEntry } from '@/domain/entities';
import { BRACKET_BY_CLASS, CHARACTER_CLASSES } from '@/shared/constants/game-rules';

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
  const [form, setForm] = useState({
    name: '',
    characterClass: CHARACTER_CLASSES[0] as string,
    subclass: '',
    description: '',
    generation: '',
    isDead: false,
  });
  const [portraitPreview, setPortraitPreview] = useState('');
  const [error, setError] = useState('');
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

  async function createCharacter(event: React.FormEvent) {
    event.preventDefault();
    setError('');

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

    setForm({
      name: '',
      characterClass: CHARACTER_CLASSES[0],
      subclass: '',
      description: '',
      generation: '',
      isDead: false,
    });
    setPortraitPreview('');
    await load();
  }

  function handlePortraitFile(file: File | null) {
    if (!file) {
      setPortraitPreview('');
      return;
    }
    if (file.size > 150_000) {
      setError('Imagem muito grande (máx. 150KB)');
      return;
    }
    const reader = new FileReader();
    reader.onload = () => setPortraitPreview(String(reader.result));
    reader.readAsDataURL(file);
  }

  if (loading) return <p className="text-muted">Carregando...</p>;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold sm:text-3xl">Meu painel</h1>
        <p className="text-muted">Personagens, pontuação e histórico da temporada</p>
      </div>

      {playerRanking && (
        <div className="grid gap-4 sm:grid-cols-4">
          <Card className="sm:col-span-1">
            <CardDescription>Seus pontos</CardDescription>
            <p className="text-accent mt-2 text-3xl font-bold">{playerRanking.points}</p>
          </Card>
          <Card>
            <CardDescription>V/E/D</CardDescription>
            <p className="mt-2 text-lg font-semibold">
              {playerRanking.wins}/{playerRanking.draws}/{playerRanking.losses}
            </p>
          </Card>
          <Card>
            <CardDescription>Duelos</CardDescription>
            <p className="mt-2 text-lg font-semibold">{playerRanking.duels}</p>
          </Card>
          <Card>
            <CardDescription>Personagens</CardDescription>
            <p className="mt-2 text-lg font-semibold">{characters.length}</p>
          </Card>
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardTitle>Novo personagem</CardTitle>
          <CardDescription>
            Qualquer geração da mesa — inclusive personagens mortos
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
                Faixa {BRACKET_BY_CLASS[form.characterClass]}
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
                onChange={(e) => handlePortraitFile(e.target.files?.[0] ?? null)}
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
            {error && <p className="text-danger text-sm">{error}</p>}
            <Button type="submit" className="w-full">
              Cadastrar personagem
            </Button>
          </form>
        </Card>

        <Card>
          <CardTitle>Seus personagens</CardTitle>
          <div className="mt-4 space-y-3">
            {characters.length === 0 && (
              <p className="text-muted text-sm">Nenhum personagem ainda.</p>
            )}
            {characters.map((character) => {
              const rank = characterRanking.find((entry) => entry.characterId === character.id);
              return (
                <div
                  key={character.id}
                  className="border-card-border/70 flex gap-3 rounded-xl border bg-stone-950/30 p-4"
                >
                  <CharacterAvatar character={character} />
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-medium">{character.name}</p>
                      {character.isDead && <Badge tone="warning">Morto</Badge>}
                    </div>
                    <p className="text-muted text-sm">
                      {character.characterClass}
                      {character.subclass ? ` · ${character.subclass}` : ''} · Faixa{' '}
                      {BRACKET_BY_CLASS[character.characterClass]}
                    </p>
                    {character.generation && (
                      <p className="text-muted text-xs">{character.generation}</p>
                    )}
                    {character.description && (
                      <p className="text-muted mt-1 text-xs">{character.description}</p>
                    )}
                    {rank && (
                      <p className="text-accent mt-2 text-sm font-medium">
                        {rank.points} pts · {rank.wins}V/{rank.draws}E/{rank.losses}D
                      </p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </Card>
      </div>
    </div>
  );
}
