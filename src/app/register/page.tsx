'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardDescription, CardTitle } from '@/components/ui/card';
import { Input, Label } from '@/components/ui/form';
import { primaryRedirectRole } from '@/shared/utils/roles';

export default function RegisterPage() {
  const router = useRouter();
  const [form, setForm] = useState({ email: '', password: '', displayName: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setLoading(true);
    setError('');

    const response = await fetch('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    });

    const data = await response.json();
    setLoading(false);

    if (!response.ok) {
      setError(data.error ?? 'Falha no cadastro');
      return;
    }

    router.push(primaryRedirectRole(data.session?.roles ?? ['player']));
    router.refresh();
  }

  return (
    <div className="mx-auto max-w-md">
      <Card>
        <CardTitle>Criar conta de jogador</CardTitle>
        <CardDescription>
          Cadastre-se para gerenciar personagens e acompanhar seu ranking
        </CardDescription>

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <div>
            <Label>Nome</Label>
            <Input
              value={form.displayName}
              onChange={(e) => setForm({ ...form, displayName: e.target.value })}
              required
            />
          </div>
          <div>
            <Label>E-mail</Label>
            <Input
              type="email"
              autoComplete="email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              required
            />
          </div>
          <div>
            <Label>Senha</Label>
            <Input
              type="password"
              autoComplete="new-password"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              required
            />
          </div>

          {error && <p className="text-danger text-sm">{error}</p>}

          <Button type="submit" disabled={loading} className="w-full">
            {loading ? 'Cadastrando...' : 'Cadastrar'}
          </Button>
        </form>

        <p className="text-muted mt-4 text-sm">
          Já tem conta?{' '}
          <Link href="/login" className="text-accent hover:underline">
            Entrar
          </Link>
        </p>
      </Card>
    </div>
  );
}
