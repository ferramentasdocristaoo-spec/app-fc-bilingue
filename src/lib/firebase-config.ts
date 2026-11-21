// Config PÚBLICA do app web do Firebase do FC (um projeto Firebase por produto, como a Fome Livre).
// Não é segredo: vai no código do navegador. O segredo de verdade (conta de serviço) fica só como secret
// FCM_SERVICE_ACCOUNT da função push-send no Supabase.
//
// Ou o dono cola aqui (Firebase → ⚙️ Configurações do projeto → Geral → "Seus apps" → app da Web → "Configuração do SDK"):
// os 6 campos do objeto firebaseConfig. E a chave VAPID pública (Configurações do projeto → Cloud Messaging →
// Configuração da Web → Certificados de push da Web → "Gerar par de chaves"; começa com "B", ~87 caracteres).
// Enquanto houver "COLE_AQUI", o convite e o sininho de notificações ficam escondidos no app.

// Caminho preferido (21/11): o dono deixa o JSON baixado do console em firebase-ferramentas-do-cristao.json, na raiz
// do projeto (fora do git, .gitignore). O build lê o arquivo se ele existir; sem ele, ficam os "COLE_AQUI" abaixo.
type ArquivoFirebase = {
  apiKey: string; authDomain: string; projectId: string; storageBucket: string; messagingSenderId: string; appId: string; vapidPublicKey?: string;
};
const arquivos = import.meta.glob<{ default: ArquivoFirebase }>("/firebase-ferramentas-do-cristao.json", { eager: true });
const doArquivo = Object.values(arquivos)[0]?.default;

export const FIREBASE_FC: Record<"apiKey" | "authDomain" | "projectId" | "storageBucket" | "messagingSenderId" | "appId", string> = doArquivo
  ? {
    apiKey: doArquivo.apiKey, authDomain: doArquivo.authDomain, projectId: doArquivo.projectId,
    storageBucket: doArquivo.storageBucket, messagingSenderId: doArquivo.messagingSenderId, appId: doArquivo.appId,
  }
  : {
    apiKey: "COLE_AQUI_apiKey",
    authDomain: "COLE_AQUI_authDomain",
    projectId: "COLE_AQUI_projectId",
    storageBucket: "COLE_AQUI_storageBucket",
    messagingSenderId: "COLE_AQUI_messagingSenderId",
    appId: "COLE_AQUI_appId",
  };

export const FIREBASE_VAPID_PUBLICA = doArquivo?.vapidPublicKey || "COLE_AQUI_A_CHAVE_PUBLICA_WEB_PUSH";

export function firebaseConfigurado(cfg: Record<string, string> = FIREBASE_FC, vapid = FIREBASE_VAPID_PUBLICA): boolean {
  return Object.values(cfg).every((v) => v && !v.startsWith("COLE_AQUI")) && !!vapid && !vapid.startsWith("COLE_AQUI");
}

/** Mostra a interface de notificações. Em teste local dá para ver sem Firebase: `VITE_PUSH_PREVIEW=1 npx vite`. */
export function pushVisivel(): boolean {
  return firebaseConfigurado() || import.meta.env.VITE_PUSH_PREVIEW === "1";
}
