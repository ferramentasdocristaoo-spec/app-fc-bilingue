// Escolhe a melhor voz do aparelho para a leitura em voz alta.
// Antes o app pegava a primeira voz do idioma (no iPhone em pt-BR é a Luciana, robótica).
// Agora: voz salva pela pessoa > vozes aprimoradas/naturais > vozes boas conhecidas > idioma exato > idioma parecido.

const CHAVE = "fc-voz-leitura";

// Vozes "de efeito" ou de baixa qualidade do iOS/macOS que nunca devem ser escolhidas sozinhas.
const RUINS = /\b(albert|bad news|bahh|bells|boing|bubbles|cellos|good news|jester|organ|superstar|trinoids|whisper|wobble|zarvox|grandma|grandpa|eddy|flo|reed|rocko|sandy|shelley|junior|ralph|kathy|fred)\b/i;
const BOAS = /(premium|enhanced|aprimorad|natural|neural|siri|google)/i;
// Vozes conhecidas por soarem bem (masculinas primeiro, a pedido do dono).
const PREFERIDAS: Record<string, string[]> = {
  pt: ["felipe", "daniel", "antonio", "joão", "joao", "duarte", "thiago", "catarina", "joana", "francisca"],
  en: ["daniel", "arthur", "aaron", "evan", "nathan", "tom", "alex", "samantha", "karen"],
  es: ["jorge", "diego", "juan", "carlos", "pablo", "mónica", "monica", "paulina"],
  fr: ["thomas", "nicolas", "daniel", "amélie", "amelie"],
  de: ["markus", "yannick", "martin", "anna"],
  it: ["luca", "alice", "federica"],
};
const EVITAR: Record<string, string[]> = { pt: ["luciana"] };

const norm = (l: string) => l.replace("_", "-").toLowerCase();

export function vozesDoIdioma(voices: SpeechSynthesisVoice[], lang: string): SpeechSynthesisVoice[] {
  const base = norm(lang).slice(0, 2);
  return voices.filter((v) => norm(v.lang).startsWith(base));
}

export function escolherVoz(voices: SpeechSynthesisVoice[], lang: string): SpeechSynthesisVoice | undefined {
  const alvo = norm(lang);
  const base = alvo.slice(0, 2);
  const candidatas = vozesDoIdioma(voices, lang);
  if (!candidatas.length) return undefined;

  try {
    const salva = localStorage.getItem(`${CHAVE}-${base}`);
    const v = salva && candidatas.find((c) => c.voiceURI === salva);
    if (v) return v;
  } catch { /* sem localStorage */ }

  const pref = PREFERIDAS[base] ?? [];
  const evitar = EVITAR[base] ?? [];
  const nota = (v: SpeechSynthesisVoice) => {
    const nome = v.name.toLowerCase();
    let n = 0;
    if (RUINS.test(nome)) n -= 100;
    if (BOAS.test(nome)) n += 40;
    const i = pref.findIndex((p) => nome.includes(p));
    if (i >= 0) n += 30 - i;
    if (evitar.some((e) => nome.includes(e))) n -= 25;
    if (norm(v.lang) === alvo) n += 10;
    if (!v.localService) n -= 3; // voz de rede falha sem internet
    return n;
  };
  return [...candidatas].sort((a, b) => nota(b) - nota(a))[0];
}

export function salvarVoz(lang: string, voice: SpeechSynthesisVoice) {
  try { localStorage.setItem(`${CHAVE}-${norm(lang).slice(0, 2)}`, voice.voiceURI); } catch { /* ignora */ }
}

/** No iPhone/Chrome a lista de vozes chega depois do primeiro getVoices(); espera até 1,5 s. */
export function carregarVozes(synth: SpeechSynthesis): Promise<SpeechSynthesisVoice[]> {
  const ja = synth.getVoices();
  if (ja.length) return Promise.resolve(ja);
  return new Promise((ok) => {
    const fim = () => { synth.removeEventListener?.("voiceschanged", fim); ok(synth.getVoices()); };
    synth.addEventListener?.("voiceschanged", fim);
    setTimeout(fim, 1500);
  });
}
