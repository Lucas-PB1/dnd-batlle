'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardDescription, CardTitle } from '@/components/ui/card';
import { Badge, Input, Label, Select } from '@/components/ui/form';
import { Tabs } from '@/components/ui/tabs';
import { Modal } from '@/components/ui/modal';
import type { Character, Duel, UserRole } from '@/domain/entities';
import { CHARACTER_CLASSES } from '@/shared/constants/game-rules';
import {
  ARENA_COPY,
  duelStatusLabel,
  duelTypeLabel,
} from '@/shared/constants/arena-copy';

interface AdminUser {
  id: string;
  username: string;
  email?: string;
  displayName: string;
  roles: UserRole[];
  active: boolean;
  deletedAt?: string;
  archivedEmail?: string;
}

interface AdminCharacter extends Character {
  playerDisplayName: string;
  playerEmail: string;
}

const ADMIN_TABS = [
  { id: 'users', label: 'Contas' },
  { id: 'heroes', label: 'Heróis' },
  { id: 'duels', label: 'Crônicas' },
] as const;

type AdminTabId = (typeof ADMIN_TABS)[number]['id'];

const ROLE_OPTIONS: { id: UserRole; label: string }[] = [
  { id: 'player', label: ARENA_COPY.rolePlayer },
  { id: 'judge', label: ARENA_COPY.roleJudge },
  { id: 'admin', label: ARENA_COPY.roleAdmin },
];

function RoleCheckboxes({
  value,
  onChange,
}: {
  value: UserRole[];
  onChange: (roles: UserRole[]) => void;
}) {
  function toggle(role: UserRole) {
    if (value.includes(role)) {
      onChange(value.filter((item) => item !== role));
    } else {
      onChange([...value, role]);
    }
  }

  return (
    <div className="flex flex-wrap gap-3">
      {ROLE_OPTIONS.map((role) => (
        <label key={role.id} className="inline-flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={value.includes(role.id)}
            onChange={() => toggle(role.id)}
            className="accent-accent"
          />
          {role.label}
        </label>
      ))}
    </div>
  );
}

export default function AdminPage() {
  const router = useRouter();
  const [tab, setTab] = useState<AdminTabId>('users');
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [characters, setCharacters] = useState<AdminCharacter[]>([]);
  const [duels, setDuels] = useState<Duel[]>([]);
  const [createForm, setCreateForm] = useState({
    email: '',
    password: '',
    displayName: '',
    roles: ['player'] as UserRole[],
  });
  const [editingUser, setEditingUser] = useState<AdminUser | null>(null);
  const [userDraft, setUserDraft] = useState({
    displayName: '',
    email: '',
    roles: [] as UserRole[],
    active: true,
    password: '',
  });
  const [editingCharacter, setEditingCharacter] = useState<AdminCharacter | null>(null);
  const [characterDraft, setCharacterDraft] = useState({
    name: '',
    characterClass: CHARACTER_CLASSES[0] as string,
    subclass: '',
    isDead: false,
    active: true,
  });
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [currentUserId, setCurrentUserId] = useState('');
  const [showRemovedUsers, setShowRemovedUsers] = useState(false);

  async function loadAll(includeRemoved = showRemovedUsers) {
    const [usersRes, charactersRes, duelsRes] = await Promise.all([
      fetch(`/api/admin/users${includeRemoved ? '?all=1' : ''}`),
      fetch('/api/admin/characters?all=1'),
      fetch('/api/admin/duels'),
    ]);

    const usersData = await usersRes.json();
    const charactersData = await charactersRes.json();
    const duelsData = await duelsRes.json();

    setUsers((usersData.users ?? []) as AdminUser[]);
    setCharacters((charactersData.characters ?? []) as AdminCharacter[]);
    setDuels((duelsData.duels ?? []) as Duel[]);
  }

  useEffect(() => {
    let active = true;

    async function bootstrap() {
      const me = await fetch('/api/auth/me').then((r) => r.json());
      if (!active) return;
      if (!me.session?.roles?.includes('admin')) {
        router.push('/login');
        return;
      }

      setCurrentUserId(me.session.userId);

      await loadAll(false);
      if (!active) return;
      setLoading(false);
    }

    void bootstrap();
    return () => {
      active = false;
    };
  }, [router]);

  async function createUser(event: React.FormEvent) {
    event.preventDefault();
    setError('');
    setMessage('');

    if (createForm.roles.length === 0) {
      setError('Selecione ao menos um papel');
      return;
    }

    const response = await fetch('/api/admin/users', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(createForm),
    });

    const data = await response.json();
    if (!response.ok) {
      setError(data.error ?? ARENA_COPY.arbiterCreateFailed);
      return;
    }

    setCreateForm({ email: '', password: '', displayName: '', roles: ['player'] });
    setMessage('Conta criada.');
    await loadAll();
  }

  function startEditUser(user: AdminUser) {
    setEditingUser(user);
    setUserDraft({
      displayName: user.displayName,
      email: user.email ?? '',
      roles: [...user.roles],
      active: user.active,
      password: '',
    });
    setError('');
    setMessage('');
  }

  async function saveUser() {
    if (!editingUser) return;
    setError('');
    setMessage('');

    if (userDraft.roles.length === 0) {
      setError('Selecione ao menos um papel');
      return;
    }

    const response = await fetch(`/api/admin/users/${editingUser.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        displayName: userDraft.displayName,
        email: userDraft.email,
        roles: userDraft.roles,
        active: userDraft.active,
      }),
    });

    const data = await response.json();
    if (!response.ok) {
      setError(data.error ?? 'Erro ao salvar');
      return;
    }

    setEditingUser(null);
    setMessage(ARENA_COPY.userUpdated);
    await loadAll();
  }

  async function resetPassword() {
    if (!editingUser || !userDraft.password) {
      setError(ARENA_COPY.resetPasswordHint);
      return;
    }

    const response = await fetch(`/api/admin/users/${editingUser.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ resetPassword: true, password: userDraft.password }),
    });

    const data = await response.json();
    if (!response.ok) {
      setError(data.error ?? 'Erro ao redefinir senha');
      return;
    }

    setUserDraft((draft) => ({ ...draft, password: '' }));
    setMessage(ARENA_COPY.passwordResetDone);
  }

  async function removeUser(id: string) {
    if (!window.confirm(ARENA_COPY.confirmDeleteUser)) return;
    setError('');
    setMessage('');

    const response = await fetch(`/api/admin/users/${id}`, { method: 'DELETE' });
    const data = await response.json();
    if (!response.ok) {
      setError(data.error ?? 'Erro ao remover conta');
      return;
    }

    if (editingUser?.id === id) setEditingUser(null);
    setMessage(ARENA_COPY.userRemoved);
    await loadAll();
  }

  async function restoreUser(id: string) {
    setError('');
    setMessage('');

    const response = await fetch(`/api/admin/users/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ restore: true }),
    });

    const data = await response.json();
    if (!response.ok) {
      setError(data.error ?? 'Erro ao restaurar conta');
      return;
    }

    setMessage(ARENA_COPY.userRestored);
    await loadAll();
  }

  function startEditCharacter(character: AdminCharacter) {
    setEditingCharacter(character);
    setCharacterDraft({
      name: character.name,
      characterClass: character.characterClass,
      subclass: character.subclass ?? '',
      isDead: character.isDead,
      active: character.active,
    });
    setError('');
    setMessage('');
  }

  async function saveCharacter() {
    if (!editingCharacter) return;

    const response = await fetch(`/api/admin/characters/${editingCharacter.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(characterDraft),
    });

    const data = await response.json();
    if (!response.ok) {
      setError(data.error ?? 'Erro ao salvar herói');
      return;
    }

    setEditingCharacter(null);
    setMessage(ARENA_COPY.heroUpdated);
    await loadAll();
  }

  async function removeCharacter(id: string) {
    if (!window.confirm(ARENA_COPY.confirmDeleteHero)) return;

    const response = await fetch(`/api/admin/characters/${id}`, { method: 'DELETE' });
    if (!response.ok) {
      const data = await response.json();
      window.alert(data.error ?? 'Erro ao excluir');
      return;
    }

    setMessage(ARENA_COPY.heroRemoved);
    await loadAll();
  }

  async function removeDuel(id: string) {
    if (!window.confirm(ARENA_COPY.confirmDeleteDuel)) return;

    const response = await fetch(`/api/admin/duels/${id}`, { method: 'DELETE' });
    if (!response.ok) {
      const data = await response.json();
      window.alert(data.error ?? 'Erro ao excluir');
      return;
    }

    setMessage(ARENA_COPY.duelRemoved);
    await loadAll();
  }

  if (loading) {
    return <p className="text-muted">Carregando...</p>;
  }

  return (
    <div className="space-y-6">
      <div>
        <p className="text-accent text-sm tracking-[0.2em] uppercase">{ARENA_COPY.siteTagline}</p>
        <h1 className="text-2xl font-bold sm:text-3xl">{ARENA_COPY.adminPanel}</h1>
        <p className="text-muted">{ARENA_COPY.adminPanelSubtitle}</p>
      </div>

      {(error || message) && (
        <p className={error ? 'text-danger text-sm' : 'text-emerald text-sm'}>{error || message}</p>
      )}

      <Tabs tabs={ADMIN_TABS} activeId={tab} onChange={(id) => setTab(id as AdminTabId)} />

      {tab === 'users' && (
        <div className="grid gap-6 lg:grid-cols-2">
          <Card>
            <CardTitle>{ARENA_COPY.newAccount}</CardTitle>
            <CardDescription>{ARENA_COPY.newAccountHint}</CardDescription>
            <form onSubmit={createUser} className="mt-4 space-y-3">
              <div>
                <Label>{ARENA_COPY.displayName}</Label>
                <Input
                  value={createForm.displayName}
                  onChange={(e) => setCreateForm({ ...createForm, displayName: e.target.value })}
                />
              </div>
              <div>
                <Label>E-mail</Label>
                <Input
                  type="email"
                  value={createForm.email}
                  onChange={(e) => setCreateForm({ ...createForm, email: e.target.value })}
                />
              </div>
              <div>
                <Label>{ARENA_COPY.loginPassword}</Label>
                <Input
                  type="password"
                  value={createForm.password}
                  onChange={(e) => setCreateForm({ ...createForm, password: e.target.value })}
                />
              </div>
              <div>
                <Label>Papéis</Label>
                <RoleCheckboxes
                  value={createForm.roles}
                  onChange={(roles) => setCreateForm({ ...createForm, roles })}
                />
              </div>
              <Button type="submit" className="w-full sm:w-auto">
                Criar conta
              </Button>
            </form>
          </Card>

          <Card>
            <div className="flex flex-wrap items-center justify-between gap-3">
              <CardTitle>{ARENA_COPY.userRoster}</CardTitle>
              <label className="text-muted inline-flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={showRemovedUsers}
                  onChange={(e) => {
                    setShowRemovedUsers(e.target.checked);
                    void loadAll(e.target.checked);
                  }}
                  className="accent-accent"
                />
                {ARENA_COPY.showRemovedUsers}
              </label>
            </div>
            <div className="mt-4 max-h-[32rem] space-y-3 overflow-y-auto">
              {users.map((user) => (
                <div
                  key={user.id}
                  className="border-card-border/70 rounded-xl border bg-stone-950/30 p-4"
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="font-medium">{user.displayName}</p>
                      <p className="text-muted text-sm">
                        {user.deletedAt
                          ? user.archivedEmail ?? user.email ?? `@${user.username}`
                          : (user.email ?? `@${user.username}`)}
                      </p>
                      <div className="mt-2 flex flex-wrap gap-1.5">
                        {user.roles.map((role) => (
                          <Badge key={role} tone="default">
                            {ROLE_OPTIONS.find((item) => item.id === role)?.label ?? role}
                          </Badge>
                        ))}
                        {user.deletedAt ? (
                          <Badge tone="warning">{ARENA_COPY.statusRemoved}</Badge>
                        ) : (
                          <Badge tone={user.active ? 'success' : 'warning'}>
                            {user.active ? ARENA_COPY.statusActive : ARENA_COPY.statusInactive}
                          </Badge>
                        )}
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {!user.deletedAt && (
                        <>
                          <Button variant="secondary" onClick={() => startEditUser(user)}>
                            {ARENA_COPY.edit}
                          </Button>
                          {currentUserId !== user.id && (
                            <Button variant="ghost" onClick={() => void removeUser(user.id)}>
                              {ARENA_COPY.delete}
                            </Button>
                          )}
                        </>
                      )}
                      {user.deletedAt && (
                        <Button variant="secondary" onClick={() => void restoreUser(user.id)}>
                          {ARENA_COPY.restoreAccount}
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </Card>

          <Modal
            open={Boolean(editingUser)}
            onClose={() => setEditingUser(null)}
            title={editingUser ? `Editar ${editingUser.displayName}` : ''}
          >
            {editingUser && (
              <>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <Label>{ARENA_COPY.displayName}</Label>
                    <Input
                      value={userDraft.displayName}
                      onChange={(e) => setUserDraft({ ...userDraft, displayName: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label>E-mail</Label>
                    <Input
                      type="email"
                      value={userDraft.email}
                      onChange={(e) => setUserDraft({ ...userDraft, email: e.target.value })}
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <Label>Papéis</Label>
                    <RoleCheckboxes
                      value={userDraft.roles}
                      onChange={(roles) => setUserDraft({ ...userDraft, roles })}
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="inline-flex items-center gap-2 text-sm">
                      <input
                        type="checkbox"
                        checked={userDraft.active}
                        onChange={(e) => setUserDraft({ ...userDraft, active: e.target.checked })}
                        className="accent-accent"
                      />
                      Conta ativa
                    </label>
                  </div>
                  <div className="sm:col-span-2">
                    <Label>{ARENA_COPY.resetPassword}</Label>
                    <div className="flex flex-col gap-2 sm:flex-row">
                      <Input
                        type="password"
                        placeholder={ARENA_COPY.resetPasswordHint}
                        value={userDraft.password}
                        onChange={(e) => setUserDraft({ ...userDraft, password: e.target.value })}
                      />
                      <Button type="button" variant="secondary" onClick={() => void resetPassword()}>
                        {ARENA_COPY.resetPassword}
                      </Button>
                    </div>
                  </div>
                </div>
                <div className="mt-6 flex flex-wrap gap-2 border-t border-white/[0.06] pt-4">
                  <Button onClick={() => void saveUser()}>{ARENA_COPY.save}</Button>
                  {currentUserId !== editingUser.id && (
                    <Button variant="danger" onClick={() => void removeUser(editingUser.id)}>
                      {ARENA_COPY.delete}
                    </Button>
                  )}
                  <Button variant="ghost" onClick={() => setEditingUser(null)}>
                    {ARENA_COPY.cancel}
                  </Button>
                </div>
              </>
            )}
          </Modal>
        </div>
      )}

      {tab === 'heroes' && (
        <div className="space-y-4">
          <Card>
            <CardTitle>{ARENA_COPY.heroRosterAdmin}</CardTitle>
            <CardDescription>{ARENA_COPY.heroRosterAdminHint}</CardDescription>
            <div className="mt-4 space-y-3">
              {characters.length === 0 && (
                <p className="text-muted text-sm">{ARENA_COPY.noDuelsYet}</p>
              )}
              {characters.map((character) => (
                <div
                  key={character.id}
                  className="border-card-border/70 flex flex-col gap-3 rounded-xl border bg-stone-950/30 p-4 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="min-w-0">
                    <p className="font-medium">
                      {character.name}{' '}
                      {!character.active && (
                        <span className="text-muted text-sm">(inativo)</span>
                      )}
                    </p>
                    <p className="text-muted text-sm">
                      {character.characterClass}
                      {character.subclass ? ` · ${character.subclass}` : ''} ·{' '}
                      {character.playerDisplayName}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="secondary" onClick={() => startEditCharacter(character)}>
                      {ARENA_COPY.edit}
                    </Button>
                    {character.active && (
                      <Button variant="ghost" onClick={() => void removeCharacter(character.id)}>
                        {ARENA_COPY.delete}
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </Card>

          <Modal
            open={Boolean(editingCharacter)}
            onClose={() => setEditingCharacter(null)}
            title={editingCharacter ? `${ARENA_COPY.editHero}: ${editingCharacter.name}` : ''}
            description={
              editingCharacter
                ? `Dono: ${editingCharacter.playerDisplayName} (${editingCharacter.playerEmail})`
                : undefined
            }
          >
            {editingCharacter && (
              <>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <Label>Nome</Label>
                    <Input
                      value={characterDraft.name}
                      onChange={(e) => setCharacterDraft({ ...characterDraft, name: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label>Classe</Label>
                    <Select
                      value={characterDraft.characterClass}
                      onChange={(e) =>
                        setCharacterDraft({ ...characterDraft, characterClass: e.target.value })
                      }
                    >
                      {CHARACTER_CLASSES.map((item) => (
                        <option key={item} value={item}>
                          {item}
                        </option>
                      ))}
                    </Select>
                  </div>
                  <div className="sm:col-span-2">
                    <Label>Subclasse</Label>
                    <Input
                      value={characterDraft.subclass}
                      onChange={(e) =>
                        setCharacterDraft({ ...characterDraft, subclass: e.target.value })
                      }
                    />
                  </div>
                  <div className="flex flex-col gap-2 sm:col-span-2">
                    <label className="inline-flex items-center gap-2 text-sm">
                      <input
                        type="checkbox"
                        checked={characterDraft.isDead}
                        onChange={(e) =>
                          setCharacterDraft({ ...characterDraft, isDead: e.target.checked })
                        }
                        className="accent-accent"
                      />
                      Morto na crônica
                    </label>
                    <label className="inline-flex items-center gap-2 text-sm">
                      <input
                        type="checkbox"
                        checked={characterDraft.active}
                        onChange={(e) =>
                          setCharacterDraft({ ...characterDraft, active: e.target.checked })
                        }
                        className="accent-accent"
                      />
                      Ativo no panteão
                    </label>
                  </div>
                </div>
                <div className="mt-6 flex flex-wrap gap-2 border-t border-white/[0.06] pt-4">
                  <Button onClick={() => void saveCharacter()}>{ARENA_COPY.save}</Button>
                  <Button variant="ghost" onClick={() => setEditingCharacter(null)}>
                    {ARENA_COPY.cancel}
                  </Button>
                </div>
              </>
            )}
          </Modal>
        </div>
      )}

      {tab === 'duels' && (
        <Card>
          <CardTitle>{ARENA_COPY.adminChronicles}</CardTitle>
          <CardDescription>{ARENA_COPY.adminChroniclesHint}</CardDescription>
          <div className="mt-4 space-y-3">
            {duels.length === 0 && (
              <p className="text-muted text-sm">{ARENA_COPY.noDuelsCreated}</p>
            )}
            {duels.map((duel) => (
              <div
                key={duel.id}
                className="border-card-border/70 flex flex-col gap-3 rounded-xl border bg-stone-950/30 p-4 sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-medium break-words">
                      {duel.playerA?.name ?? `${ARENA_COPY.cornerA} ?`} vs{' '}
                      {duel.playerB?.name ?? `${ARENA_COPY.cornerB} ?`}
                    </p>
                    <Badge tone={duel.status === 'completed' ? 'success' : 'warning'}>
                      {duelStatusLabel(duel.status)}
                    </Badge>
                  </div>
                  <p className="text-muted text-sm">
                    {duel.judgeName} · Runa {duel.token} · {duelTypeLabel(duel.isClassified)}
                    {duel.result
                      ? ` · ${duel.result.pointsA}/${duel.result.pointsB} ${ARENA_COPY.gloryShort}`
                      : ''}
                  </p>
                </div>
                <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
                  <Link href={`/judge/duel/${duel.id}`} className="w-full sm:w-auto">
                    <Button variant="secondary" className="w-full sm:w-auto">
                      {duel.status === 'completed'
                        ? ARENA_COPY.editChronicle
                        : ARENA_COPY.registerVerdict}
                    </Button>
                  </Link>
                  <Button
                    variant="ghost"
                    className="w-full sm:w-auto"
                    onClick={() => void removeDuel(duel.id)}
                  >
                    {ARENA_COPY.delete}
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}
