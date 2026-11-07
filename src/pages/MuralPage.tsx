import { useState, useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";
import PageShell from "@/components/PageShell";
import { ToolError } from "@/components/ToolKit";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { uploadPrayerImage } from "@/lib/content-api";

// Mural lista só os pedidos mais recentes (antes baixava a tabela inteira a cada visita).
const MURAL_PAGE_SIZE = 100;
import { toast } from "sonner";

interface Pedido {
  id: string;
  nome: string;
  pedido: string;
  categoria: string;
  amens: number;
  image_url: string | null;
  created_at: string;
}

const isAnonymous = (nome: string) => !nome || ["anônimo", "anónimo"].includes(nome.trim().toLowerCase());

const MuralPage = () => {
  const { t, i18n } = useTranslation();
  const [nome, setNome] = useState("");
  const [pedido, setPedido] = useState("");
  const [categoria, setCategoria] = useState("");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [pedidos, setPedidos] = useState<Pedido[]>([]);
  const [loading, setLoading] = useState(false);
  const [carregando, setCarregando] = useState(true);
  const [formAberto, setFormAberto] = useState(false);
  const [falhaLista, setFalhaLista] = useState(false);
  const [faltaPedido, setFaltaPedido] = useState(false);
  // Cada pessoa ora uma vez por pedido em cada aparelho: evita contador inflado por toque repetido.
  const [orados, setOrados] = useState<Set<string>>(() => {
    try { return new Set(JSON.parse(localStorage.getItem("fc-mural-orados") || "[]")); } catch { return new Set(); }
  });
  const fileInputRef = useRef<HTMLInputElement>(null);

  const categorias = [
    { value: "Saúde", label: t("mural.categoryHealth") },
    { value: "Família", label: t("mural.categoryFamily") },
    { value: "Finanças", label: t("mural.categoryFinances") },
    { value: "Trabalho", label: t("mural.categoryWork") },
    { value: "Espiritual", label: t("mural.categorySpirituality") },
    { value: "Geral", label: t("mural.categoryGeneral") },
  ];

  const fetchPedidos = async () => {
    setFalhaLista(false);
    const { data, error } = await supabase
      .from("prayer_requests")
      .select("id, nome, pedido, categoria, amens, image_url, created_at")
      .order("created_at", { ascending: false })
      .limit(MURAL_PAGE_SIZE);
    if (data) setPedidos(data as Pedido[]);
    if (error) { console.error(error); setFalhaLista(true); }
    setCarregando(false);
  };

  useEffect(() => { fetchPedidos(); }, []);

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) { toast.error(t("mural.errorImageSize")); return; }
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
  };

  const removeImage = () => {
    setImageFile(null);
    setImagePreview(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const enviar = async () => {
    if (!pedido.trim()) { setFaltaPedido(true); return; }
    setFaltaPedido(false);
    setLoading(true);
    let image_url: string | null = null;

    if (imageFile) {
      const upload = await uploadPrayerImage(imageFile);
      if (upload.error || !upload.url) { toast.error(t("common.error")); setLoading(false); return; }
      image_url = upload.url;
    }

    const { error } = await supabase.from("prayer_requests").insert({
      nome: nome.trim() || "Anônimo",
      pedido: pedido.trim(),
      categoria: categoria || "Geral",
      image_url,
    });

    if (error) {
      toast.error(t("common.error"));
      console.error(error);
    } else {
      toast.success(t("mural.sent"));
      setNome(""); setPedido(""); setCategoria(""); removeImage(); setFormAberto(false); fetchPedidos();
    }
    setLoading(false);
  };

  const orar = async (id: string, currentAmens: number) => {
    if (orados.has(id)) return;
    // Prefere a RPC atômica (migração 20261102020000); sem ela, usa o update antigo.
    const rpc = await supabase.rpc("add_prayer_amen" as never, { _id: id } as never);
    const error = rpc.error
      ? (await supabase.from("prayer_requests").update({ amens: currentAmens + 1 }).eq("id", id)).error
      : null;
    if (error) { toast.error(t("common.error")); return; }
    setPedidos((prev) => prev.map((p) => (p.id === id ? { ...p, amens: p.amens + 1 } : p)));
    const novos = new Set(orados).add(id);
    setOrados(novos);
    try { localStorage.setItem("fc-mural-orados", JSON.stringify([...novos])); } catch { /* armazenamento indisponível */ }
  };

  return (
    <PageShell title={t("sidebar.mural.title")} lede={t("mural.description")}>
      {!formAberto ? (
        <button type="button" className="ed-btn ed-btn-primary" onClick={() => setFormAberto(true)}>{t("mural.writeButton")}</button>
      ) : (
        <form className="sheet-form mural-form" noValidate onSubmit={(event) => { event.preventDefault(); enviar(); }}>
          <h2 className="ed-section-title !mt-0">{t("mural.formTitle")}</h2>
          <div>
            <label className="ed-label" htmlFor="mural-pedido">{t("mural.requestLabel")}</label>
            <Textarea id="mural-pedido" placeholder={t("mural.requestPlaceholder")} value={pedido} onChange={(e) => { setPedido(e.target.value); if (e.target.value.trim()) setFaltaPedido(false); }} aria-invalid={faltaPedido} autoFocus />
            {faltaPedido && <p className="ed-error" role="alert">{t("mural.errorEmpty")}</p>}
          </div>
          <div className="sheet-pair">
            <div>
              <label className="ed-label" htmlFor="mural-nome">{t("mural.nameLabel")}</label>
              <Input id="mural-nome" placeholder={t("mural.nameShort")} value={nome} onChange={(e) => setNome(e.target.value)} />
            </div>
            <div>
              <span className="ed-label" id="mural-categoria">{t("mural.categoryLabel")}</span>
              <Select value={categoria} onValueChange={setCategoria}>
                <SelectTrigger aria-labelledby="mural-categoria"><SelectValue placeholder={t("mural.categoryChoose")} /></SelectTrigger>
                <SelectContent>
                  {categorias.map((c) => <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>

          <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleImageSelect} aria-label={t("mural.addImage")} />
          {imagePreview ? (
            <div>
              <img src={imagePreview} alt="" className="h-40 w-full rounded-sm object-cover" />
              <button type="button" className="ed-link" onClick={removeImage}>{t("mural.removeImage")}</button>
            </div>
          ) : (
            <button type="button" className="ed-link self-start" onClick={() => fileInputRef.current?.click()}>{t("mural.addImage")}</button>
          )}

          <div className="flex flex-wrap items-center gap-3">
            <button type="submit" className="ed-btn ed-btn-primary" disabled={loading}>{loading ? t("mural.sending") : t("mural.submitButton")}</button>
            <button type="button" className="ed-btn ed-btn-ghost" onClick={() => setFormAberto(false)}>{t("common.cancel")}</button>
          </div>
        </form>
      )}

      <section className="mural-list" aria-labelledby="mural-lista">
        <h2 id="mural-lista" className="ed-eyebrow">{t("mural.prayingNow")}</h2>
        {carregando && <div className="ed-wait-lines" role="status" aria-label={t("common.loading")}>{Array.from({ length: 6 }).map((_, i) => <i key={i} />)}</div>}
        {falhaLista && <ToolError onRetry={fetchPedidos}>{t("common.aiError")}</ToolError>}
        {!carregando && !falhaLista && pedidos.length === 0 && <p className="ed-empty">{t("mural.emptyState")}</p>}
        {pedidos.map((p) => (
          <article key={p.id} className="mural-item">
            <header>
              <strong>{isAnonymous(p.nome) ? t("mural.anonymous") : p.nome}</strong>
              <small>{categorias.find((c) => c.value === p.categoria)?.label ?? p.categoria} · {new Date(p.created_at).toLocaleDateString(i18n.language, { day: "numeric", month: "long" })}</small>
            </header>
            <p>{p.pedido}</p>
            {p.image_url && <img src={p.image_url} alt="" loading="lazy" decoding="async" className="mt-3 max-h-72 w-full rounded-sm object-cover" />}
            <button type="button" className="ed-link" aria-pressed={orados.has(p.id)} disabled={orados.has(p.id)} onClick={() => orar(p.id, p.amens)}>
              {orados.has(p.id) ? t("mural.prayed", { count: p.amens }) : t("mural.prayingButton", { count: p.amens })}
            </button>
          </article>
        ))}
      </section>
    </PageShell>
  );
};

export default MuralPage;
