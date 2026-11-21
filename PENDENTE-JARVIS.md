# Pendente para o Jarvis — App FC (wt-oficina, branch `oficina-pdf`)

## 2026-11-20 · Oficina: PDF com a marca, edição por partes e cópia de segurança
Feito por **Aoliabe** (Criação, chefe Bezalel). Worktree `wt-oficina`, branch `oficina-pdf` criada do `app-novo` 0d08bb4 (= produção). Commit local `07d95fc`. **Sem push, sem deploy, sem merge.** A `wt-final` (Noé, Jornada) não foi tocada.

**1 · PDF com a marca (Oficina e Meus Esboços)**
- Gerado no próprio aparelho com `pdf-lib` + `@pdf-lib/fontkit` (carregados só quando a folha abre; pedaço `sermon-pdf-*.js` de ~514 KB gzip, fora do pacote principal). Texto de verdade, A4, fontes do app (Source Serif 4, Cormorant Garamond, Cinzel) em `.woff` (o fontkit falha ao recortar `.woff2`).
- **Entrega:** celular (tela de toque) → folha de compartilhar com o arquivo (Salvar em Arquivos, WhatsApp, Imprimir); computador ou sem compartilhar → download direto. Se a geração falhar (ex.: fontes sem rede na 1ª vez), cai na impressão do navegador como antes. Escolhi gerar o arquivo (não `@media print`) porque no iPhone, principalmente no app instalado, a janela de impressão não salva PDF de forma confiável. As fontes `.woff` entram no cache do PWA no 1º uso (offline depois).
- **3 direções** em `src/lib/pdf/pdf-temas.ts` (cores = tokens do tema claro): A clássica dourada (padrão até o dono escolher), B editorial limpa (menos tinta), C pergaminho. Moldura com cantos ornamentados, capitular, medalhões I/II/III, fleurons, caixa de versículo com fio dourado e referência em versalete (Source Serif: na Cinzel o "1" parece "I"), marca-d'água suave do logo, cabeçalho compacto nas páginas seguintes, rodapé com o nome do app e "n / total". Corpo 12,5 pt, nada < 10,5 pt, contraste ≥ 7:1 (testado).
- **Logo:** o do app (`appLogo(idioma)`, sem fundo, reduzido para 320 px). Não gerei a opção com o símbolo do Instagram: o arquivo só tem 240 px, com fundo creme, e sairia borrado impresso.
- **Prévias:** `Kawai-Jarvis/web/palco/fc-pdf-modelo/index.html` (2 PDFs por direção + PNG das páginas). Regerar: `npx vite-node scripts/pdf-modelo/gerar.ts -- <pasta>` (precisa do `pdftoppm`).

**2 · Edição por partes** (`src/components/oficina/FolhaPartes.tsx`, `src/lib/sermon-parts.ts`)
- Na folha, cada parte tem "Editar esta parte" (campos no lugar: título do tópico, texto, versículos) e "＋ Anotação". "Editar texto" (texto corrido) continua; "← Editar na folha" lê o texto de volta em partes sem perder nada. Anotações ficam no texto corrido como `✎ …` (TXT, copiar, busca).
- Meus Esboços grava `partes` (com anotações) e `atualizadoEm`; "Continuar na Oficina" abre na folha quando o esboço tem estrutura (texto livre antigo continua no modo texto).

**3 · Cópia de segurança** (Meus Esboços)
- "Fazer cópia de segurança" baixa `esbocos-AAAA-MM-DD.json` (todos os esboços com partes e anotações); "Restaurar cópia" junta sem duplicar (identificador = data de criação; se existe nos dois, fica a versão gravada por último). `navigator.storage.persist()` ao abrir Meus Esboços e ao salvar/restaurar. Texto explicando que os esboços ficam no aparelho.

**Testado de verdade** (vite local + Chrome headless, conta `ferramentasdocristaoo@gmail.com`, pt-BR): computador 1440×900 (anotação, edição de tópico, PDF baixado em 0,4 s com a anotação e a edição dentro, salvar, cópia baixada, restaurar = 1 item, PDF de Meus Esboços) e celular 390×844 com toque (folha de compartilhar recebeu o PDF de 222 KB 0,35 s após o toque). **Não testado em iPhone/Android físicos**: vale o dono abrir um PDF no celular antes de publicar.
**Qualidade:** `npm test` **263/263** (238 + 25 novos), `npm run build` ok, ESLint dos arquivos alterados limpo, `tsc` só com os 10 erros que já existiam.

**Depende do dono**
1. **Escolher a direção do PDF** (A, B ou C, ou mistura) no palco. Trocar o padrão = 1 linha (`TEMA_PDF_PADRAO` em `pdf-temas.ts`).
2. Merge de `oficina-pdf` no `app-novo` + push + deploy (o Jarvis faz depois do ok). Não há SQL nem função do Supabase nesta entrega.
3. Teste num iPhone e num Android de verdade (compartilhar → Salvar em Arquivos / Imprimir).
4. Se quiser o símbolo do Instagram no PDF: arquivo original em alta do designer.
5. Ideia anotada: opção "economizar tinta" (papel branco, sem textura) para quem imprime em casa; a B já é a mais econômica.

---

# Histórico herdado do `app-novo` (wt-final)

## 2026-11-21 · Bíblia offline por versão (Noé, Tecnologia)
Branch **`biblia-offline`** (worktree `wt-offline`, a partir do `icone-azul` 51cdf94), commits `65ee1b2` + `c2f6c7b`. **Sem push, sem deploy, sem SQL, sem secret.** Nada novo no servidor: o arquivo da Bíblia vem direto do bolls.life (CORS liberado), sem proxy nosso.

**Como funciona**
- Na leitura, o botão da versão (ex.: "ARA ▾") abre a **lista de versões**. Tocar numa versão troca a leitura **e já guarda a versão inteira no celular** (sem botão "baixar"). Abrir a leitura também guarda sozinha a versão que está sendo lida.
- Na linha da versão: "Baixando… 45%" com barrinha, depois **"No celular ✓ · 5,0 MB"**; lixeira para **tirar do celular** (com confirmação) e total no rodapé ("2 versões no celular · 10,4 MB"). A leitura começa na hora pela internet enquanto baixa.
- Leitura **primeiro do aparelho** (IndexedDB `fc-biblia-offline`), só vai à internet se a versão não estiver guardada. Mesmo texto limpo de hoje (`cleanBibleText`). O versículo do dia também passa a ler do aparelho.
- **Sem internet:** versão guardada abre normal (até recarregando o app: o service worker continua igual). Versão não guardada: aviso "Você está sem internet… ainda não está salva no celular" com botões "Ler na NAA" etc.
- O app agora **lembra a última versão escolhida** por idioma (antes voltava sempre na padrão).
- Pede `navigator.storage.persist()` no primeiro download. Versão que a pessoa tirou **não volta sozinha** (só tocando nela); com "economia de dados" ligada só baixa com toque. Gratuito: sem cobrança nem propaganda.
- Textos nos 7 idiomas. Lista de versões **não mudou**.

**Quanto ocupa (medido nos arquivos reais do bolls.life, 21/11)** — download (ZIP) / espaço no celular:
- pt-BR: ACF 1,6/5,3 · ARA 1,6/5,0 · ARC 2,1/5,1 · AS21 1,6/5,0 · KJA 1,9/5,7 · NAA 1,9/5,4 · NBV 1,9/5,6 · NTLH 1,7/5,4 · NVT 1,8/5,2 · TB 2,3/5,0 · VFL 1,8/5,4 · MENS 1,7/4,8 · CNBB 1,7/4,9 · OL 1,8/5,2 · NTJ (só NT) 0,4/1,2 MB
- en: KJV 2,6/9,4 · NKJV 2,4/5,3 · ESV 2,4/5,1 · NLT 1,8/5,2 · WEB 1,9/5,1 · ASV 2,2/9,0 · YLT 1,6/5,2 · MSG 1,8/5,1
- es: RVR60 1,7/5,1 · RVG 1,6/5,0 · BTX3 1,9/5,0 · NTV 1,9/5,5 · PDT 1,9/5,4 · LBLA 2,0/5,4
- fr: LSG 1,7/5,4 · NBS 4,5/5,4 · PDV 2,0/5,7 · BDS 2,3/5,9 · DBY 1,7/5,4 · it: NR06 1,7/5,2 · de: LUT 1,7/5,2 · SCH2000 2,0/5,5 · HFA 2,0/5,7 · ELB 1,8/5,8
- (KJV e ASV ocupam mais porque o texto traz marcações de Strong, que o app já esconde.) Com 2 versões + o app, o Chrome mediu ~28 MB de uso total.

**Qualidade:** `npm test` **342/342** (+18 da Bíblia offline: ZIP, montagem, fila, remoção, rede parada, banco que não abre, leitura do aparelho, tela sem internet e lista). `npm run build` ok, `tsc` só com os 10 erros antigos. Chrome real (`scripts/teste-biblia-offline.mjs`, Supabase simulado, texto e ZIP reais do bolls.life): **24 conferências** em 390×844 e 1440×900 — progresso na linha, ARA guardada sozinha, NAA ao tocar, sem internet João 4 do aparelho sem pedir à rede, **recarregar o app sem internet abre a Bíblia**, trocar de versão sem internet, aviso da versão não guardada, remover, nenhum texto < 14 px nem toque < 48 px, nenhum erro de página. Prints: `direcoes-identidade/prints/biblia-offline/` (14). Revisado pelo **code-reviewer**; achados corrigidos (conexão do IndexedDB perdida no iOS, download parado, remoção que se desfazia, memória no iPhone, erro de cota, foco/leitor de tela).

**Não testado:** iPhone de verdade (Safari 16.4+ necessário para descompactar; iPhone mais antigo continua lendo pela internet, sem quebrar) e memória num iPhone antigo com a versão maior.

**Decisões / pendências do dono**
1. **NVI fora do ar no bolls.life (já hoje, em produção):** as versões **NVI pt-BR/pt-PT (NVIPT), NIV inglês (NIV2011) e NVI espanhol (NVI)** não trazem mais o texto bíblico — em todos os versículos vem um aviso do bolls.life dizendo que a Biblica proibiu o uso. Quem escolhe NVI no app hoje lê esse aviso. No offline elas ficam marcadas "Só com internet" (não baixamos 50 MB de aviso). **Decidir: tirar essas 3 da lista** (pedido dizia não mexer na lista, então não tirei) ou trocar por outra fonte licenciada.
2. **Direitos autorais (uso offline):** o texto vem do bolls.life, que distribui versões com direitos de editoras. **Domínio público** (sem problema guardar no aparelho): KJV, ASV, YLT, WEB, Luther 1912, Louis Segond 1910, Darby, TB 1917, ARC 1909 (com ressalvas de edição). **Com direitos** (ARA, NAA, ACF, AS21, KJA, NBV, NTLH, NVT, VFL, A Mensagem, CNBB, O Livro, NTJ, NKJV, ESV, NLT, MSG, RVR60, RVG, BTX3, NTV, PDT, LBLA, NBS, PDV, BDS, NR06, Schlachter 2000, HFA, Elberfelder): o app já exibe essas versões online pelo bolls.life sem licença própria; guardar a versão inteira no aparelho é uma cópia completa e aumenta a exposição. Recomendo o dono decidir se libera o offline só para as de domínio público (1 linha no código: lista `ONLINE_ONLY_VERSIONS`) ou para todas, e, idealmente, buscar licença (SBB para ARA/NAA/NTLH etc.).
3. Se quiser não depender do bolls.life para o arquivo, dá para servir o ZIP pelo nosso Worker (`VITE_BIBLE_OFFLINE_BASE`, já previsto no código; precisa de rota nova e deploy).
4. Publicar: merge de `biblia-offline` (junto com `icone-azul`/`admin-push`), push e deploy só com o ok do dono. Não precisa de SQL nem secret.

---

## 2026-11-21 · Admin novo no padrão do app (Aoliabe, Criação)
Branch **`admin-push`**, commits `089a954` + `a256fbe` + `9957b44`. **Sem push, sem deploy, sem SQL, sem secret, nenhuma notificação enviada.** Só a apresentação mudou: login antigo, sessão, RPCs e o fluxo de envio/tradução continuam iguais.

**Direções:** 2 rápidas (`direcoes-identidade/prints/admin-novo/direcoes/`, 390×844 e 1440×900): A "livro-razão" (filetes, sem cartões) e **B "cartões do app" (escolhida)**: mesma linguagem do Início, do menu em cartõezinhos e da barra inferior do app; é o que o dono já reconhece como "o app novo". Dá para trocar.

**O que ficou**
- **Celular (PWA):** cabeçalho com a logo discreta + "Painel", tema claro/escuro e **"App" (voltar) sempre à vista**; **barra inferior igual à do app** (Início, Pessoas, Avisos, Jornada, Mais) e folha **"Mais"** em cartõezinhos (Análises, Livraria, Esboços, Cache da IA, Voltar ao app, tema, trocar senha/sair).
- **Computador:** lateral azul-noite (nos dois temas) com a marca pequena, grupos Painel / Pessoas / Conteúdo e "Voltar ao app" no rodapé. Marca-d'água do brasão bem suave no fundo.
- **Início do painel:** saudação + data, atalhos **Enviar notificação / Buscar assinante (já abre com o cursor na busca) / Jornada**; números-chave: **assinantes ativos por plano** (Brasil, Internacional, lista antiga; vencidos, bloqueados e ativos em 7 dias), **novos acessos em 30 dias** (+ hoje), **aparelhos com notificação**, **IA da Jornada hoje** (x de 40) + economia do cache, **último envio** (somando os idiomas da mesma campanha, com selo se parcial/falhou); ferramentas mais abertas e assinantes mais ativos com período 7/30/90.
- **Tabelas viram cartões no celular** (Assinantes, Livraria, Cache, Análises, histórico das Notificações), com papéis de tabela para leitor de tela. Estados **carregando** (esqueleto no formato do conteúdo) e **vazios** separados (sem dados / busca sem resultado / erro com "Tentar de novo").
- **pt-BR** no painel inteiro (era pt-PT fixo): datas, "Liberar acesso", "Vencido", US$ com vírgula etc. A aba fica no endereço (`/fc-control-panel#notificacoes`): recarregar o PWA volta na mesma aba.
- Legibilidade FC: corpo 17 px, nada < 14 px, toques ≥ 48 px (também nos diálogos), campos em caixa, números em Inter (a Cormorant usa numerais antigos e o "1" parecia "I").

**Qualidade:** `npm test` **324/324** (+3: contas do Início), `npm run build` ok, `tsc` só com os 10 erros antigos. Chrome com Supabase simulado (`scripts/teste-admin-novo.mjs`): **32 telas** (8 abas × 390/1440 × claro/escuro) + 32 com banco vazio (`VAZIO=1`): nenhum texto < 14 px, nenhum toque < 44 px, nada passando da borda; folha Mais, atalho de busca e "Voltar ao app" conferidos. Testes antigos: `teste-admin-push.mjs` **20/20**, `teste-admin-traducao.mjs` **tudo ok** (ajustados só os seletores; o de tradução já estava desatualizado desde `1fdec62`, que tirou o botão "Traduzir para N"). Revisado pelo **ui-designer** e pelo **code-reviewer**; achados corrigidos. Prints finais: `direcoes-identidade/prints/admin-novo/` (82 arquivos: `celular-*`, `*-inteira`, `computador-*`, `vazio-*`, `celular-claro-folha-mais.png`).

**Não testado:** no iPhone de verdade (só Chrome em 390×844) e contra o banco real.

**Decisões / pendências do dono**
1. Aprovar a direção B pelos prints (ou pedir a A).
2. **"Vendas" em reais não aparecem no painel**: o banco do FC não guarda valor de venda (fica no KawaiPay). O cartão mostra "Novos acessos (30 dias)" e avisa isso. Se quiser vendas no painel, precisa decidir de onde ler (API do KawaiPay ou gravar o valor no webhook).
3. **Assinantes por plano** são contados no navegador lendo a lista pela RPC que já existe (de 1000 em 1000, guardado 5 min). Funciona bem até alguns milhares; acima disso (ou se a lista mudar no meio da leitura) o cartão mostra "≈". O certo, mais adiante, é uma RPC só de contagem (SQL novo, precisa do "confirma").
4. "Custo de IA" exato não existe no banco: o painel mostra a cota da Jornada no dia (o dia vira às 21h de Brasília, porque o servidor conta em UTC) e a economia estimada do cache.
5. Publicar junto com o resto do `admin-push` (merge, push e deploy só com o ok do dono).

---
## 2026-11-21 · Notificação escrita em português e traduzida na hora (painel → Notificações)
Feito por **Noé** (Tecnologia), com revisão do code-reviewer, **em cima** do trabalho de Admin + push abaixo (mesmo branch **`admin-push`**). Commits `de979cc` + `fc86ec3`. **Sem push, sem deploy, sem secret, sem SQL, nenhuma notificação enviada.**

**Como funciona agora**
- O dono escreve **título e texto em português** → marca os **idiomas de saída** (pt-BR, pt-PT, en, es, fr, it, de; pt-BR vem marcado) → **Traduzir** → aparecem as versões de cada idioma em campos **editáveis**, com a prévia iPhone/Android **por idioma** (botões pt-BR / pt-PT / en…).
- No envio, **um envio por idioma** (uma linha por idioma no histórico), cada um só para quem usa o app naquele idioma, com a mesma confirmação "Tem certeza? Vai para N pessoas" (agora com a lista por idioma e o título de cada um) e os mesmos limites do push-send.
- Idioma não marcado **não recebe**, a menos que o dono marque **"Enviar em português para quem usa os outros idiomas"** (desmarcado por padrão).
- **pt-BR sai exatamente como foi escrito** (nunca passa pelo modelo). pt-PT é adaptação leve (tu, ortografia de Portugal).
- Tradução falhou → erro claro, campos vazios para escrever à mão; **não envia** enquanto algum idioma marcado estiver sem título/texto. Mudou o português depois de traduzir → pede para traduzir de novo (ou "As versões continuam certas").
- Teste por e-mail: escolhe qual versão vai no teste.
- Se o envio parar no meio (ex.: público mudou num idioma), confirmar de novo manda **só os idiomas que faltaram** (mesma chave de idempotência; achado da revisão).

**Tradução (servidor):** ação `traduzir` dentro da função `push-send` (mesma checagem de admin; a chave nunca vai ao navegador). Modelo **`claude-haiku-5-5`**, **uma chamada** para todos os idiomas, resposta em JSON Schema `{idioma: {titulo, texto}}`, effort baixo, prompt com nomes bíblicos na forma de cada idioma, emojis/links mantidos, limites 60/180 e um **glossário dos nomes das seções do app** tirado das traduções do próprio app (Jornada → Journey / Voyage / Viaggio / Reise…). **Cache:** mesmo texto + mesmos idiomas sai do `ai_cache` (action `push-traducao`, chave SHA-256, 30 dias) e do cache da tela; não paga de novo. Lógica pura em `supabase/functions/push-send/traducao.ts`; plano de envio em `src/components/admin/notificacoes-idiomas.ts`.

**Custo estimado (medido no teste real, 6 idiomas):** ~1.300–1.500 tokens de entrada e ~520–560 de saída por tradução → **≈ US$ 0,0004 por notificação** (Haiku 5.5: US$ 0,10/M entrada, US$ 0,50/M saída), ou seja ≈ US$ 0,45 a cada 1.000 notificações traduzidas. Repetir o mesmo texto custa zero (cache).

**Qualidade:** `npm test` **319/319** (eram 299: +14 de unidade, sobre parse, limites, glossário, público "outros" e plano por idioma; +6 da tela). `npm run build` ok, `tsc` só com os 10 erros antigos, `deno check` da push-send ok. Chrome (`scripts/teste-admin-traducao.mjs`, Supabase simulado): **12 conferências** em 390×844 e 1440×900 (traduzir, uma chamada só, versões editáveis, prévia por idioma, contagem 41 em 7 idiomas, nenhum texto < 14 px, toques de 48 px, 7 envios um por idioma com pt-BR intacto e a correção do dono no inglês). O teste Chrome do Admin/push continua **20/20** (só o texto esperado da contagem mudou). **Teste real da tradução** com a chave do cofre (lida do Keychain, nunca impressa): 2 rodadas, HTTP 200 em 3–4 s, 6 idiomas válidos ("Já podes seguir… Toca para abrir", "Rut llegó a la Jornada", "Voyage" em francês como no app). Prints: `wt-final/prints/admin-traducao/` (8; a pasta `prints/` está no `.gitignore`).

**Não testado:** a função publicada no Supabase (a ação `traduzir` foi testada pela mesma lógica chamando a API direto, não via Supabase local).

### Passo a passo do dono (junto com os passos do Admin/push abaixo, cada um com "confirma")
1. **Chave da Anthropic na função.** A `ai-assistant` já usa o secret `ANTHROPIC_API_KEY`, e os secrets do Supabase valem para todas as funções do projeto, então ele talvez já exista. Conferir só os nomes: `supabase secrets list --project-ref rwyyggtsjbwnwzsnlkgy`. Se não existir (ou se o dono quiser usar a chave `fc/anthropic/api-key` do cofre), mandar do Keychain sem aparecer na tela (rodar no Terminal):
   ```sh
   supabase secrets set --project-ref rwyyggtsjbwnwzsnlkgy --env-file <(printf 'ANTHROPIC_API_KEY=%s\n' "$(~/.local/share/kawai/bin/kawai-keys get fc/anthropic/api-key)")
   ```
   Atenção: isso troca a chave da `ai-assistant` também (mesmo nome de secret).
2. **Deploy da `push-send`** (o mesmo do passo 5 abaixo; já leva a tradução): `supabase functions deploy push-send --project-ref rwyyggtsjbwnwzsnlkgy`.
3. Merge, push e deploy do app como no passo 6 abaixo.
4. Primeiro teste: público "Só um e-mail (teste)", escrever em português, marcar Inglês, Traduzir, escolher "Versão do teste: Inglês" e enviar para o próprio iPhone.

**Decisão do dono / riscos:**
- Quem tem aparelhos em dois idiomas diferentes recebe uma notificação em cada idioma (e conta duas vezes no total). Isso segue a regra "idioma do app".
- **SQL sugerido (segurança, anterior a este trabalho):** a tabela `ai_cache` tem política de leitura e inserção para o papel público (migração `20260323220810`). As funções usam service role, então dá para fechar: `DROP POLICY "Anyone can read ai_cache" ON public.ai_cache; DROP POLICY "Service role can insert ai_cache" ON public.ai_cache;`. **Conferir antes** se o app lê o `ai_cache` direto do navegador (não achei leitura no `src/`, mas não rodei nada no banco). A tradução já se protege: chave em hash e resposta do cache conferida de novo.
- A regra "não enviar sem tradução" fica na tela; a ação `enviar` aceita qualquer texto vindo de um admin (aceitável).

---

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
