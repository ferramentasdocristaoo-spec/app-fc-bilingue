import { useState, useEffect } from "react";
import { Download, Plus, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

type Platform = "android" | "ios" | "unknown";

function detectPlatform(): Platform {
  const ua = navigator.userAgent.toLowerCase();
  if (/iphone|ipad|ipod/.test(ua)) return "ios";
  if (/android/.test(ua)) return "android";
  return "unknown";
}

const InstallButton = () => {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [showDialog, setShowDialog] = useState(false);
  const platform = detectPlatform();

  useEffect(() => {
    if (window.matchMedia("(display-mode: standalone)").matches) {
      setIsInstalled(true);
      return;
    }

    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };

    window.addEventListener("beforeinstallprompt", handler);
    window.addEventListener("appinstalled", () => setIsInstalled(true));

    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  const handleClick = async () => {
    if (platform === "android" && deferredPrompt) {
      await deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === "accepted") setIsInstalled(true);
      setDeferredPrompt(null);
    } else {
      setShowDialog(true);
    }
  };

  if (isInstalled) return null;

  return (
    <>
      <Button
        onClick={handleClick}
        variant="outline"
        size="sm"
        className="gap-2 border-primary/30 text-primary hover:bg-primary/10"
      >
        <Download className="w-4 h-4" />
        <span className="hidden sm:inline">Instalar App</span>
        <span className="sm:hidden">Instalar</span>
      </Button>

      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-center">Instalar FC Sermon</DialogTitle>
            <DialogDescription className="text-center">
              {platform === "ios"
                ? "Siga os passos abaixo para instalar no seu iPhone"
                : platform === "android"
                ? "Use o menu do navegador para instalar"
                : "Escolha seu dispositivo abaixo"}
            </DialogDescription>
          </DialogHeader>

          {platform === "ios" ? (
            <IosSteps />
          ) : platform === "android" ? (
            <AndroidSteps />
          ) : (
            <div className="space-y-4">
              <p className="text-sm font-semibold text-foreground">No iPhone (Safari):</p>
              <IosSteps />
              <div className="border-t border-border my-2" />
              <p className="text-sm font-semibold text-foreground">No Android (Chrome):</p>
              <AndroidSteps />
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
};

const IosSteps = () => (
  <ol className="space-y-4 text-sm text-muted-foreground px-2">
    <li className="flex items-start gap-3">
      <span className="flex items-center justify-center w-7 h-7 rounded-full bg-primary/10 text-primary font-bold shrink-0">1</span>
      <span>
        Toque no ícone de <strong className="text-foreground">Compartilhar</strong>{" "}
        <ExternalLink className="inline w-4 h-4 text-primary -mt-0.5" /> na barra inferior do Safari
      </span>
    </li>
    <li className="flex items-start gap-3">
      <span className="flex items-center justify-center w-7 h-7 rounded-full bg-primary/10 text-primary font-bold shrink-0">2</span>
      <span>
        Role para baixo e toque em <strong className="text-foreground">"Adicionar à Tela de Início"</strong>{" "}
        <Plus className="inline w-4 h-4 text-primary -mt-0.5" />
      </span>
    </li>
    <li className="flex items-start gap-3">
      <span className="flex items-center justify-center w-7 h-7 rounded-full bg-primary/10 text-primary font-bold shrink-0">3</span>
      <span>
        Toque em <strong className="text-foreground">"Adicionar"</strong> no canto superior direito
      </span>
    </li>
    <li className="flex items-start gap-3">
      <span className="flex items-center justify-center w-7 h-7 rounded-full bg-primary/10 text-primary font-bold shrink-0">✓</span>
      <span className="text-foreground font-medium">
        Pronto! O FC Sermon aparecerá como um app na sua tela inicial.
      </span>
    </li>
  </ol>
);

const AndroidSteps = () => (
  <ol className="space-y-4 text-sm text-muted-foreground px-2">
    <li className="flex items-start gap-3">
      <span className="flex items-center justify-center w-7 h-7 rounded-full bg-primary/10 text-primary font-bold shrink-0">1</span>
      <span>
        Toque no menu <strong className="text-foreground">⋮</strong> (três pontos) no canto superior do Chrome
      </span>
    </li>
    <li className="flex items-start gap-3">
      <span className="flex items-center justify-center w-7 h-7 rounded-full bg-primary/10 text-primary font-bold shrink-0">2</span>
      <span>
        Toque em <strong className="text-foreground">"Instalar aplicativo"</strong> ou <strong className="text-foreground">"Adicionar à tela inicial"</strong>
      </span>
    </li>
    <li className="flex items-start gap-3">
      <span className="flex items-center justify-center w-7 h-7 rounded-full bg-primary/10 text-primary font-bold shrink-0">✓</span>
      <span className="text-foreground font-medium">
        Pronto! O app será instalado automaticamente.
      </span>
    </li>
  </ol>
);

export default InstallButton;
