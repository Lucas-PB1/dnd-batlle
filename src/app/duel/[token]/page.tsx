'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardDescription, CardTitle } from '@/components/ui/card';
import { Badge, Input, Label, Select } from '@/components/ui/form';
import { BRACKET_BY_CLASS } from '@/shared/constants/game-rules';

interface DuelPublic {
  token: string;
  status: string;
  isClassified: boolean;
  judgeName: string;
  playerA?: { name: string; characterClass: string; bracket: string };
  playerB?: { name: string; characterClass: string; bracket: string };
}

export default function DuelRegistrationPage() {
  const params = useParams<{ token: string }>();
  const [duel, setDuel] = useState<DuelPublic | null>(null);
  const [classes, setClasses] = useState<string[]>([]);
  const [slot, setSlot] = useState<'A' | 'B'>('A');
  const [name, setName] = useState('');
  const [characterClass, setCharacterClass] = useState('');
  const [subclass, setSubclass] = useState('');
  const [seasonPointsBefore, setSeasonPointsBefore] = useState('0');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  async function load() {
    const response = await fetch(`/api/duel/${params.token}`);
    const data = await response.json();
    if (!response.ok) {
      setError(data.error ?? 'Link inválido');
      setLoading(false);
      return;
    }
    setDuel(data.duel);
    setClasses(data.classes ?? []);
    if (data.classes?.[0]) setCharacterClass(data.classes[0]);
    setLoading(false);
  }

  useEffect(() => {
    let active = true;

    async function bootstrap() {
      const response = await fetch(`/api/duel/${params.token}`);
      const data = await response.json();
      if (!active) return;
      if (!response.ok) {
        setError(data.error ?? 'Link inválido');
        setLoading(false);
        return;
      }
      setDuel(data.duel);
      setClasses(data.classes ?? []);
      if (data.classes?.[0]) setCharacterClass(data.classes[0]);
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

    const response = await fetch(`/api/duel/${params.token}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        slot,
        name,
        characterClass,
        subclass: subclass || undefined,
        seasonPointsBefore: Number(seasonPointsBefore),
      }),
    });

    const data = await response.json();
    if (!response.ok) {
      setError(data.error ?? 'Erro ao registrar');
      return;
    }

    setMessage('Inscrição salva com sucesso!');
    setDuel(data.duel);
    await load();
  }

  if (loading) return <p className="text-muted">Carregando duelo...</p>;
  if (error && !duel) return <p className="text-danger">{error}</p>;
  if (!duel) return null;

  const bracket = BRACKET_BY_CLASS[characterClass];

  return (
    <div className="mx-auto max-w-xl space-y-6">
      <section className="space-y-2 text-center">
        <p className="text-accent text-sm tracking-[0.2em] uppercase">
          Inscrição de duelo
        </p>
        <h1 className="text-3xl font-bold">Prepare-se para a arena</h1>
        <p className="text-muted">Juiz: {duel.judgeName}</p>
      </section>

      <Card>
        <div className="flex flex-wrap gap-2">
          <Badge tone={duel.isClassified ? 'warning' : 'default'}>
            {duel.isClassified ? 'Classificado' : 'Amistoso'}
          </Badge>
          <Badge>{duel.status}</Badge>
        </div>

        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <div className="border-card-border/70 rounded-xl border bg-stone-950/30 p-4">
            <p className="text-muted text-xs uppercase">Jogador A</p>
            <p className="font-medium">{duel.playerA?.name ?? 'Vago'}</p>
            {duel.playerA && (
              <p className="text-muted text-sm">
                {duel.playerA.characterClass} · Faixa {duel.playerA.bracket}
              </p>
            )}
          </div>
          <div className="border-card-border/70 rounded-xl border bg-stone-950/30 p-4">
            <p className="text-muted text-xs uppercase">Jogador B</p>
            <p className="font-medium">{duel.playerB?.name ?? 'Vago'}</p>
            {duel.playerB && (
              <p className="text-muted text-sm">
                {duel.playerB.characterClass} · Faixa {duel.playerB.bracket}
              </p>
            )}
          </div>
        </div>

        {duel.status === 'completed' ? (
          <p className="text-muted mt-4 text-sm">Este duelo já foi finalizado.</p>
        ) : (
          <>
            <CardTitle className="mt-6">Sua ficha</CardTitle>
            <CardDescription>
              Preencha e envie — cada jogador escolhe A ou B
            </CardDescription>

            <form onSubmit={submit} className="mt-4 space-y-4">
              <div>
                <Label>Vaga</Label>
                <Select
                  value={slot}
                  onChange={(e) => setSlot(e.target.value as 'A' | 'B')}
                >
                  <option value="A">Jogador A</option>
                  <option value="B">Jogador B</option>
                </Select>
              </div>
              <div>
                <Label>Nome do personagem/jogador</Label>
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
                  <p className="text-muted mt-1 text-xs">Faixa automática: {bracket}</p>
                )}
              </div>
              <div>
                <Label>Subclasse (opcional)</Label>
                <Input value={subclass} onChange={(e) => setSubclass(e.target.value)} />
              </div>
              <div>
                <Label>Pontos na temporada (antes do duelo)</Label>
                <Input
                  type="number"
                  min={0}
                  value={seasonPointsBefore}
                  onChange={(e) => setSeasonPointsBefore(e.target.value)}
                />
              </div>

              {error && <p className="text-danger text-sm">{error}</p>}
              {message && <p className="text-success text-sm">{message}</p>}

              <Button type="submit" className="w-full">
                Confirmar inscrição
              </Button>
            </form>
          </>
        )}
      </Card>
    </div>
  );
}
