# Pendente para o Jarvis — App FC (wt-final, branch `app-novo`)

## 2026-11-21 · Botão Admin no app + Central de mensagens (push Firebase)
Feito por **Noé** (Tecnologia), com revisão do code-reviewer. Branch **`admin-push`** (a partir do `app-novo` 0f718e7), commits `fa25aed` + `46c8a9a` (+ este registro). **Sem push, sem deploy, sem SQL remoto, sem secret, nenhuma notificação enviada a cliente.**

**O que ficou pronto**
- **Admin pela sessão:** `session_admin_email()` / `is_session_admin()` — vale quem está logado no Supabase Auth com e-mail **confirmado** (`auth.users.email_confirmed_at`; não o `user_metadata` do JWT, que o próprio usuário edita) **e** ligado a uma linha de `admin_users` pelo `user_id`. `verify_admin` aceita a sessão (e-mail vazio ou o da sessão), então todas as RPCs `admin_*` e a geração da Jornada (`ai-assistant`) funcionam sem senha. O login antigo do painel (e-mail + senha) continua igual. Trocar a senha do painel continua exigindo a senha atual.
- **Botão "Admin"** só para admin: faixa no menu do celular (MenuSheet) e ícone no Dock. Leva direto a `/fc-control-panel` (sem senha na sessão); o painel tem **"Voltar ao app"** no topo, na lateral e no login. Nenhum e-mail fixo no front.
- **Notificações (modelo da Fome Livre):** convite "Ative as notificações" ("Agora não" esconde por 3 aberturas, no máximo 6 vezes), sininho no cabeçalho, passo a passo do iPhone (instalar na Tela de Início antes), aviso de bloqueado, textos nos 7 idiomas. Sair da conta desliga o aparelho.
- **Painel → aba Notificações:** título (60), mensagem (180), link do app, público (só um e-mail de teste / todos com acesso / por plano: Brasil, Internacional, com idiomas, lista antiga, vencidos) + filtro de idioma, prévia iPhone e Android, contagem "vai para N pessoas", confirmação "Tem certeza? Vai para N pessoas", histórico (chegaram, falhas, removidos, toques).
- **Banco** (`supabase/migrations/20261121010000_admin_sessao_e_push.sql`, só aditiva e idempotente): `admin_users.user_id`, `push_inscricoes`, `push_envios` com RLS (só o admin da sessão lê; escrita só por RPC ou service_role), RPCs `push_inscrever`, `push_desligar`, `push_marcar_aberto`.
- **Função `push-send`** (FCM HTTP v1, JWT RS256 com WebCrypto, 25 em paralelo, tokens mortos apagados, confirmação conferida no servidor, chave de idempotência, mesma mensagem para o mesmo público bloqueada por 1 min). `verify_jwt = false` no `config.toml` (a própria função confere o admin).
- **PWA:** o `sw.js` do vite-plugin-pwa só ganhou `importScripts("/push-sw.js")`; cache e atualização automática iguais. O SDK do Firebase vem num pedaço separado (~17 KB gzip), baixado só ao ativar.
- **Config web do Firebase:** o dono deixou `firebase-ferramentas-do-cristao.json` na raiz do `wt-final` (projeto `ferramentas-do-cristao`, com a VAPID pública). É público, mas a trava de segredos não deixou entrar no git: o arquivo está no `.gitignore` e o build lê ele (`import.meta.glob` em `src/lib/firebase-config.ts`). **Atenção:** build feito sem esse arquivo sai sem notificações (convite e sininho escondidos), sem quebrar nada.

**Qualidade:** `npm test` **299/299** (eram 270; +15 do SQL rodado num Postgres em memória/PGlite, +14 da função). `npm run build` ok. `tsc` só com os 10 erros antigos. `deno check` da `push-send` e da `ai-assistant` ok. Chrome (`scripts/teste-admin-push.mjs`, Supabase todo simulado): **20 conferências** em 390×844 (Android e iPhone) e 1440×900 — convite, sininho, Admin no menu/Dock só para admin, painel direto pela sessão, Voltar ao app, prévia, contagem, confirmação, histórico, login antigo, **push entregue ao service worker real vira notificação**. Com `TOKEN_REAL=1`: **token real do Firebase `ferramentas-do-cristao` gerado** (22 conferências; 1 rodada em 6 passou do limite de espera no perfil novo do Chrome, depois a espera foi aumentada). Prints: `direcoes-identidade/prints/admin-push/` (10).

**Não testado:** o trecho Google → aparelho (depende da conta de serviço) e o SQL no banco real.

**Riscos que ficam (decisão do dono):**
- Produção está no login **modo "email"** (sem sessão). Nesse modo: (1) o botão Admin só aparece no aparelho depois de entrar no painel uma vez com e-mail + senha; (2) a inscrição no push confia no e-mail digitado — alguém poderia inscrever um aparelho no e-mail de outra pessoa e receber os testes "só para esse e-mail" (não consegue apagar os aparelhos dela). Conserto definitivo: ligar login por senha ou link mágico (item 6 de 19/11).
- Toques ("aberto") são métrica aproximada: dá para inflar chamando a função.
- Revisão também apontou: se o envio passar do tempo limite da função (público muito grande), o histórico mostra "Interrompido".

### Passo a passo do dono (nesta ordem, cada um com "confirma")
1. **SQL** — Supabase FC-Bilingue (`rwyyggtsjbwnwzsnlkgy`) → SQL Editor → colar `supabase/migrations/20261121010000_admin_sessao_e_push.sql` → Run.
2. **E-mail admin** (pendente: `ferramentasdocristaoo@gmail.com` ou outro). Para acrescentar outro, no SQL Editor:
   ```sql
   INSERT INTO public.admin_users (email, password_hash)
   VALUES ('EMAIL-DO-DONO', extensions.crypt(gen_random_uuid()::text, extensions.gen_salt('bf')))
   ON CONFLICT (email) DO NOTHING;
   ```
3. **Ligar a conta ao admin** — só depois de o dono entrar no app com login por senha/link mágico e confirmar o e-mail (a conta precisa existir em Authentication → Users; confira que é a sua):
   ```sql
   UPDATE public.admin_users
   SET user_id = (SELECT id FROM auth.users WHERE lower(email) = 'EMAIL-DO-DONO' AND email_confirmed_at IS NOT NULL)
   WHERE email = 'EMAIL-DO-DONO';
   ```
   Recomendado: Authentication → Sign In / Providers → desligar **"Allow new users to sign up"** (clientes entram pela compra), a menos que o login dos clientes precise do cadastro aberto.
4. **Conta de serviço (SECRETA)** — Firebase → projeto `ferramentas-do-cristao` → ⚙️ Configurações do projeto → **Contas de serviço** → Firebase Admin SDK → **Gerar nova chave privada** (baixa um `.json`). Guardar no Keychain (serviço "Firebase admin (service account)", conta `ferramentas-do-cristao`, valor em base64, como na Fome Livre: ver `Area-Membros-push/PUBLICAR-PUSH.md`), apagar o arquivo baixado e mandar do Keychain direto para o secret **`FCM_SERVICE_ACCOUNT`** da função (`supabase secrets set --project-ref rwyyggtsjbwnwzsnlkgy FCM_SERVICE_ACCOUNT=…` lendo do Keychain, sem colar na tela). O config web e a VAPID pública **já estão** no JSON da raiz; se mudar, baixar de novo em Configurações → Geral → app da Web e Cloud Messaging → Certificados de push da Web.
5. **Deploy das funções:** `supabase functions deploy push-send --project-ref rwyyggtsjbwnwzsnlkgy` e `supabase functions deploy ai-assistant --project-ref rwyyggtsjbwnwzsnlkgy`.
6. **Merge** `admin-push` → `app-novo` (`git merge --ff-only admin-push`), push e deploy do app (Pages `app-fc-bilingue`), com o build **nesta máquina** (precisa do JSON do Firebase).
7. **Conferir sem incomodar clientes:** painel → Notificações mostra **"Firebase pronto · ferramentas-do-cristao"**; no iPhone do dono, instalar o app na Tela de Início → abrir pelo ícone → Ativar → Permitir; no painel, público **"Só um e-mail (teste)"** → Enviar teste → conferir se chega e se o toque abre o link. **Não usar "Todos" nem plano** até o dono decidir a primeira mensagem.

**Voltar atrás:** tirar o secret `FCM_SERVICE_ACCOUNT` desliga os envios; as tabelas novas podem ficar. Notificação enviada não tem volta.

---

## 2026-11-20 · Jornada: Levítico, Deuteronômio, Juízes e Rute interativos
Feito por **Noé** (Tecnologia), com 4 ajudantes (um por livro) e revisão do code-reviewer. **Sem push, sem deploy, sem SQL.** 7 commits locais no `app-novo` (2a0718b..85a6b9b), em cima de 0d08bb4 (produção).

**Pronto (mesmo padrão de Gênesis/Êxodo/Números/Josué):** mapa com paradas, quiz por movimento, família, linha do tempo, capítulos com título e descrição próprios, 3 princípios com referência, nos 6 idiomas do conteúdo, tudo `pendente-revisao-humana`.
- `2a0718b` **Levítico**: 26 paradas, todas no Sinai ou só de texto (o livro não sai do Sinai), família de Arão (Lv 10), gravura *The Scapegoat* (Holman Hunt, 1854–56, PD).
- `0d1025f` **Deuteronômio**: 28 paradas (Moabe; lembranças de Horebe, Cades, Hesbom, Edrei; Gerizim/Ebal; Nebo), 3 lugares novos, gravura Schnorr 063 (Moisés impõe as mãos sobre Josué).
- `a2e421a` **Juízes**: 30 paradas (Bezeque a Siló), 19 lugares e 22 pessoas novos, gravuras Schnorr 076 (os 300 de Gideão), 078 (filha de Jefté), 082 (Sansão no templo).
- `547b814` **Rute**: 13 paradas (Moabe, Belém, campo, eira, porta), genealogia Rt 4:18-22 (Perez a Davi), gravuras Schnorr 084 e 085.
- `ac84da4` Cabeçalho do movimento: personagens vêm das paradas do próprio movimento (antes Juízes · Sansão listava Débora, Gideão, Jefté). Vale para todos os interativos menos Gênesis.
- `85a6b9b` 10 achados da revisão (referências, Otniel, Dt 27, Jabim de Jz 4 ≠ Js 11, data do fim dos Juízes etc.).
- Gravuras: licença conferida na API do Commons ("Public domain"), nenhuma representa Deus (ficaram de fora a Schnorr 064, Deus abraçando Moisés, e a 075, Anjo do Senhor com Gideão). Aparecem sozinhas na página **Fontes e licenças** (`journeyPublicDomainFigures`).
- Lugares: coordenadas do OpenBible.info (CC BY 4.0), primeira identificação, com `openBibleId` e grau de certeza.
- Teste do pt-BR corrigido: o `\b` do JS não entende acentos ("Moisés" casava com "és").

**Qualidade:** `npm test` **270/270** (eram 238), `npm run build` ok, `tsc` só com os 10 erros antigos. Chrome headless (390 px, pt-BR): os 4 livros abrem sem erro de página, gravuras carregam, Fontes lista as 7 novas.

**Atenção (pt-BR):** a Jornada não tem chave `pt-BR` própria; o pt-BR lê o `pt-PT`. Nos 4 livros novos o texto da chave `pt-PT` foi escrito na **norma brasileira** (e o título virou "Deuteronômio"), então quem usa pt-PT lê português do Brasil nesses livros. Se o dono quiser os dois separados, é preciso criar `pt-BR` em `JourneyLanguage` (refatoração maior).

**Para a revisão humana:** textos e quizzes dos 4 livros; citações são paráfrases próximas da Almeida, não texto literal; a gravura de Hunt é colorida (as outras são xilogravuras P&B); lugares debatidos (Bete-Peor, Bezeque, Boquim, Ofra, Mispa de Gileade, Aroer, Leí); numeração de Dt 29 e Lv 6 muda nas Bíblias alemã/italiana; datas são da cronologia tradicional (aproximadas).

**Falta construir (próximos, mesma ordem):** 1–2 Samuel, 1–2 Reis, 1–2 Crônicas…; **Atos** (prioridade alta) e Evangelhos precisam antes de um **segundo mapa-base** mais largo (Roma/Grécia ficam fora do atual, long. 28,5–49,5) e de o `JourneyMap` escolher o mapa por livro (`scripts/journey-map/build_base_map.py`).

**Depende do dono:** os mesmos itens de 19/11 abaixo (push + deploy, SQL dos planos etc.) — nada novo aqui exige SQL ou segredo.

---

## 2026-11-19 · App funcionando de ponta a ponta (pt-BR) — teste real no navegador e correções
Feito por **Noé** (Tecnologia), com 2 ajudantes na Jornada e revisão do code-reviewer. Pedido do dono: "trabalhe pesado no app do Ferramentas do Cristão e faça ele funcionar". **Sem push, sem deploy, sem SQL, sem secrets.** 15 commits locais no `app-novo` (e99b6aa..c542b84).

**Como testei:** `vite` local na porta 3177 + Chrome headless (Playwright), conta `ferramentasdocristaoo@gmail.com` (a `kawaisolutions@gmail.com` não está aprovada), 390×844 e 1440×900, pt-BR, IA de verdade.

**O que funcionou já no teste:** login (entrar, janela nova mantém, sair), Início, Bíblia pt-BR (16 versões, padrão ARA, livros, capítulos, ouvir em voz pt-BR, próximo capítulo), Oficina (gerou esboço em ~26 s; Copiar, TXT, PDF/impressão, salvar rascunho), Meus Esboços, Raio-X/Devocional/Nomes/Mineração (IA em 6–12 s; 2ª vez sai do cache local pt-BR em ~1,5 s, `cacheHit: true`), Voz de Deus, Púlpito, Mural (lista e formulário; **não publiquei pedido** para não sujar o mural real), Livraria (coleção e leitor com marca d'água), Jornada, Ajustes (idioma, A−/A+, tema escuro), troca de idioma, desktop com Dock.

**O que estava quebrado e foi corrigido (commits):**
- `faa6965` Hambúrguer do topo no celular abria o menu lateral antigo → agora abre a folha **MenuSheet** (mesma da aba Menu).
- `a1491ef` Bíblia: quando o capítulo falhava (ex.: **429 do bolls.life**, visto ao trocar para NVI) a tela continuava com o texto anterior sob o título novo. Agora mostra o aviso; novas tentativas em 429/5xx; cache da sessão; `bible-proxy` com Cache-Control (vale após deploy da função).
- `7c2b683` Legibilidade: 50 regras de CSS + 4 `text-xs` abaixo de 14 px → 14 px. Varredura: 0 textos < 14 px nas 14 telas.
- `81e9602` + `c6e8d2e` Contraste: livro dourado da estante 4,7→7,8:1; tokens `--gold-ink`, `--ink-2`, `--ink-3` ajustados. Varredura: 0 textos < 7:1 nos dois temas.
- `b351f3a` Login: a RPC `app_access_info` ainda não existe no banco (404 a cada abertura) → lembra por 10 min e usa `app_access_status`.
- `a247959` Raio-X pela barra do versículo abria vazio (ignorava `?ref=`) → já analisa.
- `d2ff0a2` Meus Esboços prometia "editar" e não tinha botão → **Continuar na Oficina** (substitui o mesmo item, sem duplicar).
- `a961618` X dos diálogos com 48 px de toque e rótulo traduzido.
- `2122951` "Salvar" versículo gravava mas não aparecia em lugar nenhum → seção **Versículos salvos** na Estante (abrir/remover); estante e "Continuar leitura" viraram botões (teclado/leitor de tela).
- `0ef5993` Achados da revisão: finalizado não vira rascunho ao trocar; edição em andamento não se perde; "Fechar e começar outro" no editor; "Pregar" guarda o trabalho aberto; Raio-X não repete a chamada paga ao voltar/recarregar; pedidos velhos da Bíblia são cancelados; `[]` não vai para cache.
- `891c96f` + `c542b84` **Jornada: Números e Josué interativos** (paradas no mapa, quiz, famílias, linha do tempo, capítulos com título próprio, 6 idiomas) — `pendente-revisao-humana`.

**Qualidade:** `npm test` **238/238**, `npm run build` ok, `tsc` só com os 10 erros que já existiam, varredura final sem erro de página nem requisição falhando (fora o 404 esperado da RPC).

**Levantamento da Jornada (66 livros):** com camada interativa e capítulos próprios: **Gênesis, Êxodo, Números, Josué**. Os outros 62 têm seções, mas capítulos genéricos ("Seção · N", mesma descrição) e nenhuma parada/quiz. **Atos** não cabe no mapa-base atual (long. 28,5–49,5: Roma, Atenas, Corinto, Filipos ficam fora) — precisa gerar um mapa-base mais largo (`scripts/journey-map/build_base_map.py`) antes. Próximos sugeridos no mesmo padrão: Levítico, Deuteronômio, Juízes, Rute, 1–2 Samuel.

**Depende do dono ("confirma"):**
1. **Push do `app-novo` + deploy de produção** (Pages `app-fc-bilingue`, conta FC).
2. **SQL dos planos** no SQL Editor do Supabase FC-Bilingue: `supabase/migrations/20261114010000_sku_plans_e_idiomas.sql` e depois `supabase/sql/2026-11-14-sku-plans-kawaipay.sql` com os **IDs dos 6 produtos KawaiPay** (o 404 de `app_access_info` some com isso).
3. **Deploy das funções** `purchase-webhook` (com `--no-verify-jwt`) e `bible-proxy` (Cache-Control); `ai-assistant` só se mudar algo.
4. **Cache pt-BR "sujo"**: respostas pt-BR geradas antes de 17/11 saíram em português de Portugal (ex.: Raio-X de João 3:16 com "unigénito"). Limpeza sugerida (dono roda no SQL Editor): `DELETE FROM public.ai_cache WHERE cache_key LIKE '%"lang":"pt-BR"%' AND created_at < '2026-11-17';`
5. Secrets `FC_BRASIL_URL`/`FC_BRASIL_SERVICE_KEY` para o cache compartilhado com o FC Brasil (hoje tudo sai do cache local, `cacheSource: "local"`).
6. **Login dos clientes** (hoje modo "email"; senha ou link mágico) e e-mail de teste aprovado para o dono (`kawaisolutions@gmail.com` não entra).
7. Revisão humana dos textos de Números e Josué (e dos de Gênesis/Êxodo).
8. **bolls.life limita pedidos (429)**: a produção usa a `bible-proxy` do Supabase; o Worker `fc-content` (cache na borda) resolveria de vez — decidir se liga `VITE_CONTENT_API_URL`.

**Não confirmado:** qual provedor respondeu (Anthropic ou OpenAI) — a resposta da função não informa; ver nos logs da `ai-assistant`.

---


## 2026-11-14 · Versões brasileiras da Bíblia e cache de IA compartilhado com o FC Brasil (branch local `brasil-cache`, commits 80c10b5 e cccf855)
Feito por Noé (Tecnologia). Decisão do dono por voz (14/11): um app só; o brasileiro volta ao bilíngue. Worktree `wt-brasil` criado a partir do `app-novo` (7272166); o `wt-final` do Jafé não foi tocado. **Merge no `app-novo` fica com o Jarvis.** Sem push, sem deploy, sem `supabase db push`, nenhum segredo em arquivo.

**1 · Bíblia em pt-BR (80c10b5)**
- `src/data/bible-versions.ts`: chave `pt-BR` com as 12 versões do FC Brasil (`fc-sermon/src/pages/BibliaPage.tsx`): ACF11, ARA, ARC09, ALM21, KJA, NAA, NBV07, NTLH, NVIPT, NVT, TB10, VFL. Padrão pt-BR = **ARA**. Mesma fonte bolls.life pelo Worker `fc-bilingue-content` (`/v1/bible`), sem mudança no Worker. As 12 conferidas na bolls.life (Gn 1 → 31 versículos cada). O pedido citava 8; copiei a lista completa de lá (as outras 4 também respondem) — se o dono quiser só as 8, é cortar 4 linhas.
- `normalizeBibleLanguage`: `pt-BR`/`pt-br`/`pt_BR` → `pt-BR`; `pt` sem região e os outros lusófonos continuam em `pt-PT` (OL). Página da Bíblia, Dock e versículo do dia usam esse normalizador.
- `src/lib/daily-verse.ts`: `dailyVerseVersion()` = `DEFAULT_VERSION_BY_LANG[normalizeBibleLanguage(lang)]` (pt-BR → ARA, pt-PT → OL, en → KJV…), fonte única com a página da Bíblia.
- Conferido e **não alterado**: `src/features/bible-journey/editorial-queue.ts` (`BIBLE_SOURCE_BY_LANGUAGE` é por `JourneyLanguage`, que não tem pt-BR — a Jornada em pt-BR continua em reserva no pt-PT, como decidido em 14/11 no pt-BR do Tércio); `library.ts` e `branding.ts` idem.
- Testes: `pt-br-locale.test.ts` (expectativa pt-BR → pt-PT na Bíblia virou pt-BR → pt-BR, com comentário) e novo `bible-versions-pt-br.test.ts` (7).

**2 · Cache de IA compartilhado (cccf855)**
- **Chave de cache (documentada no cabeçalho de `supabase/functions/ai-assistant/shared-cache.ts`):** os dois projetos têm a mesma tabela `ai_cache(action, cache_key, result, expires_at, created_at)`, UNIQUE (action, cache_key), TTL 30 dias (migrations 20260323220810 + 20260409153627, iguais nos dois). FC Brasil: `cache_key = JSON.stringify(payload, Object.keys(payload).sort())`, payload **sem idioma** (ex.: `{"referencia":"João 3:16"}`). Bilíngue: o hook `use-ai.ts` acrescenta `lang`, logo a chave local é `{"lang":"pt-BR","referencia":"João 3:16"}`. **Unificação (só do lado do bilíngue):** em pt-BR, a chave do Brasil = payload **sem `lang`**, idêntica à de lá. Payloads das 5 ações conferidos campo a campo nos dois apps (iguais, inclusive `tempo: "N minutos"` e `tipo` ∈ Expositivo/Temático/Textual em pt-BR).
- Fluxo em pt-BR (ações `gerar-esboco`, `raio-x`, `devocional`, `garimpo`, `nomes`): lê primeiro o `ai_cache` do FC-BRASIL (limite 4 s), depois o local; gera; grava **nos dois** (upsert). Erro/demora no Brasil só vai para o log e cai no local — nunca derruba a resposta. `jornada-capitulo` (só do bilíngue) e os outros 6 idiomas: cache local, como antes. Resposta ganhou `cacheSource` ("fc-brasil" | "local"); o front ignora.
- Conexão: `createClient(FC_BRASIL_URL, FC_BRASIL_SERVICE_KEY)` lidos de `Deno.env` — **secrets da função**, nada no código. Sem os dois secrets a função avisa no log e segue só com o cache local.
- Testes: `ai-cache-shared.test.ts` (17: chave igual à fórmula do FC Brasil para os 5 payloads, ordem das chaves, pt-BR em 3 grafias, reserva em erro/timeout/ausência, gravação parcial). `deno check` da função ok.

**Qualidade:** suíte **175/175** (151 + 7 + 17), `npm run build` ok, ESLint dos arquivos alterados limpo (restam só os preexistentes: 2 na `BibliaPage.tsx` e 4 `any` na `index.ts` da função), `git diff --check` limpo.

**Comandos que o dono roda (depois do merge no `app-novo`, na pasta do projeto, com o token do Supabase do Keychain `supabase-fc-bilingue` no padrão de `Kawai-Jarvis/memoria/deploy-cloudflare.md`):**
```sh
# 1) secrets da função — a service_role do FC-BRASIL está em Supabase → projeto FC-BRASIL → Project Settings → API (colar no terminal, nunca em arquivo)
supabase secrets set --project-ref rwyyggtsjbwnwzsnlkgy \
  FC_BRASIL_URL="https://vnqhgogqoexvfvecnoav.supabase.co" \
  FC_BRASIL_SERVICE_KEY="<COLE_AQUI_A_SERVICE_ROLE_DO_FC_BRASIL>"
# 2) deploy da função (leva junto o pt-BR na IA, pendente desde o pt-BR do Tércio; verify_jwt=false já está no config.toml)
supabase functions deploy ai-assistant --project-ref rwyyggtsjbwnwzsnlkgy
```
Conferência depois do deploy: um Raio-X em pt-BR de uma referência já pesquisada no FC Brasil deve voltar com `cacheHit: true, cacheSource: "fc-brasil"` (nos logs da função: "Cache HIT (fc-brasil)").

**Decisões pendentes do dono**
1. **TTL de 30 dias:** as duas funções só servem linhas com `expires_at` no futuro; das ~27 mil respostas do Brasil, só as geradas nos últimos 30 dias (ou regeneradas) saem do cache. Para a ideia "rodar só do cache sem custo de IA", escolher: (a) tirar o filtro de `expires_at` na leitura do Brasil (1 linha em `index.ts`, `supabaseCacheStore.read`) ou (b) SQL no FC-BRASIL estendendo `expires_at` (ex.: `UPDATE public.ai_cache SET expires_at = now() + interval '10 years';`) — rodado pelo dono no SQL Editor, nunca `db push`.
2. **Chave usada:** `service_role` do FC-BRASIL dentro da função do bilíngue = acesso total ao banco do Brasil a partir do bilíngue. A `anon` não serve sem uma policy de UPDATE em `ai_cache` (o upsert precisa). Mantido como pedido; alternativa é criar um papel só para `ai_cache`.
3. Lista de versões: 12 (completa do FC Brasil) ou só as 8 citadas.
4. **Aviso de merge:** o `wt-final` do Jafé tem `src/pages/BibliaPage.tsx` e `src/test/biblia-estante-leitor.test.tsx` modificados sem commit; minha mudança na `BibliaPage.tsx` é 1 comentário (l. 136) e um `useEffect` de 7 linhas (versão volta ao padrão do idioma se a atual não existir na lista nova, achado da revisão). A `index.ts` da função não foi tocada pelo Jafé (ele mexeu em `purchase-webhook`).

**Ideia futura registrada (não implementar agora):** ligação de bancos mais ampla entre bilíngue e FC Brasil; o FC Brasil continua rodando para os clientes vitalícios e, com o cache grande, pode rodar só do cache sem custo de IA.

---

## 2026-11-14 · Acesso por plano: validade, webhook KawaiPay e trava de idiomas (branch local `app-novo`)
Feito por Jafé (Tecnologia, chefe Noé). Pedido do dono: deixar o FC pronto para vender amanhã pelo checkout KawaiPay. **Sem push, sem deploy, sem SQL aplicado**: tudo em commit local + comandos abaixo para o dono rodar.

**O que ficou pronto no código**
- `supabase/migrations/20261114010000_sku_plans_e_idiomas.sql` (idempotente): garante `sku_plans` (+ coluna nova `unlocks_languages`, `months >= 0`), `approved_emails.idiomas_liberados` e `updated_at`, e cria a RPC `app_access_info(email)` → `{status, plan, expires_at, idiomas_liberados}`. `app_access_status` (usada pelo Worker fc-content) não mudou.
- `supabase/sql/2026-11-14-sku-plans-kawaipay.sql`: as 6 linhas do mapa de planos com placeholders `<ID_PRODUTO_KAWAIPAY_MENSAL|_3M|_6M|_12M|_ADICIONAL_IDIOMAS|_INTERNACIONAL_MENSAL>` → `br_mensal/br_3m/br_6m/br_12m` (1/3/6/12 meses), `adicional_idiomas` (0 meses, `unlocks_languages`), `intl_mensal` (1 mês, `unlocks_languages`). O webhook compara a coluna `sku` com `product_sku` **e** `product_id` do evento: pode colar qualquer um dos dois.
- `supabase/functions/purchase-webhook/` reescrita (`parse.ts` puro + `index.ts`): lê o formato real da KawaiPay (`events[0].event_key/event_name`, `data.customer_email`, `data.product_id/product_sku`, `order_bumps[]` e `upsells[]` no topo). `compra_aprovada` e `assinatura_renovada` liberam; `reembolso`/`chargeback` → `bloqueado = true` (se só o SKU do adicional foi reembolsado, tira só `idiomas_liberados`); o resto (`compra_recusada`, `pix_gerado`, `carrinho_abandonado`, `assinatura_cancelada`…) responde `200 ignored`. **Nunca 404.** Renovação estende a partir do maior entre hoje e a validade atual. Order bump do adicional de idiomas liga `idiomas_liberados` sem mexer na validade; bump sozinho sem plano cria a linha já vencida (não dá acesso). **SKU desconhecido não libera nada** (a mesma loja vende os e-books da Livraria) e responde `200 ignored` com aviso no log. Compra nova desbloqueia quem estava bloqueado por reembolso antigo. Formatos antigos (Hotmart/Kiwify/campo direto) continuam aceitos.
- Login (`src/hooks/use-auth.tsx`): confere pela RPC nova → `app_access_status` → tabela; **vencido ou bloqueado cai na tela `AccessDeniedPage`** (7 idiomas: título simpático, botão "Renovar assinatura"/"Assinar de novo" → `RENEW_URL`, "Entrar com outro e-mail"). No modo e-mail, quem já estava logado é conferido de novo ao abrir o app (antes ficava para sempre). Sem rede, quem já estava dentro continua dentro; quem está entrando vê `login.errorUnavailable`.
- Trava de idiomas (`src/i18n/app-languages.ts`, ponto único `idiomasLiberados()`): plano `br_*` sem adicional → só pt-BR; adicional ou `intl_*` → os 7; **sem plano conhecido (lista antiga de e-mails, `plan` null/"manual") → os 7, como antes**. Plano gravado no aparelho (`fc-sermon-plano`) e reativo (`usePlanoAtual`). Se o idioma em uso ficar fora do plano no login, troca para o primeiro liberado. Bandeiras fora do plano: apagadas com cadeado, ao tocar abre o aviso "Idiomas adicionais · Ative na sua assinatura para usar X" com link "Ativar idiomas" → `UPGRADE_IDIOMAS_URL`. Dock (Ajustes), seletor do login e lista vertical: opção desabilitada com "· Idiomas adicionais". Folha do celular e menu usam o mesmo `LanguageFlags`.
- URLs placeholder em `src/lib/planos.ts`: `https://ferramentasdocristao.com/br` (renovar) e `…/br#idiomas` (adicional). **Confirmar com o dono.**
- Testes: suíte **183/183** (151 + 32 novos: `purchase-webhook-parse.test.ts` com payload KawaiPay de exemplo, bumps, renovação, validade dia 31; `planos-idiomas.test.tsx` com trava, bandeiras com cadeado/aviso, tela de vencido/bloqueado, re-conferência no modo e-mail, sem rede). `npm run build` ok. ESLint dos arquivos alterados: 0 erros (2 avisos preexistentes de fast-refresh em use-auth). `deno check` do webhook ok. `git diff --check` limpo. `tsc`: os 10 erros são todos preexistentes em arquivos não tocados.

**O dono precisa rodar/decidir (nesta ordem)**
1. **IDs dos 6 produtos na KawaiPay** (mensal, 3M, 6M, 12M, adicional de idiomas, internacional mensal) → trocar os placeholders em `supabase/sql/2026-11-14-sku-plans-kawaipay.sql`.
2. **SQL** no SQL Editor do Supabase `rwyyggtsjbwnwzsnlkgy` (não usar `supabase db push`): primeiro `supabase/migrations/20261114010000_sku_plans_e_idiomas.sql`, depois o arquivo do item 1. Conferir: `SELECT sku, plan_name, months, unlocks_languages FROM sku_plans;`
3. **Deploy das 2 funções** (padrão do bloco FC de `memoria/deploy-cloudflare.md`, rodar dentro de `wt-final/`; o token sai do Keychain, não digitar):
   ```sh
   cd "$HOME/Documents/Projetos-Kawai-Solutions/App-Sermon - Bilingue/wt-final"
   SUPABASE_ACCESS_TOKEN="$(security find-generic-password -s supabase-fc-bilingue -a SUPABASE_ACCESS_TOKEN -w)" supabase functions deploy ai-assistant --project-ref rwyyggtsjbwnwzsnlkgy
   SUPABASE_ACCESS_TOKEN="$(security find-generic-password -s supabase-fc-bilingue -a SUPABASE_ACCESS_TOKEN -w)" supabase functions deploy purchase-webhook --project-ref rwyyggtsjbwnwzsnlkgy --no-verify-jwt
   ```
4. **Webhook na KawaiPay** (painel → Webhooks, ou `kawaipay_criar_webhook` com confirmação): URL `https://rwyyggtsjbwnwzsnlkgy.supabase.co/functions/v1/purchase-webhook`, eventos **Compra aprovada, Assinatura renovada, Reembolso, Chargeback** (os outros são ignorados sem erro). Depois de uma compra de teste, conferir em `approved_emails` o `expires_at` e `idiomas_liberados`.
5. **Confirmar as URLs** de renovar/adicional em `src/lib/planos.ts` (hoje `ferramentasdocristao.com/br`, página que o Aoliabe está fazendo).
6. **Publicar o app** ("confirma" → push do `app-novo` + deploy de produção), que leva junto o pt-BR e a correção da Bíblia.
7. Decidir: e-mails antigos sem plano continuam com os 7 idiomas (comportamento atual); se quiser travar também, basta gravar `plan = 'br_mensal'` neles. Conferir se a KawaiPay manda algum cabeçalho secreto no webhook para validar (hoje a função aceita qualquer origem, como antes).

## 2026-11-14 · Português do Brasil (pt-BR) no app (branch local `app-novo`)
Feito por Tércio (Copy e Conteúdo). Pedido do dono por voz (14/11): "colocar agora o português brasileiro". Quem acessa do Brasil caía no português de Portugal.
- **Locale novo** `src/i18n/locales/pt-BR/translation.json`: tradução de verdade a partir do pt-PT (513 chaves, mesmas chaves e placeholders): "você", compartilhar, salvar, excluir, tela, aplicativo, aparelho, e-mail, senha, "Gerando…" em vez de "A gerar…", nomes brasileiros dos 66 livros (Gênesis, Deuteronômio, Jó, Oseias, Obadias, Filemom…). Revisão final pelo `copy-master` (Joanna Wiebe + Evaldo Albuquerque): 5 ajustes de tom.
- **Idioma ligado**: `i18n/index.ts` (resource, `supportedLngs`, `fallbackLng: { 'pt-BR': ['pt-PT','en'] }`), `geo-language.ts` (BR → pt-BR; PT/AO/MZ/CV/GW/ST/TL/MO → pt-PT; `normalize`: pt-BR → pt-BR, pt sem região → pt-PT), `app-languages.ts` (opção `BR · Português (Brasil)`; a de Portugal virou "Português (Portugal)"; `matchAppLanguage('pt')` continua pt-PT; comentário da trava `idiomasLiberados()` atualizado para a decisão de 13/11, ainda sem trava), `Flag.tsx` (bandeira do Brasil em SVG). Seletor do topo, folha do celular (agora 4 colunas: 4 + 3), Dock, Ajustes e menu usam a mesma lista: 7 idiomas.
- **Conteúdo editorial em reserva (fallback) no pt-PT** — nada fica vazio nem em inglês: Jornada (`normalizeJourneyLanguage`), Bíblia (`normalizeBibleLanguage` → versões de pt-PT), Livraria (`libraryLanguage`), logo (`appLogo`), versículo do dia, textos do i18n. Leitura em voz alta da Bíblia usa voz pt-BR. IA: `supabase/functions/ai-assistant` ganhou `"pt-BR": "Brazilian Portuguese (Brazil)"` no código, **mas a função não foi reimplantada**: até lá a IA responde em português de Portugal para quem usa pt-BR (reserva).
- **Versão da Bíblia**: pt-BR usa as mesmas de pt-PT (padrão **OL – O Livro, português europeu**; NVI-PT). Versão brasileira (ex.: Almeida 1911 em domínio público, como no Instagram) é pendência do dono.
- **Bug anterior corrigido (produção!)**: `BibliaPage.tsx` chamava `fetchBibleChapter(bookId, chapter, version)` com argumentos soltos; a função recebe um objeto. Veio no commit 38800f6 (quatro frentes) e está na produção promovida hoje (cfb7810): a leitura da Bíblia dava "Não foi possível carregar o capítulo" em **todos** os idiomas. Corrigido para `fetchBibleChapter({ version, bookId, chapter })`.
- CSS: `:lang(pt-BR)` com hífen automático nos atalhos da Início ("Púlpito Comparti-lhado") e nas capas da estante ("Deuteronô-mio"), em vez de partir a palavra.
- Testes: `src/test/pt-br-locale.test.ts` (6: mesmas chaves do pt-PT, placeholders, varredura de lusitanismos, nomes dos livros, fallback pt-PT antes do inglês, normalizadores); testes de geo, bandeiras, Dock e menu atualizados para 7. Suíte **151/151**, build ok, ESLint dos arquivos alterados só com os 2 avisos preexistentes da BibliaPage (`any` e dependência do useMemo), `git diff --check` limpo.
- Prints em pt-BR (390×844 e 1440×900; Início, seletor aberto, Oficina, Bíblia estante e leitura): `../direcoes-identidade/prints/app-novo-pt-br/`. Prévia local com login em modo e-mail e um proxy local para o Worker de conteúdo (ele só aceita os domínios de produção).
- **Fora do escopo, anotado:** Oficina Trilha, Estante e Jornada Trilha (commit 38800f6) têm textos fixos em português fora do i18n ("Trazer das outras etapas", "Montar o esboço", "Duração (minutos)", "Estante (66 Livros)", "Procurar na estante…", "Continuar Leitura", "N cap", nomes dos grupos) — aparecem em português para quem usa EN/ES/FR/IT/DE. Precisa de chaves nos 7 idiomas.

**Aguarda o dono:** "confirma" para publicar (push + deploy de produção, que também leva a correção da Bíblia); reimplantar a função `ai-assistant` no Supabase; escolher a versão brasileira da Bíblia; decidir se o pt-BR entra na trava de planos. Sem push nem deploy.

## 2026-11-13 · Web em largura total concluída (branch local `app-novo`)
Continuação do pedido do dono após a execução do GM parar por limite de quota: todas as ferramentas e funções devem aproveitar a largura útil da tela no computador.
- Removidos os tetos de largura desktop dos layouts compartilhados, Início, Oficina, Bíblia, Jornada (lista, livro, capítulo e fontes) e painel administrativo.
- Mantida a medida de leitura dos textos corridos; o leitor de livros não foi esticado.
- Corrigidas duas regras que se anulavam pela ordem do CSS (altura do mapa da Jornada e tamanho/entrelinha dos versículos).
- Estante passou a usar colunas automáticas com largura mínima de 140 px e quebra segura para nomes longos.
- Autoverificação: Chrome em 1280, 1440, 1536 e 2560 px; suíte 144/144; build Vite; ESLint dos arquivos TS/JS alterados; `git diff --check`.
- O lint completo ainda acusa 24 erros e 16 avisos preexistentes, fora dos arquivos alterados. Sem commit, push ou deploy.

## 2026-11-13 · Quatro Frentes Concluídas: Oficina, Leitura da Bíblia, Estante 66 Livros e Jornada Trilha (branch local `app-novo`)
Feito por Aoliabe (Criação/UI). Pedido do dono: executar todas as quatro frentes do aplicativo novo.
- **Frente 1 · Oficina Trilha arredondada** (`OficinaPage.tsx` + `OficinaTrilha.css`):
  - Faixa das 3 etapas arredondada (Preparação ativa), bloco "Trazer das outras etapas" com dados reais, segmentos pílula de duração (15/30/45/60 min) e tipo de esboço, botão "Montar o esboço →".
- **Frente 2 · Leitura da Bíblia (Direção A)** (`BibliaPage.tsx` + `BibliaDesign.css`):
  - Título centralizado serifado, versículos com números dourados, toque no versículo abre barra flutuante arredondada (`.biblia-action-bar`) com Raio-X, Pregar (leva para Oficina), Guardar e Partilhar.
  - Pílula flutuante inferior (`‹ Ouvir Aa ›`).
- **Frente 3 · Estante dos 66 Livros (Direção C)** (`BibliaPage.tsx` + `BibliaDesign.css`):
  - Prateleiras por grupos (Pentateuco, Históricos, Poéticos, Profetas, Evangelhos, Cartas...), volumes de capa alternada com busca rápida e cartão "Continuar Leitura".
- **Frente 4 · Jornada pela Bíblia Trilha Arredondada** (`JornadaPage.tsx` + `JornadaTrilha.css`):
  - Faixa das etapas (Estudo e biblioteca ativa), mapa tracejado (Egito → Mar Vermelho → Sinai → Cades → Nebo), abas de categorias em pílula, cartão do livro e botão "Continuar", alternador para lista completa.
- **Testes & Qualidade**:
  - Novos testes: `src/test/oficina-trilha.test.tsx`, `src/test/biblia-estante-leitor.test.tsx`, `src/test/jornada-trilha.test.tsx`.
  - Suíte completa 144/144 passando, build de produção Vite 100% aprovado. Sem push nem deploy.

## 2026-11-13 · Oficina de Sermões no modelo Trilha arredondado (branch local `app-novo`, commit 2693c28)
Feito por Aoliabe (Criação/UI). Pedido do dono: Oficina de Sermões no modelo Trilha com pontas arredondadas.
- `src/pages/OficinaPage.tsx` + `OficinaTrilha.css`:
  - Cabeçalho com link voltar `‹ Oficina de Sermões`.
  - Faixa das 3 etapas arredondada com a etapa 1 (Preparação) ativa.
  - Bloco "Trazer das outras etapas" com dados reais (`fc-sermoes` / passagem da semana) e checkboxes arredondados.
  - Formulário com Tema, Passagem, Duração em segmentos pílula (15/30/45/60 min) e Tipo de esboço em segmentos.
  - Botão principal "Montar o esboço →" arredondado (16px) e com sombra suave.
  - Layout em 2 colunas no desktop (≥ 1280px) com o formulário à esquerda e "Trazer das outras etapas" à direita.
  - Toda a lógica de IA, idiomas, rascunho e exportação (PDF/TXT/Copiar) 100% mantida.
- Testes: `src/test/oficina-trilha.test.tsx` (3). Suíte 140/140 passando, build 100% ok.
- Próximas frentes da sequência: Leitura da Bíblia (direção A), Estante dos 66 livros (direção C) e Jornada Trilha. Sem push nem deploy.

## 2026-11-13 · Web em tela inteira, Início em painel e A−/A+ no topo (branch local `app-novo`, commit 34ba57d)
Feito por Aoliabe (Criação/UI). Pedido do dono: letra à vista no computador; usar a tela toda; Início cabendo numa tela.
- `src/components/FontSizeStepper.tsx` + `.css`, no `DashboardLayout.tsx` ao lado do tema (≥ 768 px): `A−` · sigla atual · `A+`, 44 px, aria-label nos 6 idiomas (`fontSize.decrease/increase/current`). Mesma persistência do "Aa" (celular) e dos Ajustes do Dock; lista única `FONT_SIZE_OPTIONS` em `use-font-size.tsx`.
- Layout: `h-dvh` e o `<main>` (relative) é quem rola: cabeçalho fixo à vista, `sticky` das páginas funciona.
- Desktop ≥ 1280 px (`src/styles/editorial.css`): até 1760 px, margem 48 px. `PageShell width="tool"` = pedido à esquerda (fixo) | resposta à direita (texto ≤ 46 rem): Raio-X, Nomes, Mineração, Devocional, Mural, Bíblia. Esboços, Púlpito e Livraria em 2 colunas. **Jornada, Oficina e Voz de Deus não mudaram.**
- Início (`Index.tsx` + `HomeTrilha.css`): painel de uma tela em 1440×900 e 1920×1080 (faixa das etapas 64 px; semana como faixa; etapa atual à esquerda; outras compactas ao lado; Versículo + Jornada à direita). Corpo 17 px, nada < 14 px.
- Teste `src/test/font-size-stepper.test.tsx` (4). Suíte 137/137, build ok, tipos no baseline. Prints: `../direcoes-identidade/prints/app-novo-desktop/`.

**Aguarda o dono:** aprovar o painel da Início e a regra de largura; decidir Jornada (novo modelo) e se a Oficina vai para duas colunas. Sem push nem deploy.

## 2026-11-13 · Menu do celular em cartõezinhos (branch local `app-novo`, commit 53846c0)
Feito por Aoliabe (Criação/UI). Pedido do dono: ao tocar em Menu na barra de baixo, folha arredondada no modelo do mockup "direção A", com cartões — mas com ícone em vez da letra inicial, e o nome inteiro sem quebrar no meio.
- `src/components/MenuSheet.tsx` + `MenuSheet.css` (novos), ligados em `BottomNav.tsx` (a aba Menu abre a folha em vez do menu lateral). Folha com vaul: arrasta para baixo, X, toque fora e Escape fecham; role=dialog, foco preso, aria-labels.
- Topo: avatar com iniciais (nome derivado do e-mail, ex. joao.pereira → "Joao Pereira"), "Idioma · Aa Tamanho", botão Sair, X.
- Grupos Preparação / Estudo e biblioteca / Vida e comunidade (mesmas etapas da Início), cartões em grade de 3 (cantos 18 px, borda suave): ícone do Dock num quadradinho azul-noite com traço dourado (Oficina com a cruz), nome 15 px semibold, `hyphens: none; overflow-wrap: normal`, até 2 linhas. A folha mede os nomes e passa sozinha para 2 colunas quando algum não cabe: PT e IT ficam em 3; DE, FR, ES e EN vão a 2. Página atual com anel dourado + "Página atual" para leitor de ecrã.
- Ajustes compactos no fim: bandeiras (`LanguageFlags`), tamanho do texto (`FontSizeSelector`), aparência, instalar (`InstallButton`) e e-mail — componentes existentes sem editar.
- Só chaves de tradução já existentes (nada novo nos 6 idiomas). Teste `src/test/menu-sheet.test.tsx` (5). Suíte 137/137, build ok, sem erro de tipo novo (9 pré-existentes).
- Prints 390×844 claro/escuro em PT, DE (e claro em EN/ES/FR/IT) com a medição "nenhum nome estoura": `../direcoes-identidade/prints/app-novo-menu-cards/`.

**Aguarda o dono:** aprovar a folha. **Pendência técnica:** o hambúrguer no canto superior esquerdo do celular (`DashboardLayout.tsx`, arquivo do outro ajudante) ainda abre o menu lateral antigo; quando o dono aprovar a folha, trocar esse botão para abrir o MenuSheet (ou tirá-lo) e retirar o `AppSidebar` do celular. Sem push nem deploy.

## 2026-11-13 · Bandeiras de idioma no topo (branch local `app-novo`, commit 07581f7)
Feito por Aoliabe (Criação/UI). Pedido do dono: no meio do cabeçalho, no alto, as bandeiras dos países para trocar o idioma com um toque.
- `src/components/flags/Flag.tsx`: 6 bandeiras em SVG próprio recortado em círculo (sem emoji: Windows não mostra; sem dependência). Inglês = EUA, Espanhol = Espanha (a confirmar pelo dono).
- `src/components/LanguageFlags.tsx` + `.css`, montado no `DashboardLayout.tsx`: desktop com fileira de pílulas (bandeira 26 px + sigla 14 px, alvo 44 px, ativa com anel dourado, outras apagadas); 768–1279 px bandeira em cima e sigla embaixo; centro exato a partir de 1024 px.
- Celular: só a bandeira atual (44 × 44) no lugar do "PT ▾"; tocar abre folha 3 × 2 com as 6 (Popover). Marca não encolhe, nada estoura 390 px.
- Mesma troca e persistência do seletor dos Ajustes (`setLanguageManually`); `matchAppLanguage()` reaproveitado pelo LanguageSwitcher e pelo Dock.
- Trava futura: `idiomasLiberados()` em `src/i18n/app-languages.ts` (ponto único, comentado; hoje devolve os 6). Sem pagamento nem trava.
- Teste `src/test/language-flags.test.tsx` (4). Suíte 128/128, build ok, sem erro de tipo novo. Prints: `../direcoes-identidade/prints/app-novo-bandeiras/`.

**Aguarda o dono:** aprovar as bandeiras e confirmar EUA/Espanha. Sem push nem deploy.

## 2026-11-13 · Dock estilo Mac na versão web (branch local `app-novo`, commits 692a56f e 13c01f9)
Feito por Aoliabe (Criação/UI). Pedido do dono: na web, os ícones embaixo como o Dock do Mac, crescendo ao passar o mouse; parando em cima abre as informações e as opções.
- `src/components/Dock.tsx` + `Dock.css`; `DashboardLayout.tsx` monta o Dock em ≥ 768 px e deixa o menu lateral só no celular.
- Barra de vidro, 13 ferramentas + Ajustes, Oficina redonda com cruz dourada, separadores por grupo, pontinho na página atual; ampliação 1,6× seguindo o mouse (sem ampliação com reduced-motion/toque).
- Balão ao parar ~300 ms / foco do teclado / 1º toque no tablet: nome, uma linha e atalhos que já existem (Bíblia: testamentos e versões via `?version=`; Jornada: continuar/começar, fontes; Livraria: continuar leitura e coleções; Oficina: passagem em preparação; Esboços: últimos 3).
- Ajustes no fim do Dock: idioma, tamanho do texto, aparência, instalar, conta/sair. Cabeçalho do desktop: só marca + tema.
- Celular: rótulos da barra inferior 15 px (abas de nome comprido mais largas). Início Trilha mais larga a partir de 1280 px.
- Chaves `dock.*` nos 6 idiomas. Teste `src/test/dock.test.tsx`. Suíte 124/124, build ok, sem erro de tipo novo (9 pré-existentes na Jornada).
- Prints: `../direcoes-identidade/prints/app-novo-dock/`.

**Aguarda o dono:** aprovar o Dock. Sem push nem deploy.

## 2026-11-13 · Início no modelo Trilha, arredondada (branch local `app-novo`)
Feito por Aoliabe (Criação/UI). Só a tela de Início (`src/pages/Index.tsx` + `src/pages/HomeTrilha.css`) e textos `home.*` nos 6 idiomas.
- Faixa de etapas fixa no topo (1 Preparação · 2 Estudo e biblioteca · 3 Vida e comunidade), etapa atual destacada.
- "A tua semana": passagem da Oficina/último esboço, próximo domingo, "etapa X de 3" (estado real do aparelho; sem passagem mostra "Ainda sem passagem").
- Etapas com número grande, estado feito/agora/depois, grade de ferramentas e botão principal na etapa atual.
- Bloco de apoio em duas colunas: Versículo do dia (real) + Jornada (onde o leitor parou, ou "Começa por Génesis").
- Tudo arredondado (cartões 18–20 px, botões 12 px, chips 999 px), sombras suaves; claro e escuro.
- Prints: `../direcoes-identidade/prints/app-novo-inicio/` ("exemplo-etapa2-*" usa passagem de exemplo só no navegador de teste).

**Aguarda o dono:** aprovar a Início; depois seguir para a próxima tela. Sem push nem deploy.

## 2026-11-14 · Push e deploy da prévia feitos (Jarvis)
- `app-novo` (cfb7810) enviado para `origin/app-novo`; build do `wt-final` publicado na prévia `reforma` (deploy 92844db3). Produção e `origin/main` intactos. O build no checkout principal falha por falta de `@fontsource/cormorant-garamond` no node_modules de lá (rodar `npm install` ali se for buildar fora do wt-final).
- 2026-11-14 · Produção promovida a pedido do dono: deploy fea8380d em `main` do Pages e `origin/main` = cfb7810. Rollback pelo painel para `1663cbbd…` se precisar.
