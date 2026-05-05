import { useState, useEffect, useRef } from "react";
import PageShell from "@/components/PageShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { ImagePlus, X } from "lucide-react";

interface Pedido {
  id: string;
  nome: string;
  pedido: string;
  categoria: string;
  amens: number;
  image_url: string | null;
  created_at: string;
}

const MuralPage = () => {
  const [nome, setNome] = useState("");
  const [pedido, setPedido] = useState("");
  const [categoria, setCategoria] = useState("");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [pedidos, setPedidos] = useState<Pedido[]>([]);
  const [loading, setLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const fetchPedidos = async () => {
    const { data, error } = await supabase
      .from("prayer_requests")
      .select("*")
      .order("created_at", { ascending: false });

    if (data) setPedidos(data as Pedido[]);
    if (error) console.error(error);
  };

  useEffect(() => {
    fetchPedidos();
  }, []);

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Imagem muito grande. Máximo 5MB.");
      return;
    }
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
  };

  const removeImage = () => {
    setImageFile(null);
    setImagePreview(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const enviar = async () => {
    if (!pedido.trim()) {
      toast.error("Escreva seu pedido de oração.");
      return;
    }
    setLoading(true);

    let image_url: string | null = null;

    if (imageFile) {
      const ext = imageFile.name.split(".").pop();
      const path = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
      const { error: uploadError } = await supabase.storage
        .from("prayer-images")
        .upload(path, imageFile);

      if (uploadError) {
        toast.error("Erro ao enviar imagem.");
        setLoading(false);
        return;
      }

      const { data: urlData } = supabase.storage
        .from("prayer-images")
        .getPublicUrl(path);
      image_url = urlData.publicUrl;
    }

    const { error } = await supabase.from("prayer_requests").insert({
      nome: nome.trim() || "Anônimo",
      pedido: pedido.trim(),
      categoria: categoria || "Geral",
      image_url,
    });

    if (error) {
      toast.error("Erro ao enviar pedido.");
      console.error(error);
    } else {
      toast.success("Pedido enviado com sucesso! 🙏");
      setNome("");
      setPedido("");
      setCategoria("");
      removeImage();
      fetchPedidos();
    }
    setLoading(false);
  };

  const orar = async (id: string, currentAmens: number) => {
    const { error } = await supabase
      .from("prayer_requests")
      .update({ amens: currentAmens + 1 })
      .eq("id", id);

    if (!error) {
      setPedidos((prev) =>
        prev.map((p) => (p.id === id ? { ...p, amens: p.amens + 1 } : p))
      );
    }
  };

  return (
    <PageShell title="Mural de Clamor">
      <div className="max-w-sm mx-auto flex flex-col gap-4">
        <p className="text-sm text-muted-foreground leading-relaxed">
          Compartilhe seus pedidos de oração com a comunidade. Outros podem interceder clicando em "Estou Orando". Você também pode enviar uma imagem junto.
        </p>
        {/* Formulário */}
        <div className="menu-card flex-col items-start gap-3">
          <h3 className="font-semibold text-sm text-primary">Novo Pedido de Oração</h3>
          <Input
            placeholder="Seu nome (ou deixe vazio para Anônimo)"
            value={nome}
            onChange={(e) => setNome(e.target.value)}
          />
          <Textarea
            placeholder="Seu pedido de oração..."
            value={pedido}
            onChange={(e) => setPedido(e.target.value)}
          />
          <Select value={categoria} onValueChange={setCategoria}>
            <SelectTrigger><SelectValue placeholder="Categoria" /></SelectTrigger>
            <SelectContent>
              {["Saúde", "Família", "Finanças", "Trabalho", "Espiritual", "Geral"].map((c) => (
                <SelectItem key={c} value={c}>{c}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Upload de imagem */}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleImageSelect}
          />

          {imagePreview ? (
            <div className="relative w-full">
              <img src={imagePreview} alt="Preview" className="w-full h-32 object-cover rounded-md" />
              <Button
                variant="destructive"
                size="icon"
                className="absolute top-1 right-1 h-6 w-6"
                onClick={removeImage}
              >
                <X className="h-3 w-3" />
              </Button>
            </div>
          ) : (
            <Button
              variant="outline"
              className="w-full gap-2"
              onClick={() => fileInputRef.current?.click()}
            >
              <ImagePlus className="h-4 w-4" />
              Adicionar Imagem
            </Button>
          )}

          <Button onClick={enviar} className="w-full" disabled={loading}>
            {loading ? "Enviando..." : "Enviar Pedido"}
          </Button>
        </div>

        {/* Lista de pedidos */}
        {pedidos.map((p) => (
          <div key={p.id} className="menu-card flex-col items-start gap-2">
            <div className="flex items-center justify-between w-full">
              <span className="font-semibold text-sm text-foreground">{p.nome}</span>
              <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full">{p.categoria}</span>
            </div>
            <p className="text-sm text-foreground">{p.pedido}</p>
            {p.image_url && (
              <img
                src={p.image_url}
                alt="Imagem do pedido"
                className="w-full h-40 object-cover rounded-md"
              />
            )}
            <div className="flex items-center justify-between w-full">
              <span className="text-xs text-muted-foreground">
                {new Date(p.created_at).toLocaleDateString("pt-BR")}
              </span>
              <Button variant="outline" size="sm" onClick={() => orar(p.id, p.amens)} className="gap-1 text-xs">
                🙏 Estou Orando ({p.amens})
              </Button>
            </div>
          </div>
        ))}

        {pedidos.length === 0 && (
          <p className="text-center text-sm text-muted-foreground py-8">
            Nenhum pedido de oração ainda. Seja o primeiro! 🙏
          </p>
        )}
      </div>
    </PageShell>
  );
};

export default MuralPage;
