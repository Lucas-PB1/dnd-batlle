'use client';

import { useState } from 'react';
import { CardDescription, CardTitle } from '@/components/ui/card';
import { TabPanel, Tabs } from '@/components/ui/tabs';
import type { Arena } from '@/domain/entities';
import { RULES_SECTIONS, RULES_TABS } from '@/shared/constants/rules-guide';

function BulletList({ items }: { items: readonly string[] }) {
  return (
    <ul className="text-muted mt-3 space-y-2 text-sm">
      {items.map((item) => (
        <li key={item} className="flex gap-2">
          <span className="text-accent mt-1">•</span>
          <span>{item}</span>
        </li>
      ))}
    </ul>
  );
}

function RulesContent({ tabId, arenas }: { tabId: string; arenas: Arena[] }) {
  switch (tabId) {
    case 'formato':
      return (
        <div className="space-y-4">
          <BulletList items={RULES_SECTIONS.overview.items} />
          <div className="border-card-border/70 rounded-xl border bg-stone-950/30 p-4">
            <p className="text-sm font-medium">Fim do duelo</p>
            <div className="mt-3 overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="text-muted text-left">
                  <tr>
                    <th className="pb-2 pr-4">Resultado</th>
                    <th className="pb-2">Condição</th>
                  </tr>
                </thead>
                <tbody>
                  {RULES_SECTIONS.end.rows.map((row) => (
                    <tr key={row.result} className="border-card-border/60 border-t">
                      <td className="py-2 pr-4 font-medium">{row.result}</td>
                      <td className="text-muted py-2">{row.condition}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="text-muted mt-3 text-xs">{RULES_SECTIONS.end.note}</p>
          </div>
        </div>
      );

    case 'equipamento':
      return (
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="border-success/30 rounded-xl border bg-green-950/20 p-4">
            <p className="text-success text-sm font-medium">Permitido</p>
            <BulletList items={RULES_SECTIONS.equipment.allowed} />
          </div>
          <div className="border-danger/30 rounded-xl border bg-red-950/20 p-4">
            <p className="text-danger text-sm font-medium">Proibido</p>
            <BulletList items={RULES_SECTIONS.equipment.forbidden} />
          </div>
        </div>
      );

    case 'magias':
      return <BulletList items={RULES_SECTIONS.spells.items} />;

    case 'combate':
      return <BulletList items={RULES_SECTIONS.start.items} />;

    case 'pontos':
      return (
        <div className="space-y-4">
          <div className="grid gap-3 sm:grid-cols-3">
            {RULES_SECTIONS.brackets.groups.map((group) => (
              <div
                key={group.bracket}
                className="border-card-border/70 rounded-xl border bg-stone-950/30 p-4"
              >
                <p className="text-sm font-medium">{group.bracket}</p>
                <p className="text-muted mt-2 text-xs leading-relaxed">
                  {group.classes.join(' · ')}
                </p>
              </div>
            ))}
          </div>
          <div className="border-card-border/70 space-y-2 rounded-xl border bg-stone-950/30 p-4 text-sm">
            <p>{RULES_SECTIONS.brackets.sameBracket}</p>
            <p className="text-muted">{RULES_SECTIONS.brackets.crossBracket}</p>
          </div>
          <div>
            <p className="text-sm font-medium">{RULES_SECTIONS.honors.title}</p>
            <div className="mt-3 overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="text-muted text-left">
                  <tr>
                    <th className="pb-2 pr-4">Título</th>
                    <th className="pb-2 pr-4">Pontos</th>
                    <th className="pb-2">Bônus</th>
                  </tr>
                </thead>
                <tbody>
                  {RULES_SECTIONS.honors.rows.map((row) => (
                    <tr key={row.title} className="border-card-border/60 border-t">
                      <td className="py-2 pr-4 font-medium">{row.title}</td>
                      <td className="text-muted py-2 pr-4">{row.points}</td>
                      <td className="text-muted py-2">{row.bonus}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <BulletList items={RULES_SECTIONS.honors.notes} />
          </div>
        </div>
      );

    case 'arenas': {
      const maxDice =
        arenas.length > 0 ? Math.max(...arenas.map((arena) => arena.diceValue)) : 6;
      return (
        <>
          <p className="text-muted mb-3 text-sm">
            Sorteio com d{maxDice} — {arenas.length} arena(s) configurada(s).
          </p>
          <div className="space-y-3 sm:hidden">
            {arenas.map((arena) => (
              <div
                key={arena.id}
                className="border-card-border/70 rounded-xl border bg-stone-950/30 p-4"
              >
                <p className="text-accent text-sm font-semibold">
                  d{maxDice} = {arena.diceValue} · {arena.name}
                </p>
                <p className="text-muted mt-2 text-sm">{arena.effect}</p>
                {arena.description && (
                  <p className="text-muted/80 mt-1 text-xs">{arena.description}</p>
                )}
              </div>
            ))}
          </div>
          <div className="hidden overflow-x-auto sm:block">
            <table className="min-w-[32rem] w-full text-sm">
              <thead className="text-muted text-left">
                <tr>
                  <th className="pb-2 pr-4">Dado</th>
                  <th className="pb-2 pr-4">Arena</th>
                  <th className="pb-2">Mecânica</th>
                </tr>
              </thead>
              <tbody>
                {arenas.map((arena) => (
                  <tr key={arena.id} className="border-card-border/60 border-t">
                    <td className="text-accent py-3 pr-4 font-semibold">{arena.diceValue}</td>
                    <td className="py-3 pr-4 font-medium">{arena.name}</td>
                    <td className="text-muted py-3">
                      <p>{arena.effect}</p>
                      {arena.description && (
                        <p className="mt-1 text-xs opacity-80">{arena.description}</p>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      );
    }

    case 'juiz':
      return (
        <ol className="text-muted mt-2 space-y-3 text-sm">
          {RULES_SECTIONS.judgeChecklist.steps.map((step, index) => (
            <li key={step} className="flex gap-3">
              <span className="bg-accent/15 text-accent flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-semibold">
                {index + 1}
              </span>
              <span className="pt-0.5">{step}</span>
            </li>
          ))}
        </ol>
      );

    default:
      return null;
  }
}

export function RulesGuide({
  compact = false,
  arenas = [],
}: {
  compact?: boolean;
  arenas?: Arena[];
}) {
  const [activeTab, setActiveTab] = useState<string>(RULES_TABS[0].id);

  return (
    <div className="space-y-4">
      {!compact && (
        <section className="space-y-2">
          <p className="text-accent text-sm tracking-[0.2em] uppercase">Referência oficial</p>
          <h1 className="text-2xl font-bold sm:text-3xl sm:text-4xl">Regras do duelo</h1>
          <p className="text-muted max-w-2xl">
            Arenas, faixas, pontuação e checklist do juiz — D&D 5.5, nv. 7, monoclasse.
          </p>
        </section>
      )}

      <TabPanel
        header={
          <>
            <CardTitle>Guia completo</CardTitle>
            <CardDescription>Baseado no regulamento da temporada (PHB 2024)</CardDescription>
            <Tabs
              tabs={RULES_TABS}
              activeId={activeTab}
              onChange={setActiveTab}
              fill={false}
              className="mt-4"
            />
          </>
        }
      >
        <RulesContent tabId={activeTab} arenas={arenas} />
      </TabPanel>
    </div>
  );
}
