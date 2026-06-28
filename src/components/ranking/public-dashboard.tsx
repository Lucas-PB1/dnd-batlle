'use client';

import { useState } from 'react';
import { Card, CardDescription, CardTitle } from '@/components/ui/card';
import { Tabs } from '@/components/ui/tabs';
import type {
  CharacterRankingEntry,
  ClassStats,
  CompletedDuelSummary,
  PlayerRankingEntry,
} from '@/domain/entities';
import { ARENAS } from '@/shared/constants/game-rules';

const RANKING_TABS = [
  { id: 'characters', label: 'Personagens' },
  { id: 'players', label: 'Jogadores' },
] as const;

function StatPill({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="border-card-border rounded-xl border bg-stone-950/40 px-4 py-3">
      <p className="text-muted text-xs tracking-wide uppercase">{label}</p>
      <p className="text-accent mt-1 text-2xl font-semibold">{value}</p>
    </div>
  );
}

function ClassBar({ stat }: { stat: ClassStats }) {
  return (
    <div>
      <div className="mb-1 flex justify-between text-sm">
        <span>{stat.characterClass}</span>
        <span className="text-muted">{stat.winRate}% vitórias</span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-stone-800">
        <div
          className="from-accent-soft to-accent h-full rounded-full bg-gradient-to-r"
          style={{ width: `${Math.max(stat.winRate, 4)}%` }}
        />
      </div>
      <p className="text-muted mt-1 text-xs">
        {stat.wins}V · {stat.draws}E · {stat.losses}D ({stat.total} duelos)
      </p>
    </div>
  );
}

function outcomeLabel(outcome: CompletedDuelSummary['outcome'], a: string, b: string) {
  if (outcome === 'draw') return 'Empate';
  if (outcome === 'player_a') return `${a} venceu`;
  return `${b} venceu`;
}

function CharacterRankingTable({ ranking }: { ranking: CharacterRankingEntry[] }) {
  return (
    <>
      <div className="mt-4 space-y-3 sm:hidden">
        {ranking.length === 0 && (
          <p className="text-muted py-8 text-center text-sm">Nenhum duelo classificado ainda.</p>
        )}
        {ranking.slice(0, 10).map((entry, index) => (
          <div
            key={`${entry.characterId ?? entry.characterName}-${index}`}
            className="border-card-border/70 rounded-xl border bg-stone-950/30 p-4"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="text-muted text-xs">#{index + 1}</p>
                <p className="truncate font-medium">{entry.characterName}</p>
                <p className="text-muted truncate text-sm">
                  {entry.characterClass}
                  {entry.playerDisplayName ? ` · ${entry.playerDisplayName}` : ''}
                </p>
              </div>
              <div className="shrink-0 text-right">
                <p className="text-accent text-lg font-semibold">{entry.points}</p>
                <p className="text-muted text-xs">pts</p>
              </div>
            </div>
            <p className="text-muted mt-2 text-xs">
              Faixa {entry.bracket} · {entry.wins}V/{entry.draws}E/{entry.losses}D
            </p>
          </div>
        ))}
      </div>

      <div className="mt-4 hidden overflow-x-auto sm:block">
        <table className="min-w-[36rem] w-full text-sm">
          <thead className="text-muted text-left">
            <tr>
              <th className="pb-2">#</th>
              <th className="pb-2">Personagem</th>
              <th className="pb-2">Jogador</th>
              <th className="pb-2">Classe</th>
              <th className="pb-2">Pts</th>
              <th className="pb-2">V/E/D</th>
            </tr>
          </thead>
          <tbody>
            {ranking.length === 0 && (
              <tr>
                <td colSpan={6} className="text-muted py-8 text-center">
                  Nenhum duelo classificado ainda.
                </td>
              </tr>
            )}
            {ranking.slice(0, 10).map((entry, index) => (
              <tr
                key={`${entry.characterId ?? entry.characterName}-${index}`}
                className="border-card-border/60 border-t"
              >
                <td className="text-muted py-3">{index + 1}</td>
                <td className="py-3 font-medium">{entry.characterName}</td>
                <td className="text-muted py-3">{entry.playerDisplayName ?? '—'}</td>
                <td className="py-3">{entry.characterClass}</td>
                <td className="text-accent py-3">{entry.points}</td>
                <td className="text-muted py-3">
                  {entry.wins}/{entry.draws}/{entry.losses}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}

function PlayerRankingTable({ ranking }: { ranking: PlayerRankingEntry[] }) {
  return (
    <>
      <div className="mt-4 space-y-3 sm:hidden">
        {ranking.length === 0 && (
          <p className="text-muted py-8 text-center text-sm">Nenhum jogador no ranking.</p>
        )}
        {ranking.slice(0, 10).map((entry, index) => (
          <div
            key={entry.playerId}
            className="border-card-border/70 rounded-xl border bg-stone-950/30 p-4"
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-muted text-xs">#{index + 1}</p>
                <p className="font-medium">{entry.playerDisplayName}</p>
              </div>
              <div className="text-right">
                <p className="text-accent text-lg font-semibold">{entry.points}</p>
                <p className="text-muted text-xs">pts</p>
              </div>
            </div>
            <p className="text-muted mt-2 text-xs">
              {entry.wins}V/{entry.draws}E/{entry.losses}D · {entry.duels} duelos
            </p>
          </div>
        ))}
      </div>

      <div className="mt-4 hidden overflow-x-auto sm:block">
        <table className="min-w-[28rem] w-full text-sm">
          <thead className="text-muted text-left">
            <tr>
              <th className="pb-2">#</th>
              <th className="pb-2">Jogador</th>
              <th className="pb-2">Pts</th>
              <th className="pb-2">V/E/D</th>
              <th className="pb-2">Duelos</th>
            </tr>
          </thead>
          <tbody>
            {ranking.length === 0 && (
              <tr>
                <td colSpan={5} className="text-muted py-8 text-center">
                  Nenhum jogador no ranking.
                </td>
              </tr>
            )}
            {ranking.slice(0, 10).map((entry, index) => (
              <tr key={entry.playerId} className="border-card-border/60 border-t">
                <td className="text-muted py-3">{index + 1}</td>
                <td className="py-3 font-medium">{entry.playerDisplayName}</td>
                <td className="text-accent py-3">{entry.points}</td>
                <td className="text-muted py-3">
                  {entry.wins}/{entry.draws}/{entry.losses}
                </td>
                <td className="text-muted py-3">{entry.duels}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}

export function PublicDashboard({
  characterRanking,
  playerRanking,
  classStats,
  totalDuels,
  recentDuels,
}: {
  characterRanking: CharacterRankingEntry[];
  playerRanking: PlayerRankingEntry[];
  classStats: ClassStats[];
  totalDuels: number;
  recentDuels: CompletedDuelSummary[];
}) {
  const [rankTab, setRankTab] = useState<string>('characters');

  return (
    <div className="space-y-8">
      <section className="space-y-2">
        <p className="text-accent text-sm tracking-[0.2em] uppercase">Coliseu ao vivo</p>
        <h1 className="text-2xl font-bold sm:text-3xl sm:text-4xl">Ranking de Duelos</h1>
        <p className="text-muted max-w-2xl">
          Ranking por personagem e por jogador — apenas duelos classificados.
        </p>
      </section>

      <div className="grid gap-4 sm:grid-cols-3">
        <StatPill label="Duelos classificados" value={totalDuels} />
        <StatPill label="Personagens ranqueados" value={characterRanking.length} />
        <StatPill label="Jogadores ranqueados" value={playerRanking.length} />
      </div>

      <Card>
        <CardTitle>Top ranking</CardTitle>
        <CardDescription>Pontuação acumulada na temporada</CardDescription>
        <Tabs
          tabs={RANKING_TABS}
          activeId={rankTab}
          onChange={setRankTab}
          className="mt-4"
        />
        {rankTab === 'characters' ? (
          <CharacterRankingTable ranking={characterRanking} />
        ) : (
          <PlayerRankingTable ranking={playerRanking} />
        )}
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardTitle>Win rate por classe</CardTitle>
          <CardDescription>Percentual simples de vitórias</CardDescription>
          <div className="mt-4 space-y-4">
            {classStats.length === 0 && (
              <p className="text-muted py-8 text-center text-sm">Sem dados ainda.</p>
            )}
            {classStats.slice(0, 8).map((stat) => (
              <ClassBar key={stat.characterClass} stat={stat} />
            ))}
          </div>
        </Card>

        <Card>
          <CardTitle>Combates recentes</CardTitle>
          <CardDescription>Últimos duelos finalizados</CardDescription>
          <div className="mt-4 space-y-3">
            {recentDuels.length === 0 && (
              <p className="text-muted text-sm">Nenhum combate registrado.</p>
            )}
            {recentDuels.map((duel) => (
              <div
                key={duel.id}
                className="border-card-border/70 flex flex-col gap-2 rounded-xl border bg-stone-950/30 p-4 sm:flex-row sm:items-center sm:justify-between"
              >
                <div>
                  <p className="font-medium break-words">
                    {duel.playerAName}
                    {duel.playerADisplayName ? ` (${duel.playerADisplayName})` : ''} vs{' '}
                    {duel.playerBName}
                    {duel.playerBDisplayName ? ` (${duel.playerBDisplayName})` : ''}
                  </p>
                  <p className="text-muted text-sm">
                    {duel.playerAClass} vs {duel.playerBClass} ·{' '}
                    {outcomeLabel(duel.outcome, duel.playerAName, duel.playerBName)} ·{' '}
                    {duel.rounds} rodadas
                    {duel.arena ? ` · Arena ${ARENAS[duel.arena]?.name ?? duel.arena}` : ''}
                  </p>
                </div>
                <p className="text-muted text-xs">
                  {new Date(duel.completedAt).toLocaleString('pt-BR')}
                </p>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}
