'use client';

import { Card, CardDescription, CardTitle } from '@/components/ui/card';
import type { ClassStats, CompletedDuelSummary, RankingEntry } from '@/domain/entities';
import { ARENAS } from '@/shared/constants/game-rules';

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

export function PublicDashboard({
  ranking,
  classStats,
  totalDuels,
  recentDuels,
}: {
  ranking: RankingEntry[];
  classStats: ClassStats[];
  totalDuels: number;
  recentDuels: CompletedDuelSummary[];
}) {
  return (
    <div className="space-y-8">
      <section className="space-y-2">
        <p className="text-accent text-sm tracking-[0.2em] uppercase">Coliseu ao vivo</p>
        <h1 className="text-3xl font-bold sm:text-4xl">Ranking de Duelos</h1>
        <p className="text-muted max-w-2xl">
          Histórico público de combates, pontuação da temporada e desempenho por classe.
        </p>
      </section>

      <div className="grid gap-4 sm:grid-cols-3">
        <StatPill label="Duelos registrados" value={totalDuels} />
        <StatPill label="Jogadores no ranking" value={ranking.length} />
        <StatPill label="Classes ativas" value={classStats.length} />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardTitle>Top ranking</CardTitle>
          <CardDescription>Pontos acumulados na temporada</CardDescription>
          <div className="mt-4 overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="text-muted text-left">
                <tr>
                  <th className="pb-2">#</th>
                  <th className="pb-2">Jogador</th>
                  <th className="pb-2">Classe</th>
                  <th className="pb-2">Pts</th>
                  <th className="pb-2">V/E/D</th>
                </tr>
              </thead>
              <tbody>
                {ranking.length === 0 && (
                  <tr>
                    <td colSpan={5} className="text-muted py-8 text-center">
                      Nenhum duelo finalizado ainda.
                    </td>
                  </tr>
                )}
                {ranking.slice(0, 10).map((entry, index) => (
                  <tr
                    key={`${entry.name}-${entry.characterClass}`}
                    className="border-card-border/60 border-t"
                  >
                    <td className="text-muted py-3">{index + 1}</td>
                    <td className="py-3 font-medium">{entry.name}</td>
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
        </Card>

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
      </div>

      <Card>
        <CardTitle>Combates recentes</CardTitle>
        <CardDescription>Últimos duelos finalizados pelos juízes</CardDescription>
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
                <p className="font-medium">
                  {duel.playerAName} ({duel.playerAClass}) vs {duel.playerBName} (
                  {duel.playerBClass})
                </p>
                <p className="text-muted text-sm">
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
  );
}
