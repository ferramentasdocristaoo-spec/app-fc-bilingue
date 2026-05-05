// Custo médio estimado por chamada (USD) com gpt-4o-mini
// Baseado em tamanho típico de prompt + resposta de cada ação
// Fórmula: (input_tokens × $0.15/1M) + (output_tokens × $0.60/1M)
export const ACTION_COST: Record<string, number> = {
  "gerar-esboco": 0.0042, // prompt grande + resposta longa estruturada (~3k+5k tokens)
  "raio-x": 0.0018,        // prompt médio + análise de versículo (~1.5k+2k tokens)
  "devocional": 0.0014,    // devocional curto (~1k+1.5k tokens)
  "garimpo": 0.0009,       // promessa curta (~600+1k tokens)
  "nomes": 0.0006,         // significado de nome (~400+700 tokens)
};

export const DEFAULT_COST = 0.0010;

export const ACTION_LABEL: Record<string, string> = {
  "gerar-esboco": "Esboço de Sermão",
  "raio-x": "Raio-X de Versículo",
  "devocional": "Devocional Diário",
  "garimpo": "Garimpo de Promessas",
  "nomes": "Significado de Nomes",
};

export const costFor = (action: string) => ACTION_COST[action] ?? DEFAULT_COST;
export const labelFor = (action: string) => ACTION_LABEL[action] ?? action;
