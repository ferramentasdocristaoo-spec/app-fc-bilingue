import { Info } from "lucide-react";

const SermonsSection = () => {
  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-border bg-card p-8 text-center space-y-4">
        <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center mx-auto">
          <Info className="w-7 h-7 text-primary" />
        </div>
        <div className="space-y-2">
          <h3 className="font-display text-xl font-bold text-primary">Sermões privados por design</h3>
          <p className="text-sm text-muted-foreground max-w-lg mx-auto leading-relaxed">
            Os sermões gerados ficam salvos <strong>localmente no dispositivo de cada usuário</strong>,
            garantindo privacidade total. O administrador não tem acesso ao conteúdo individual.
          </p>
        </div>
        <div className="pt-2">
          <p className="text-sm text-foreground">
            👉 Quando o usuário quer compartilhar, ele publica voluntariamente no{" "}
            <strong>Púlpito Compartilhado</strong>, que é público.
          </p>
        </div>
      </div>

      <div className="rounded-xl border border-border bg-muted/30 p-5">
        <p className="text-xs text-muted-foreground leading-relaxed">
          💡 <strong>Por que assim?</strong> Sermões são trabalho pessoal e devocional do pregador.
          Manter no dispositivo respeita a privacidade e ainda economiza armazenamento no banco.
          O contador de uso ainda registra <em>quantas vezes</em> a Oficina de Sermões foi acessada
          (visível no Dashboard), só não armazena o conteúdo gerado.
        </p>
      </div>
    </div>
  );
};

export default SermonsSection;
