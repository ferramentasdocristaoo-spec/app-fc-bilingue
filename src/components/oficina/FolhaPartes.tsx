import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { Pencil, Check, X } from "lucide-react";
import { rotuloParte, type Parte, type PartesLabels } from "@/lib/sermon-parts";

const ROMAN = ["I", "II", "III", "IV", "V", "VI", "VII", "VIII", "IX", "X", "XI", "XII"];

/** Textarea que cresce com o texto (na folha não queremos barra de rolagem dentro da parte). */
function CampoTexto(props: React.TextareaHTMLAttributes<HTMLTextAreaElement> & { focar?: boolean }) {
  const { focar, ...rest } = props;
  const ref = useRef<HTMLTextAreaElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${el.scrollHeight + 2}px`;
  }, [rest.value]);
  useEffect(() => {
    if (focar) ref.current?.focus();
  }, [focar]);
  return <textarea ref={ref} rows={2} {...rest} />;
}

interface Props {
  partes: Parte[];
  labels: PartesLabels;
  onChange: (partes: Parte[]) => void;
}

/**
 * A folha do esboço com cada parte editável no lugar: "Editar esta parte" troca o texto por campos, e
 * "＋ Anotação" acrescenta uma observação do pregador (vai para o texto corrido, Meus Esboços e o PDF).
 */
const FolhaPartes = ({ partes, labels, onChange }: Props) => {
  const { t } = useTranslation();
  const [editando, setEditando] = useState<string | null>(null);
  const [focoNota, setFocoNota] = useState<{ id: string; idx: number } | null>(null);

  const atualizar = (id: string, mudanca: Partial<Parte>) => onChange(partes.map((p) => (p.id === id ? { ...p, ...mudanca } : p)));

  const concluir = (p: Parte) => {
    // Anotações vazias somem ao concluir.
    const anotacoes = p.anotacoes.filter((a) => a.trim());
    if (anotacoes.length !== p.anotacoes.length) atualizar(p.id, { anotacoes });
    setEditando(null);
    setFocoNota(null);
  };

  const novaAnotacao = (p: Parte) => {
    atualizar(p.id, { anotacoes: [...p.anotacoes, ""] });
    setEditando(p.id);
    setFocoNota({ id: p.id, idx: p.anotacoes.length });
  };

  let numero = 0;
  return (
    <div className="folha-partes">
      <p className="folha-dica">{t("oficina.sheetHint")}</p>
      {partes.map((p) => {
        const ehPonto = p.tipo === "ponto";
        if (ehPonto) numero += 1;
        const n = numero;
        const aberto = editando === p.id;
        const secaoId = p.tipo === "introducao" ? "sec-intro" : p.tipo === "aplicacao" ? "sec-aplicacao" : p.tipo === "conclusao" ? "sec-conclusao" : `sec-${p.id}`;
        const paragrafos = p.texto.split(/\n+/).filter((s) => s.trim());
        const rotulo = rotuloParte(p, labels);
        return (
          <section key={p.id} id={ehPonto ? `sec-ponto-${n - 1}` : secaoId} className={`folha-parte${aberto ? " is-editing" : ""}`} aria-label={rotulo || undefined}>
            {ehPonto ? (
              aberto ? (
                <label className="folha-campo">
                  <span>{t("oficina.partTitle")}</span>
                  <input value={p.titulo} onChange={(e) => atualizar(p.id, { titulo: e.target.value })} />
                </label>
              ) : (
                <h3 className="studio-point">
                  <span className="ed-num" aria-hidden>{ROMAN[n - 1] ?? n}</span>
                  {p.titulo}
                </h3>
              )
            ) : (
              rotulo && <h3 className="studio-eyebrow">{rotulo}</h3>
            )}

            {aberto ? (
              <>
                <label className="folha-campo">
                  <span>{t("oficina.partText")}</span>
                  <CampoTexto value={p.texto} onChange={(e) => atualizar(p.id, { texto: e.target.value })} focar={!focoNota} />
                </label>
                {ehPonto && (
                  <label className="folha-campo">
                    <span>{t("oficina.partVerses")}</span>
                    <input
                      value={p.versiculos.join(", ")}
                      onChange={(e) => atualizar(p.id, { versiculos: e.target.value.split(/\s*[;,]\s*(?=(?:[1-3]\s?)?\p{L})/u).map((v) => v.trim()).filter(Boolean) })}
                    />
                  </label>
                )}
              </>
            ) : (
              <>
                {paragrafos.map((par, i) => (
                  <p key={i} className={p.tipo === "introducao" && i === 0 ? "studio-hook" : undefined}>{par}</p>
                ))}
                {p.versiculos.length > 0 && <p className="studio-refs">{p.versiculos.join(" · ")}</p>}
              </>
            )}

            {p.anotacoes.map((nota, i) =>
              aberto ? (
                <div key={i} className="folha-nota is-editing">
                  <label className="folha-campo">
                    <span>{t("oficina.noteLabel")}</span>
                    <CampoTexto
                      value={nota}
                      placeholder={t("oficina.notePlaceholder")}
                      focar={focoNota?.id === p.id && focoNota.idx === i}
                      onChange={(e) => atualizar(p.id, { anotacoes: p.anotacoes.map((a, j) => (j === i ? e.target.value : a)) })}
                    />
                  </label>
                  <button type="button" className="folha-acao folha-remover" onClick={() => atualizar(p.id, { anotacoes: p.anotacoes.filter((_, j) => j !== i) })}>
                    <X size={18} aria-hidden /> {t("oficina.removeNote")}
                  </button>
                </div>
              ) : (
                nota.trim() && (
                  <aside key={i} className="folha-nota">
                    <span className="folha-nota-rotulo">{t("oficina.noteLabel")}</span>
                    <p>{nota}</p>
                  </aside>
                )
              ),
            )}

            <div className="folha-acoes">
              {aberto ? (
                <button type="button" className="folha-acao folha-concluir" onClick={() => concluir(p)}>
                  <Check size={18} aria-hidden /> {t("oficina.donePart")}
                </button>
              ) : (
                <button type="button" className="folha-acao" onClick={() => { setFocoNota(null); setEditando(p.id); }} aria-label={rotulo ? `${t("oficina.editPart")}: ${rotulo}` : t("oficina.editPart")}>
                  <Pencil size={18} aria-hidden /> {t("oficina.editPart")}
                </button>
              )}
              <button type="button" className="folha-acao" onClick={() => novaAnotacao(p)} aria-label={rotulo ? `${t("oficina.addNote")}: ${rotulo}` : t("oficina.addNote")}>
                {t("oficina.addNote")}
              </button>
            </div>
          </section>
        );
      })}
    </div>
  );
};

export default FolhaPartes;
