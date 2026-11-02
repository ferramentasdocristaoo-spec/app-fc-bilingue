# fc-bilingue-content — Worker de conteúdo do app FC bilíngue

Serve o conteúdo pesado do app pela Cloudflare para cortar o egress do Supabase (plano gratuito).
Supabase continua com login, approved_emails, entitlements, progresso, pedidos de oração, IA e webhook.

| Rota | Acesso | Origem dos dados |
|---|---|---|
| `GET /v1/bible?version=&bookId=&chapter=` | pública | Cache API → R2 `bible/…` → bolls.life (uma vez por capítulo) |
| `GET /v1/library/{produto}/{volume}?lang=` | JWT do Supabase (ou e-mail antigo na transição) + `has_library_access` | R2 `library/{produto}/{volume}/{idioma}.json`, cai para pt-BR |
| `POST /v1/mural/images` | JWT (ou e-mail antigo) + `app_access_status = ok` | grava em R2 `mural/aaaa-mm/uuid.ext` (≤ 5 MB, tipo conferido pelos bytes) |
| `GET /v1/mural/…` | pública, imutável | R2 |

## Identidade
- `Authorization: Bearer <access token do Supabase Auth>` — assinatura conferida pela JWKS do projeto
  (`/auth/v1/.well-known/jwks.json`, ES256/RS256) ou, em projetos antigos, por `SUPABASE_JWT_SECRET` (HS256).
  Confere `exp`, `iss` (`<SUPABASE_URL>/auth/v1`), `aud = authenticated` e `role = authenticated`.
- `X-FC-Email` — login antigo só por e-mail. Aceito apenas com `ALLOW_LEGACY_EMAIL = "true"` (transição).
- O Worker **não usa service role**: só a chave pública + RPCs `SECURITY DEFINER` liberadas para anon.
  Respostas de permissão ficam 5 min no Cache API (negativas, 30 s).

## Desenvolvimento
```sh
cp .dev.vars.example .dev.vars   # preencher SUPABASE_ANON_KEY (ignorado pelo git)
npm install
npm run dev                      # wrangler dev em http://localhost:8787 (R2 simulado)
npm run typecheck
```
Os testes rodam pela suíte do app: `npm test` na raiz.

Deploy e criação do bucket: só com aprovação do dono — ver o roteiro no relatório
`Kawai-Jarvis/relatorios/2026-11-02-reforma-backend-fc.md`.
