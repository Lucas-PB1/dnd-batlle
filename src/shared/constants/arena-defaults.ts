export const DEFAULT_ARENAS = [
  {
    diceValue: 1,
    name: 'Areia',
    effect: 'Terreno difícil. Disparada → Acrobacia CD 12 ou Caído',
    description: 'Chão instável de areia compactada; movimentos bruscos exigem equilíbrio.',
    sortOrder: 1,
  },
  {
    diceValue: 2,
    name: 'Pilares',
    effect: 'Reação: pilar adjacente → +2 CA',
    description: 'Colunas espalhadas pelo coliseu oferecem cobertura reativa.',
    sortOrder: 2,
  },
  {
    diceValue: 3,
    name: 'Gelo',
    effect: 'Vantagem gerada em corpo a corpo → Acrobacia CD 13 ou Caído',
    description: 'Superfície escorregadia congela o passo dos combatentes.',
    sortOrder: 3,
  },
  {
    diceValue: 4,
    name: 'Pântano',
    effect: 'Ataque à distância >3 m → Desvantagem',
    description: 'Água rasa e lama atrapalham visão e estabilidade à distância.',
    sortOrder: 4,
  },
  {
    diceValue: 5,
    name: 'Desníveis',
    effect: 'Elevado → Vantagem em Força para empurrar/derrubar',
    description: 'Plataformas em alturas diferentes favorecem quem domina o terreno.',
    sortOrder: 5,
  },
  {
    diceValue: 6,
    name: 'Vazio',
    effect: 'Sem modificador ambiental',
    description: 'Arena neutra — apenas habilidade e sorte decidem o duelo.',
    sortOrder: 6,
  },
] as const;
