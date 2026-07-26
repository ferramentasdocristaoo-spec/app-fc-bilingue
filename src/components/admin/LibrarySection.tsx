import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import { Loader2, Plus, Trash2, Search, Tag, BookKey } from "lucide-react";
import { libraryProducts } from "@/data/library";

type SkuRow = { sku: string; product_slug: string };
type EntRow = { id: string; email: string; product_slug: string; source_sku: string | null; created_at: string; total_count: number };
const PAGE_SIZE = 50;

interface Props {
  creds: { _admin_email: string; _admin_password: string };
  onUnauthorized: () => void;
}

const LibrarySection = ({ creds, onUnauthorized }: Props) => {
  const products = libraryProducts("pt-PT");
  const productTitle = (slug: string) => products.find((p) => p.slug === slug)?.title ?? slug;

  const [skus, setSkus] = useState<SkuRow[]>([]);
  const [skusLoading, setSkusLoading] = useState(true);
  const [newSku, setNewSku] = useState("");
  const [newSkuProduct, setNewSkuProduct] = useState(products[0]?.slug ?? "");
  const [deleteSku, setDeleteSku] = useState<SkuRow | null>(null);

  const [ents, setEnts] = useState<EntRow[]>([]);
  const [entsLoading, setEntsLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [page, setPage] = useState(0);
  const [total, setTotal] = useState(0);
  const [grantEmail, setGrantEmail] = useState("");
  const [grantProduct, setGrantProduct] = useState(products[0]?.slug ?? "");
  const [revoke, setRevoke] = useState<EntRow | null>(null);
  const [saving, setSaving] = useState(false);

  const loadSkus = useCallback(async () => {
    setSkusLoading(true);
    const { data, error } = await supabase.rpc("admin_list_library_skus", { ...creds });
    setSkusLoading(false);
    if (error) return onUnauthorized();
    setSkus((data as SkuRow[]) || []);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadEnts = useCallback(async () => {
    setEntsLoading(true);
    const { data, error } = await supabase.rpc("admin_list_library_entitlements", {
      ...creds,
      _search: search,
      _limit: PAGE_SIZE,
      _offset: page * PAGE_SIZE,
    });
    setEntsLoading(false);
    if (error) return onUnauthorized();
    const list = (data as EntRow[]) || [];
    setEnts(list);
    setTotal(Number(list[0]?.total_count ?? 0));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search, page]);

  useEffect(() => { loadSkus(); }, [loadSkus]);
  useEffect(() => { loadEnts(); }, [loadEnts]);

  const addSku = async () => {
    if (!newSku.trim() || !newSkuProduct) return;
    setSaving(true);
    const { error } = await supabase.rpc("admin_add_library_sku", { ...creds, _sku: newSku.trim(), _product_slug: newSkuProduct });
    setSaving(false);
    if (error) return toast.error("Erro ao salvar SKU");
    toast.success("SKU vinculado à coleção");
    setNewSku("");
    loadSkus();
  };

  const confirmDeleteSku = async () => {
    if (!deleteSku) return;
    const { error } = await supabase.rpc("admin_delete_library_sku", { ...creds, _sku: deleteSku.sku });
    setDeleteSku(null);
    if (error) return toast.error("Erro ao remover SKU");
    toast.success("SKU removido");
    loadSkus();
  };

  const grant = async () => {
    if (!grantEmail.trim() || !grantProduct) return;
    setSaving(true);
    const { error } = await supabase.rpc("admin_grant_library_access", { ...creds, _email: grantEmail.trim(), _product_slug: grantProduct });
    setSaving(false);
    if (error) return toast.error("Erro ao liberar acesso");
    toast.success(`Acesso liberado para ${grantEmail.trim()}`);
    setGrantEmail("");
    loadEnts();
  };

  const confirmRevoke = async () => {
    if (!revoke) return;
    const { error } = await supabase.rpc("admin_revoke_library_access", { ...creds, _id: revoke.id });
    setRevoke(null);
    if (error) return toast.error("Erro ao revogar acesso");
    toast.success("Acesso revogado");
    loadEnts();
  };

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <div className="space-y-10">
      <section>
        <div className="mb-1 flex items-center gap-2">
          <Tag className="h-5 w-5 text-primary" />
          <h2 className="text-lg font-semibold">SKUs das coleções</h2>
        </div>
        <p className="mb-4 text-sm text-muted-foreground">
          Quando uma compra chega com um destes SKUs, o acesso à coleção é liberado automaticamente para o e-mail do comprador.
        </p>
        <div className="mb-4 flex flex-wrap items-end gap-3">
          <div>
            <Label htmlFor="new-sku">SKU do checkout</Label>
            <Input id="new-sku" value={newSku} onChange={(e) => setNewSku(e.target.value)} placeholder="ex.: APOCALIPSE-8V" className="w-56" />
          </div>
          <div>
            <Label>Coleção</Label>
            <Select value={newSkuProduct} onValueChange={setNewSkuProduct}>
              <SelectTrigger className="w-56"><SelectValue /></SelectTrigger>
              <SelectContent>
                {products.map((p) => <SelectItem key={p.slug} value={p.slug}>{p.title}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <Button onClick={addSku} disabled={saving || !newSku.trim()} className="gap-1.5"><Plus className="h-4 w-4" />Vincular</Button>
        </div>
        {skusLoading ? (
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
        ) : skus.length === 0 ? (
          <p className="text-sm text-muted-foreground">Nenhum SKU configurado ainda.</p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow><TableHead>SKU</TableHead><TableHead>Coleção</TableHead><TableHead className="w-16" /></TableRow>
            </TableHeader>
            <TableBody>
              {skus.map((row) => (
                <TableRow key={row.sku}>
                  <TableCell className="font-mono text-sm">{row.sku}</TableCell>
                  <TableCell>{productTitle(row.product_slug)}</TableCell>
                  <TableCell>
                    <Button variant="ghost" size="icon" onClick={() => setDeleteSku(row)} aria-label="Remover SKU">
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </section>

      <section>
        <div className="mb-1 flex items-center gap-2">
          <BookKey className="h-5 w-5 text-primary" />
          <h2 className="text-lg font-semibold">Acessos dos usuários</h2>
        </div>
        <p className="mb-4 text-sm text-muted-foreground">Libere ou revogue manualmente o acesso de um e-mail a uma coleção.</p>
        <div className="mb-4 flex flex-wrap items-end gap-3">
          <div>
            <Label htmlFor="grant-email">E-mail do usuário</Label>
            <Input id="grant-email" value={grantEmail} onChange={(e) => setGrantEmail(e.target.value)} placeholder="usuario@email.com" className="w-64" />
          </div>
          <div>
            <Label>Coleção</Label>
            <Select value={grantProduct} onValueChange={setGrantProduct}>
              <SelectTrigger className="w-56"><SelectValue /></SelectTrigger>
              <SelectContent>
                {products.map((p) => <SelectItem key={p.slug} value={p.slug}>{p.title}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <Button onClick={grant} disabled={saving || !grantEmail.trim()} className="gap-1.5"><Plus className="h-4 w-4" />Liberar acesso</Button>
        </div>
        <div className="mb-3 flex items-center gap-2">
          <Input
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") { setPage(0); setSearch(searchInput); } }}
            placeholder="Buscar por e-mail…"
            className="w-64"
          />
          <Button variant="outline" size="icon" onClick={() => { setPage(0); setSearch(searchInput); }} aria-label="Buscar">
            <Search className="h-4 w-4" />
          </Button>
        </div>
        {entsLoading ? (
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
        ) : ents.length === 0 ? (
          <p className="text-sm text-muted-foreground">Nenhum acesso encontrado.</p>
        ) : (
          <>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>E-mail</TableHead><TableHead>Coleção</TableHead><TableHead>Origem</TableHead><TableHead>Data</TableHead><TableHead className="w-16" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {ents.map((row) => (
                  <TableRow key={row.id}>
                    <TableCell>{row.email}</TableCell>
                    <TableCell>{productTitle(row.product_slug)}</TableCell>
                    <TableCell className="font-mono text-xs">{row.source_sku ?? "—"}</TableCell>
                    <TableCell className="text-xs text-muted-foreground">{new Date(row.created_at).toLocaleDateString()}</TableCell>
                    <TableCell>
                      <Button variant="ghost" size="icon" onClick={() => setRevoke(row)} aria-label="Revogar acesso">
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            {totalPages > 1 && (
              <div className="mt-3 flex items-center gap-3 text-sm">
                <Button variant="outline" size="sm" disabled={page === 0} onClick={() => setPage((p) => p - 1)}>Anterior</Button>
                <span>{page + 1} / {totalPages}</span>
                <Button variant="outline" size="sm" disabled={page + 1 >= totalPages} onClick={() => setPage((p) => p + 1)}>Próxima</Button>
              </div>
            )}
          </>
        )}
      </section>

      <AlertDialog open={!!deleteSku} onOpenChange={(open) => !open && setDeleteSku(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remover SKU?</AlertDialogTitle>
            <AlertDialogDescription>
              Novas compras com o SKU <strong>{deleteSku?.sku}</strong> deixarão de liberar a coleção {productTitle(deleteSku?.product_slug ?? "")}. Acessos já concedidos não são afetados.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDeleteSku}>Remover</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={!!revoke} onOpenChange={(open) => !open && setRevoke(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Revogar acesso?</AlertDialogTitle>
            <AlertDialogDescription>
              {revoke?.email} perderá o acesso à coleção {productTitle(revoke?.product_slug ?? "")}.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={confirmRevoke}>Revogar</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default LibrarySection;
