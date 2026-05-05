import { useState } from "react";
import { useTranslation } from "react-i18next";
import PageShell from "@/components/PageShell";
import { Button } from "@/components/ui/button";
import { Sparkles } from "lucide-react";

const VozDeDeusPage = () => {
  const { t } = useTranslation();

  const promessas = [
    { texto: "Porque eu bem sei os pensamentos que penso de vós, diz o Senhor; pensamentos de paz, e não de mal, para vos dar o fim que esperais.", referencia: "Jeremias 29:11" },
    { texto: "Tudo posso naquele que me fortalece.", referencia: "Filipenses 4:13" },
    { texto: "O Senhor é o meu pastor, nada me faltará.", referencia: "Salmos 23:1" },
    { texto: "Não temas, porque eu sou contigo; não te assombres, porque eu sou o teu Deus.", referencia: "Isaías 41:10" },
    { texto: "Mas os que esperam no Senhor renovarão as forças, subirão com asas como águias.", referencia: "Isaías 40:31" },
    { texto: "E conhecereis a verdade, e a verdade vos libertará.", referencia: "João 8:32" },
    { texto: "Clama a mim, e responder-te-ei, e anunciar-te-ei coisas grandes e firmes, que não sabes.", referencia: "Jeremias 33:3" },
    { texto: "E sabemos que todas as coisas contribuem juntamente para o bem daqueles que amam a Deus.", referencia: "Romanos 8:28" },
    { texto: "Deus é o nosso refúgio e fortaleza, socorro bem presente na angústia.", referencia: "Salmos 46:1" },
    { texto: "Entrega o teu caminho ao Senhor; confia nele, e ele tudo fará.", referencia: "Salmos 37:5" },
  ];

  const [promessa, setPromessa] = useState<typeof promessas[0] | null>(null);

  const sortear = () => {
    const random = promessas[Math.floor(Math.random() * promessas.length)];
    setPromessa(random);
  };

  return (
    <PageShell title={t("sidebar.voz.title")}>
      <div className="max-w-sm mx-auto flex flex-col items-center gap-6 pt-8">
        <p className="text-center text-sm text-muted-foreground leading-relaxed">{t("voz.description")}</p>

        <Button onClick={sortear} size="lg" className="gap-2 text-base px-8">
          <Sparkles className="w-5 h-5" />
          {t("voz.button")}
        </Button>

        {promessa && (
          <div className="menu-card flex-col items-center gap-4 gold-glow text-center animate-fade-in">
            <p className="text-lg text-foreground italic leading-relaxed font-light">"{promessa.texto}"</p>
            <p className="font-display font-bold text-primary text-sm">{promessa.referencia}</p>
          </div>
        )}
      </div>
    </PageShell>
  );
};

export default VozDeDeusPage;
