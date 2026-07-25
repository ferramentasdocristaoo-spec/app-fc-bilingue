# FC Sermon — Ferramentas do Cristão

Plataforma com IA para pastores e pregadores: criação de sermões, devocionais,
estudo bíblico e ferramentas de apoio ao ministério. App web (PWA) bilíngue.

## Stack

- **Vite** + **React 18** + **TypeScript**
- **Tailwind CSS** + **shadcn/ui**
- **Supabase** (banco, auth por e-mail aprovado, Edge Functions)
- **react-i18next** (5 idiomas: pt-PT, es, en, fr, it)
- **Vitest** + **Playwright** (testes)

## Desenvolvimento

```bash
npm install        # instalar dependências
npm run dev        # servidor de desenvolvimento (http://localhost:8080)
npm run build      # build de produção
npm run test       # testes unitários (Vitest)
npm run lint       # ESLint
```

## Variáveis de ambiente

Crie um `.env` na raiz (use `.env.example` como base):

```
VITE_SUPABASE_URL="https://<project>.supabase.co"
VITE_SUPABASE_PUBLISHABLE_KEY="<anon-key>"
VITE_SUPABASE_PROJECT_ID="<project-ref>"
```

## Supabase

- **Edge Functions:** `ai-assistant`, `bible-proxy`, `purchase-webhook` (em `supabase/functions/`).
- **Secrets necessários:** `OPENAI_API_KEY` (para a IA). Os demais (`SUPABASE_URL`,
  `SUPABASE_SERVICE_ROLE_KEY`, etc.) são injetados automaticamente.
- **Deploy das functions:**

```bash
supabase link --project-ref <project-ref>
supabase functions deploy ai-assistant
supabase functions deploy bible-proxy
supabase functions deploy purchase-webhook
```

## Estrutura

```
src/
├── pages/          # páginas (ferramentas + admin + login)
├── components/     # componentes (UI + admin)
├── hooks/          # auth, tema, tamanho de fonte, etc.
├── i18n/           # traduções (5 idiomas)
└── integrations/   # cliente Supabase
supabase/
├── functions/      # Edge Functions
└── migrations/     # schema do banco
```
