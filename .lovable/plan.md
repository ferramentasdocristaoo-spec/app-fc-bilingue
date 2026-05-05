

## Problema

A API da Bíblia (`bolls.life`) está funcionando normalmente, mas o navegador provavelmente bloqueia as requisições por CORS (a API não permite chamadas diretas do domínio do preview/publicado).

## Solução

Criar uma Edge Function como proxy para a API `bolls.life`, e atualizar o `BibliaPage` para chamá-la em vez de acessar a API diretamente.

### Passos

1. **Criar Edge Function `bible-proxy`**
   - Recebe `version`, `bookId`, `chapter` como parâmetros de query string
   - Faz fetch para `https://bolls.life/get-text/{version}/{bookId}/{chapter}/`
   - Retorna o JSON com headers CORS adequados

2. **Atualizar `BibliaPage.tsx`**
   - Trocar a URL do fetch de `https://bolls.life/get-text/...` para a Edge Function: `${SUPABASE_URL}/functions/v1/bible-proxy?version=...&bookId=...&chapter=...`

### Detalhes técnicos

- A Edge Function será implantada automaticamente
- Não precisa de autenticação (JWT verify false) pois é apenas um proxy de leitura
- Sem alterações no banco de dados

