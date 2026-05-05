import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import { Loader2, Trash2, ChevronLeft, ChevronRight, Search, Sparkles } from "lucide-react";
import { costFor, labelFor } from "./cost-map";

type Row = { id: string; action: string; cache_key: string; created_at: string; expires_at: string; total_count: number };
type StatRow = { action: string; total: number };
const PAGE_SIZE = 50;

interface Props {
  creds: { _admin_email: string; _admin_password: string };
}

const CacheSection = ({ creds }: Props) => {
  const [rows, setRows] = useState<Row[]>([]);
  const [stats, setStats] = useState<StatRow[]>([]);
  const [search, setSearch] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [page, setPage] = useState(0);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [confirmClear, setConfirmClear] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState<Row | null>(null);

  const load = async () => {
    setLoading(true);
    const [list, s] = await Promise.all([
      supabase.rpc("admin_list_cache", {
        ...creds,
        _search: search,
        _limit: PAGE_SIZE,
        _offset: page * PAGE_SIZE,
      }),
      supabase.rpc("admin_cache_stats", creds),
    ]);
    setLoading(false);
    const arr = (list.data as Row[]) || [];
    setRows(arr);
    setTotal(arr[0]?.total_count ?? 0);
    setStats((s.data as StatRow[]) || []);
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, search]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(0);
    setSearch(searchInput.trim());
  };

  const handleClearOld = async () => {
    const { data, error } = await supabase.rpc("admin_clear_old_cache", { ...creds, _days: 30 });
    if (error) return toast.error("Erro ao limpar.");
    toast.success(`${data} entradas antigas removidas.`);
    setConfirmClear(false);
    load();
  };

  const handleDelete = async () => {
    if (!confirmDelete) return;
    const { error } = await supabase.rpc("admin_delete_cache", { ...creds, _id: confirmDelete.id });
    if (error) return toast.error("Erro.");
    toast.success("Removido.");
    setConfirmDelete(null);
    load();
  };

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const totalAll = stats.reduce((acc, s) => acc + Number(s.total), 0);
  const estimatedSaved = stats.reduce((acc, s) => acc + Number(s.total) * costFor(s.action), 0);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        <div className="rounded-xl border border-border bg-card p-5">
          <p className="text-xs text-muted-foreground uppercase tracking-wide">Total em cache</p>
          <p className="font-display text-3xl font-bold mt-2">{totalAll.toLocaleString("pt-BR")}</p>
          <p className="text-xs text-muted-foreground mt-1">respostas reaproveitadas</p>
        </div>
        <div className="rounded-xl border border-border bg-card p-5">
          <p className="text-xs text-muted-foreground uppercase tracking-wide">Economia estimada</p>
          <p className="font-display text-3xl font-bold mt-2 text-primary">~${estimatedSaved.toFixed(2)}</p>
          <p className="text-xs text-muted-foreground mt-1">veja detalhes em "Análises"</p>
        </div>
        <div className="rounded-xl border border-border bg-card p-5">
          <p className="text-xs text-muted-foreground uppercase tracking-wide mb-2">Por tipo</p>
          <div className="space-y-1">
            {stats.slice(0, 4).map((s) => (
              <div key={s.action} className="flex justify-between text-sm">
                <span className="truncate">{labelFor(s.action)}</span>
                <span className="text-muted-foreground ml-2">{Number(s.total).toLocaleString("pt-BR")}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        <form onSubmit={handleSearch} className="flex gap-2 flex-1 min-w-[240px]">
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input placeholder="Buscar por tipo ou chave..." value={searchInput} onChange={(e) => setSearchInput(e.target.value)} className="pl-9" />
          </div>
          <Button type="submit" variant="outline">Buscar</Button>
        </form>
        <Button variant="outline" onClick={() => setConfirmClear(true)} className="gap-2">
          <Sparkles className="w-4 h-4" />
          Limpar antigos (+30d)
        </Button>
      </div>

      <div className="rounded-xl border border-border bg-card overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Tipo</TableHead>
              <TableHead>Chave</TableHead>
              <TableHead>Criado</TableHead>
              <TableHead className="text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow><TableCell colSpan={4} className="text-center py-8"><Loader2 className="w-5 h-5 animate-spin mx-auto text-muted-foreground" /></TableCell></TableRow>
            ) : rows.length === 0 ? (
              <TableRow><TableCell colSpan={4} className="text-center py-8 text-muted-foreground text-sm">Nenhuma entrada.</TableCell></TableRow>
            ) : (
              rows.map((r) => (
                <TableRow key={r.id}>
                  <TableCell><span className="text-xs px-2 py-1 rounded-full bg-primary/10 text-primary font-medium">{r.action}</span></TableCell>
                  <TableCell className="text-xs font-mono break-all max-w-md truncate">{r.cache_key}</TableCell>
                  <TableCell className="text-xs text-muted-foreground whitespace-nowrap">{new Date(r.created_at).toLocaleDateString("pt-BR")}</TableCell>
                  <TableCell className="text-right">
                    <Button size="icon" variant="ghost" onClick={() => setConfirmDelete(r)} className="text-destructive hover:text-destructive"><Trash2 className="w-4 h-4" /></Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <div className="flex items-center justify-between text-sm">
        <span className="text-muted-foreground">{total.toLocaleString("pt-BR")} entradas • Página {page + 1} de {totalPages}</span>
        <div className="flex gap-2">
          <Button size="sm" variant="outline" disabled={page === 0} onClick={() => setPage(page - 1)}><ChevronLeft className="w-4 h-4" /></Button>
          <Button size="sm" variant="outline" disabled={page + 1 >= totalPages} onClick={() => setPage(page + 1)}><ChevronRight className="w-4 h-4" /></Button>
        </div>
      </div>

      <AlertDialog open={confirmClear} onOpenChange={setConfirmClear}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Limpar cache antigo?</AlertDialogTitle>
            <AlertDialogDescription>Vai apagar todas entradas com mais de 30 dias. Próximas requisições vão regenerar e salvar de novo.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleClearOld}>Limpar</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={!!confirmDelete} onOpenChange={(o) => !o && setConfirmDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir entrada?</AlertDialogTitle>
            <AlertDialogDescription>A próxima requisição idêntica vai regenerar e salvar de novo.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">Excluir</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default CacheSection;
