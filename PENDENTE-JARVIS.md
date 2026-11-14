# Pendente para o Jarvis — App bilíngue (wt-final)

## 2026-11-13 · Oficina de Sermões no modelo Trilha arredondado (branch local `app-novo`)
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
