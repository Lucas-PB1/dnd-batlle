# Arena Duel

Sistema Next.js para duelos 1v1 D&D 5.5 com persistência local em arquivos JSON.

## Funcionalidades

- **Ranking público** — histórico, pontuação e win rate por classe
- **Admin** — cadastro de juízes (`admin` / `admin123` no primeiro acesso)
- **Juiz** — gera link do duelo, jogadores se inscrevem, juiz registra resultado
- **Backend** — API Routes + arquivos em `data/`

## Stack

- Next.js 16 (App Router)
- TypeScript, Tailwind CSS
- Persistência: `data/users.json`, `data/duels.json`
- Arquitetura: Factory pattern, repositórios por arquivo, serviços de aplicação
- Qualidade: ESLint, Prettier (+ plugin Tailwind), Vitest, Husky

## Desenvolvimento

```bash
cd arena-duel
npm install
npm run dev
```

Acesse [http://localhost:3000](http://localhost:3000)

## Scripts

| Comando          | Descrição                   |
| ---------------- | --------------------------- |
| `npm run dev`    | Servidor de desenvolvimento |
| `npm run build`  | Build de produção           |
| `npm run lint`   | ESLint                      |
| `npm run format` | Prettier                    |
| `npm run test`   | Vitest                      |

## Fluxo

1. Admin entra e cadastra juízes em `/admin`
2. Juiz entra em `/judge` e gera link do duelo
3. Jogadores abrem `/duel/[token]` e preenchem nome/classe
4. Juiz registra arena e resultado em `/judge/duel/[id]`
5. Ranking atualiza automaticamente na home

## Dados locais

Usuários e duelos ficam em `data/`. Para resetar, esvazie os JSONs (mantendo `[]`).

Altere senha do admin editando `data/users.json` ou recrie o arquivo.

## Variáveis

```env
AUTH_SECRET=sua-chave-secreta
```
