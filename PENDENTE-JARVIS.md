# Pendente para o Jarvis — App bilíngue (wt-brasil, branch `brasil-cache`)

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
- Testes: `ai-cache-shared.test.ts` (16: chave igual à fórmula do FC Brasil para os 5 payloads, ordem das chaves, pt-BR em 3 grafias, reserva em erro/timeout/ausência, gravação parcial). `deno check` da função ok.

**Qualidade:** suíte **174/174** (151 + 7 + 16), `npm run build` ok, ESLint dos arquivos alterados limpo (restam só os preexistentes: 2 na `BibliaPage.tsx` e 4 `any` na `index.ts` da função), `git diff --check` limpo.

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
4. **Aviso de merge:** o `wt-final` do Jafé tem `src/pages/BibliaPage.tsx` e `src/test/biblia-estante-leitor.test.tsx` modificados sem commit; minha mudança na `BibliaPage.tsx` é só 1 linha de comentário (l. 136). A `index.ts` da função não foi tocada pelo Jafé (ele mexeu em `purchase-webhook`).

**Ideia futura registrada (não implementar agora):** ligação de bancos mais ampla entre bilíngue e FC Brasil; o FC Brasil continua rodando para os clientes vitalícios e, com o cache grande, pode rodar só do cache sem custo de IA.

---

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
