import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/hooks/use-auth";
import { Loader2, LogIn } from "lucide-react";
import logo from "@/assets/logo.png";

const LoginPage = () => {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const { signIn } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!email.trim()) {
      setError("Digite seu e-mail.");
      return;
    }

    setLoading(true);
    const { error } = await signIn(email);
    if (error) setError(error);
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <div className="w-full max-w-sm flex flex-col items-center gap-6">
        <div className="w-24 h-24 animate-fade-in">
          <img src={logo} alt="FC Sermon" className="w-full h-full object-contain" />
        </div>

        <div className="w-full rounded-xl border border-border bg-card p-6 space-y-5">
          <div className="text-center space-y-1">
            <h1 className="font-display text-xl font-bold text-primary">Entrar</h1>
            <p className="text-sm text-muted-foreground">
              Acesse com o e-mail liberado pela compra.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <Label className="text-sm font-medium">E-mail</Label>
              <Input
                type="email"
                placeholder="seu@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>

            {error && (
              <p className="text-sm text-destructive bg-destructive/10 rounded-lg p-3">{error}</p>
            )}

            <Button type="submit" className="w-full gap-2" disabled={loading}>
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <LogIn className="w-4 h-4" />}
              Entrar
            </Button>
          </form>
        </div>

        <p className="text-xs text-muted-foreground text-center max-w-xs">
          Acesso exclusivo para compradores. Seu e-mail é liberado automaticamente após a confirmação da compra.
        </p>
      </div>
    </div>
  );
};

export default LoginPage;
