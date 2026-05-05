import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { Download } from "lucide-react";
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
  const { t } = useTranslation();
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
        <span className="hidden sm:inline">{t("install.button")}</span>
        <span className="sm:hidden">{t("install.button")}</span>
      </Button>

      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-center">{t("install.title")}</DialogTitle>
            <DialogDescription className="text-center">
              {t("install.description")}
            </DialogDescription>
          </DialogHeader>

          {platform === "ios" ? (
            <IosSteps steps={t("install.iosSteps")} />
          ) : platform === "android" ? (
            <AndroidSteps steps={t("install.androidSteps")} />
          ) : (
            <div className="space-y-4">
              <p className="text-sm font-semibold text-foreground">iPhone (Safari):</p>
              <IosSteps steps={t("install.iosSteps")} />
              <div className="border-t border-border my-2" />
              <p className="text-sm font-semibold text-foreground">Android (Chrome):</p>
              <AndroidSteps steps={t("install.androidSteps")} />
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
};

const IosSteps = ({ steps }: { steps: string }) => (
  <p className="text-sm text-muted-foreground px-2">{steps}</p>
);

const AndroidSteps = ({ steps }: { steps: string }) => (
  <p className="text-sm text-muted-foreground px-2">{steps}</p>
);

export default InstallButton;
