'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardDescription, CardTitle } from '@/components/ui/card';
import { Badge, Input, Label } from '@/components/ui/form';

interface Judge {
  id: string;
  username: string;
  displayName: string;
  active: boolean;
}

export default function AdminPage() {
  const router = useRouter();
  const [judges, setJudges] = useState<Judge[]>([]);
  const [form, setForm] = useState({ username: '', password: '', displayName: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  async function fetchJudges() {
    const response = await fetch('/api/admin/judges');
    const data = await response.json();
    return (data.judges ?? []) as Judge[];
  }

  async function loadJudges() {
    setJudges(await fetchJudges());
  }

  useEffect(() => {
    let active = true;

    async function bootstrap() {
      const me = await fetch('/api/auth/me').then((r) => r.json());
      if (!active) return;
      if (!me.session || me.session.role !== 'admin') {
        router.push('/login');
        return;
      }

      const nextJudges = await fetchJudges();
      if (!active) return;
      setJudges(nextJudges);
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
      setError(data.error ?? 'Erro ao criar juiz');
      return;
    }

    setForm({ username: '', password: '', displayName: '' });
    await loadJudges();
  }

  async function toggleJudge(id: string, active: boolean) {
    await fetch(`/api/admin/judges/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ active }),
    });
    await loadJudges();
  }

  if (loading) {
    return <p className="text-muted">Carregando...</p>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold sm:text-3xl">Painel Admin</h1>
        <p className="text-muted">Cadastre juízes válidos para conduzir duelos.</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardTitle>Novo juiz</CardTitle>
          <CardDescription>
            Login simples via arquivo local (data/users.json)
          </CardDescription>
          <form onSubmit={createJudge} className="mt-4 space-y-3">
            <div>
              <Label>Nome exibido</Label>
              <Input
                value={form.displayName}
                onChange={(e) => setForm({ ...form, displayName: e.target.value })}
              />
            </div>
            <div>
              <Label>Usuário</Label>
              <Input
                value={form.username}
                onChange={(e) => setForm({ ...form, username: e.target.value })}
              />
            </div>
            <div>
              <Label>Senha</Label>
              <Input
                type="password"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
              />
            </div>
            {error && <p className="text-danger text-sm">{error}</p>}
            <Button type="submit">Cadastrar juiz</Button>
          </form>
        </Card>

        <Card>
          <CardTitle>Juízes cadastrados</CardTitle>
          <div className="mt-4 space-y-3">
            {judges.length === 0 && (
              <p className="text-muted text-sm">Nenhum juiz ainda.</p>
            )}
            {judges.map((judge) => (
              <div
                key={judge.id}
                className="border-card-border/70 flex flex-col gap-3 rounded-xl border bg-stone-950/30 p-4 sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="min-w-0">
                  <p className="font-medium">{judge.displayName}</p>
                  <p className="text-muted text-sm">@{judge.username}</p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <Badge tone={judge.active ? 'success' : 'warning'}>
                    {judge.active ? 'Ativo' : 'Inativo'}
                  </Badge>
                  <Button
                    variant="secondary"
                    className="flex-1 sm:flex-none"
                    onClick={() => toggleJudge(judge.id, !judge.active)}
                  >
                    {judge.active ? 'Desativar' : 'Ativar'}
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}
