'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardDescription, CardTitle } from '@/components/ui/card';
import { Input, Label } from '@/components/ui/form';
import { ARENA_COPY } from '@/shared/constants/arena-copy';
import { primaryRedirectRole } from '@/shared/utils/roles';

export default function LoginPage() {
  const router = useRouter();
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setLoading(true);
    setError('');

    const response = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ identifier, password }),
    });

    const data = await response.json();
    setLoading(false);

    if (!response.ok) {
      setError(data.error ?? ARENA_COPY.loginFailed);
      return;
    }

    router.push(primaryRedirectRole(data.session?.roles ?? ['player']));
    router.refresh();
  }

  return (
    <div className="mx-auto max-w-md space-y-2">
      <p className="text-accent text-center text-sm tracking-[0.2em] uppercase">
        {ARENA_COPY.siteTagline}
      </p>
      <Card>
        <CardTitle>{ARENA_COPY.loginTitle}</CardTitle>
        <CardDescription>{ARENA_COPY.loginSubtitle}</CardDescription>

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <div>
            <Label>{ARENA_COPY.loginIdentifier}</Label>
            <Input
              autoComplete="username"
              value={identifier}
              onChange={(e) => setIdentifier(e.target.value)}
            />
          </div>
          <div>
            <Label>{ARENA_COPY.loginPassword}</Label>
            <Input
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>

          {error && <p className="text-danger text-sm">{error}</p>}

          <Button type="submit" disabled={loading} className="w-full">
            {loading ? ARENA_COPY.loginSubmitting : ARENA_COPY.loginSubmit}
          </Button>
        </form>

        <p className="text-muted mt-4 text-sm">
          {ARENA_COPY.loginNewAdventurer}{' '}
          <Link href="/register" className="text-accent hover:underline">
            {ARENA_COPY.loginRegisterLink}
          </Link>
        </p>
        <p className="text-muted mt-2 text-xs">{ARENA_COPY.loginAdminHint}</p>
      </Card>
    </div>
  );
}
