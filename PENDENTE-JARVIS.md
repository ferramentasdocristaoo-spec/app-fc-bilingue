# Pendente para o Jarvis — App bilíngue (wt-final)

## 2026-11-13 · Dock estilo Mac na versão web (branch local `app-novo`, commit 692a56f)
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
