/** Sermões de exemplo para as prévias do PDF (no formato que a Oficina gera, com anotações do pregador). */
import type { DadosPdf } from "../../src/lib/pdf/sermon-pdf";

const rotulos = {
  introducao: "Introdução",
  aplicacao: "Aplicação Prática",
  conclusao: "Conclusão e Apelo",
  anotacao: "Anotação",
  appName: "Ferramentas do Cristão",
};

export const EXEMPLO_CURTO: DadosPdf = {
  titulo: "A fé que atravessa o deserto",
  passagem: "Hebreus 11:1-6",
  data: "20 de novembro de 2026",
  idioma: "pt-BR",
  rotulos,
  partes: [
    {
      id: "intro",
      tipo: "introducao",
      titulo: "",
      texto:
        "Todos nós, em algum momento, atravessamos um deserto. Pode ser uma doença, uma perda, uma porta que se fechou ou uma oração que parece não ter resposta.\nO capítulo 11 de Hebreus foi escrito para cristãos cansados, tentados a voltar atrás. O autor não lhes oferece uma fórmula, mas uma galeria de homens e mulheres que caminharam pela fé quando ainda não viam o fim do caminho.",
      versiculos: [],
      anotacoes: [],
    },
    {
      id: "p1",
      tipo: "ponto",
      titulo: "A fé enxerga o que os olhos ainda não veem",
      texto:
        "A fé não é ausência de dúvida, nem pensamento positivo. É confiança apoiada no caráter de Deus. Quando tudo à nossa volta diz \"não\", a fé lembra o que Deus já disse.",
      versiculos: ["Hebreus 11:1 — Ora, a fé é o firme fundamento das coisas que se esperam e a prova das coisas que se não veem."],
      anotacoes: [],
    },
    {
      id: "p2",
      tipo: "ponto",
      titulo: "A fé obedece antes de entender",
      texto:
        "Abraão saiu sem saber para onde ia. Noé construiu a arca antes da primeira gota de chuva. A obediência é a fé colocada em movimento.",
      versiculos: ["Hebreus 11:8", "Gênesis 12:1-4", "Hebreus 11:7"],
      anotacoes: ["Contar a história da irmã Lurdes, que abriu a casa para o culto sem saber quem viria."],
    },
    {
      id: "p3",
      tipo: "ponto",
      titulo: "A fé agrada a Deus",
      texto: "Sem fé é impossível agradar a Deus. Ele não procura gente perfeita, mas gente que confia e se aproxima.",
      versiculos: ["Hebreus 11:6"],
      anotacoes: [],
    },
    {
      id: "aplicacao",
      tipo: "aplicacao",
      titulo: "",
      texto: "Qual é o seu deserto hoje? Escreva numa folha o passo de obediência que Deus está pedindo a você nesta semana e ore por ele todos os dias.",
      versiculos: [],
      anotacoes: [],
    },
    {
      id: "conclusao",
      tipo: "conclusao",
      titulo: "",
      texto: "O deserto não é o fim da história. Quem caminha com Deus atravessa. Venha à frente quem deseja entregar hoje o seu deserto nas mãos do Senhor.",
      versiculos: [],
      anotacoes: [],
    },
  ],
};

const longoTexto = (s: string, vezes = 2) => Array.from({ length: vezes }, () => s).join("\n");

export const EXEMPLO_LONGO: DadosPdf = {
  titulo: "O Bom Pastor no vale da sombra: confiança, cuidado e esperança no Salmo 23",
  passagem: "Salmo 23:1-6",
  data: "20 de novembro de 2026",
  idioma: "pt-BR",
  rotulos,
  partes: [
    {
      id: "intro",
      tipo: "introducao",
      titulo: "",
      texto: [
        "Poucos textos da Escritura foram lidos em tantos leitos de hospital, velórios e madrugadas de aflição quanto o Salmo 23. Ele nasceu da experiência de um pastor de ovelhas que se tornou rei, e que conheceu tanto os campos verdes quanto as cavernas onde se escondeu dos inimigos.",
        "Davi não escreve sobre um Deus distante, mas sobre um Pastor que caminha à frente, conhece cada ovelha pelo nome e não a abandona quando a trilha desce para o vale. Nesta mensagem, vamos percorrer o salmo verso a verso e descobrir que a presença de Deus não nos poupa de todos os vales, mas nos garante companhia em cada um deles.",
      ].join("\n"),
      versiculos: [],
      anotacoes: ["Abrir lendo o salmo inteiro em voz alta, devagar, com a igreja de pé."],
    },
    {
      id: "p1",
      tipo: "ponto",
      titulo: "O Senhor é o meu pastor: a relação vem antes da provisão",
      texto: longoTexto(
        "Antes de falar do que não lhe falta, Davi diz a quem pertence. A segurança da ovelha não está no pasto, mas no pastor. Quem conhece o Pastor aprende a descansar mesmo quando o pasto ainda não apareceu.",
        3,
      ),
      versiculos: ["Salmo 23:1", "João 10:11", "João 10:14-15"],
      anotacoes: [],
    },
    {
      id: "p2",
      tipo: "ponto",
      titulo: "Pastos verdes e águas tranquilas: o descanso que Deus prepara",
      texto: longoTexto(
        "A ovelha só se deita quando está sem medo, sem fome e sem conflito no rebanho. O Pastor cuida de cada uma dessas coisas. O descanso não é prêmio para quem já resolveu tudo; é presente para quem confia.",
        3,
      ),
      versiculos: ["Salmo 23:2-3", "Mateus 11:28-30"],
      anotacoes: ["Pergunta para a igreja: quando foi a última vez que você descansou de verdade?"],
    },
    {
      id: "p3",
      tipo: "ponto",
      titulo: "O vale da sombra da morte: presença no meio da dor",
      texto: longoTexto(
        "O salmo não promete que não haverá vale. Promete que não andaremos sozinhos nele. Repare que, no vale, Davi deixa de falar sobre Deus e passa a falar com Deus: \"tu estás comigo\". A dor aproxima a conversa.",
        3,
      ),
      versiculos: [
        "Salmo 23:4 — Ainda que eu andasse pelo vale da sombra da morte, não temeria mal algum, porque tu estás comigo; a tua vara e o teu cajado me consolam.",
        "Isaías 43:2",
      ],
      anotacoes: [],
    },
    {
      id: "p4",
      tipo: "ponto",
      titulo: "A mesa diante dos inimigos: honra onde havia ameaça",
      texto: longoTexto(
        "Deus não espera os inimigos irem embora para servir a mesa. Ele prepara o banquete na presença deles. O óleo na cabeça era sinal de hóspede honrado: quem estava em perigo agora está em casa.",
        2,
      ),
      versiculos: ["Salmo 23:5", "Romanos 8:31"],
      anotacoes: [],
    },
    {
      id: "p5",
      tipo: "ponto",
      titulo: "Bondade e misericórdia me seguirão: a esperança que não termina",
      texto: longoTexto(
        "A palavra \"seguirão\" tem o sentido de perseguir. A bondade de Deus corre atrás de nós todos os dias. E o caminho não termina no vale nem na mesa: termina na casa do Senhor, para sempre.",
        2,
      ),
      versiculos: ["Salmo 23:6", "João 14:2-3"],
      anotacoes: ["Ler devagar. Pausa antes de \"para sempre\"."],
    },
    {
      id: "aplicacao",
      tipo: "aplicacao",
      titulo: "",
      texto: [
        "Primeiro, chame Deus de \"meu\" Pastor: a fé é pessoal. Segundo, aceite o descanso que ele oferece nesta semana: separe um tempo sem tela, só com a Palavra. Terceiro, se você está no vale, troque o \"ele\" pelo \"tu\": converse com Deus sobre a sua dor.",
        "Por fim, olhe para quem está no vale ao seu lado. O Pastor também usa as ovelhas para cuidar umas das outras.",
      ].join("\n"),
      versiculos: [],
      anotacoes: ["Entregar o marcador com o Salmo 23 na saída."],
    },
    {
      id: "conclusao",
      tipo: "conclusao",
      titulo: "",
      texto:
        "O Salmo 23 começa com o Pastor e termina na casa do Pastor. Entre um e outro há pastos, águas, vales e mesas, mas a presença é a mesma do começo ao fim. Se você ainda não pertence a esse rebanho, hoje o Bom Pastor chama você pelo nome. Venha.",
      versiculos: [],
      anotacoes: [],
    },
  ],
};
