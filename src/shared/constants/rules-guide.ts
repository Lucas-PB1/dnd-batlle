import { BRACKET_BY_CLASS } from '@/shared/constants/game-rules';

function classesForBracket(bracket: 'A' | 'B' | 'C'): string[] {
  return Object.entries(BRACKET_BY_CLASS)
    .filter(([, value]) => value === bracket)
    .map(([name]) => name)
    .sort((a, b) => a.localeCompare(b, 'pt-BR'));
}

export const RULES_SECTIONS = {
  overview: {
    title: 'Formato',
    items: [
      'Mesa: 2 jogadores + 1 juiz',
      'Personagem: nv. 7, monoclasse, ficha registrada antes da temporada',
      'Recursos: PV, magias e habilidades cheios a cada duelo',
    ],
  },
  equipment: {
    title: 'Equipamento',
    allowed: [
      'Pacote inicial da classe ou equivalente comprado com o ouro padrão da classe',
      'Poções pequenas e grandes, se compradas com esse ouro',
      'Foco arcano, símbolo sagrado ou instrumento — só se a classe/magia exigir',
    ],
    forbidden: ['Itens mágicos ou extras obtidos fora do pacote/ouro de classe'],
  },
  spells: {
    title: 'Magias',
    items: [
      'Todas permitidas (PHB 2024) — sem lista de ban',
      'Se uma magia quebrar o duelo, o juiz ajusta o efeito na hora (alcance, área, duração), em vez de proibir',
    ],
  },
  start: {
    title: 'Início do duelo',
    items: [
      'Sem surpresa',
      'Iniciativa normal; empate = reroll',
      'Posição simétrica (~9 m entre os combatentes)',
      'Sortear arena (d6) ou acordo mútuo',
    ],
  },
  end: {
    title: 'Fim do duelo',
    rows: [
      { result: 'Vitória', condition: 'Oponente inconsciente, rendido ou sem agir por 3 rodadas' },
      { result: 'Empate', condition: '25 rodadas sem vencedor' },
      { result: 'Desistência', condition: 'Derrota para quem desiste' },
    ],
    note: 'Anti-stall: quem só foge ou evita combate sem tentar encerrar → juiz declara vitória do oponente',
  },
  brackets: {
    title: 'Faixas & pontos',
    groups: [
      { bracket: 'A — Martiais', classes: classesForBracket('A') },
      { bracket: 'B — Meio-conjuradores', classes: classesForBracket('B') },
      { bracket: 'C — Conjuradores', classes: classesForBracket('C') },
    ],
    sameBracket: 'Mesma faixa: Vitória +3 · Empate +1 · Derrota 0',
    crossBracket:
      'Cross-faixa (favorecido: B > A · C > B · C > A): desfavorecido vence +4 · favorecido vence +2 · empate +1 (ambos)',
  },
  honors: {
    title: 'Honrarias (duelo classificado)',
    rows: [
      { title: 'Duelista', points: '4–6', bonus: '+1 em um teste de resistência' },
      { title: 'Veterano', points: '7–9', bonus: '+5 PV na arena (máx. +10 acumulado)' },
      { title: 'Mestre', points: '10+', bonus: '+1 feat' },
    ],
    notes: [
      'Handicap: ≥6 pts de diferença → só o líder desliga Honrarias',
      'Amistoso: sem Honrarias',
      'Nova temporada: pontos zeram; Honrarias permanecem',
    ],
  },
  judgeChecklist: {
    title: 'Checklist do juiz',
    steps: [
      'Validar ficha (classe, equipamento, faixa)',
      'Confirmar classificado ou amistoso; aplicar handicap de Honrarias',
      'Sortear arena e posicionar',
      'Conduzir combate (sem surpresa, anti-stall)',
      'Registrar resultado, faixa e pontos',
    ],
  },
} as const;

export const RULES_TABS = [
  { id: 'formato', label: 'Formato', section: 'overview' as const },
  { id: 'equipamento', label: 'Equipamento', section: 'equipment' as const },
  { id: 'magias', label: 'Magias', section: 'spells' as const },
  { id: 'combate', label: 'Combates', section: 'start' as const },
  { id: 'pontos', label: 'Pontos', section: 'brackets' as const },
  { id: 'arenas', label: 'Arenas', section: 'arenas' as const },
  { id: 'juiz', label: 'Juiz', section: 'judgeChecklist' as const },
] as const;
