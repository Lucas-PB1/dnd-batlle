# Arena Duel

Sistema Next.js para duelos 1v1 D&D 5.5 com ranking, painel de juiz e persistência em Postgres (produção) ou JSON local (dev).

## Funcionalidades

- **Ranking público** — histórico, pontuação e win rate por classe
- **Admin** — cadastro de juízes (`admin` / `admin123` no primeiro acesso)
- **Juiz** — gera link do duelo, jogadores se inscrevem, juiz registra resultado
- **Backend** — API Routes + repositórios (Postgres ou arquivos)

## Stack

- Next.js 16 (App Router)
- TypeScript, Tailwind CSS
- Persistência: **Neon Postgres** (via Vercel Storage) ou `data/*.json` local
- Arquitetura: Factory pattern, repositórios, serviços de aplicação
- Qualidade: ESLint, Prettier (+ plugin Tailwind), Vitest, Husky

## Desenvolvimento

```bash
cd arena-duel
npm install
npm run dev
```

Acesse [http://localhost:3000](http://localhost:3000)

Sem `DATABASE_URL`, os dados ficam em `data/`. Com `DATABASE_URL`, usa Postgres automaticamente.

## Deploy na Vercel (Postgres)

1. No projeto Vercel: **Storage** → **Create Database** → **Neon** (Postgres)
2. Conecte ao projeto — a Vercel injeta `DATABASE_URL` automaticamente
3. Defina `AUTH_SECRET` em **Settings → Environment Variables**
4. Faça deploy — as tabelas são criadas no primeiro acesso à API

> A Vercel não hospeda mais um Postgres próprio; o fluxo “Vercel Postgres” hoje é a integração com **Neon**, tudo pelo painel da Vercel (sem conta separada obrigatória).

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

## Dados locais (sem Postgres)

Usuários e duelos ficam em `data/`. Para resetar, esvazie os JSONs (mantendo `[]`).

## Variáveis

Copie `.env.example` para `.env.local`:

```env
AUTH_SECRET=sua-chave-secreta
DATABASE_URL=postgres://...   # opcional no dev; obrigatório na Vercel
```
