import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import { Loader2, Plus, Pencil, Trash2, Lock, Unlock, ChevronLeft, ChevronRight, Search } from "lucide-react";

type Row = { id: string; email: string; bloqueado: boolean; created_at: string; total_count: number };
const PAGE_SIZE = 50;

interface Props {
  creds: { _admin_email: string; _admin_password: string };
  onUnauthorized: () => void;
}

const UsersSection = ({ creds, onUnauthorized }: Props) => {
  const [rows, setRows] = useState<Row[]>([]);
  const [search, setSearch] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [page, setPage] = useState(0);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);

  const [addOpen, setAddOpen] = useState(false);
  const [newEmail, setNewEmail] = useState("");
  const [editing, setEditing] = useState<Row | null>(null);
  const [editValue, setEditValue] = useState("");
  const [confirmDelete, setConfirmDelete] = useState<Row | null>(null);

  const load = async () => {
    setLoading(true);
    const { data, error } = await supabase.rpc("admin_list_emails_paginated", {
      ...creds,
      _search: search,
      _limit: PAGE_SIZE,
      _offset: page * PAGE_SIZE,
    });
    setLoading(false);
    if (error) {
      onUnauthorized();
      return;
    }
    const list = (data as Row[]) || [];
    setRows(list);
    setTotal(list[0]?.total_count ?? 0);
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

  const handleAdd = async () => {
    if (!newEmail.trim()) return;
    const { error } = await supabase.rpc("admin_add_email", { ...creds, _new_email: newEmail });
    if (error) return toast.error("Erro ao adicionar.");
    toast.success("E-mail adicionado.");
    setNewEmail("");
    setAddOpen(false);
    load();
  };

  const handleEdit = async () => {
    if (!editing || !editValue.trim()) return;
    const { error } = await supabase.rpc("admin_update_email", { ...creds, _id: editing.id, _new_email: editValue });
    if (error) return toast.error("Erro ao atualizar.");
    toast.success("Atualizado.");
    setEditing(null);
    load();
  };

  const handleToggle = async (row: Row) => {
    const { error } = await supabase.rpc("admin_toggle_block", { ...creds, _id: row.id, _bloqueado: !row.bloqueado });
    if (error) return toast.error("Erro.");
    toast.success(row.bloqueado ? "Desbloqueado." : "Bloqueado.");
    load();
  };

  const handleDelete = async () => {
    if (!confirmDelete) return;
    const { error } = await supabase.rpc("admin_delete_email", { ...creds, _id: confirmDelete.id });
    if (error) return toast.error("Erro.");
    toast.success("Removido.");
    setConfirmDelete(null);
    load();
  };

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        <form onSubmit={handleSearch} className="flex gap-2 flex-1 min-w-[240px]">
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Buscar por e-mail..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              className="pl-9"
            />
          </div>
          <Button type="submit" variant="outline">Buscar</Button>
        </form>
        <Button onClick={() => setAddOpen(true)} className="gap-2">
          <Plus className="w-4 h-4" />
          Adicionar
        </Button>
      </div>

      <div className="rounded-xl border border-border bg-card overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>E-mail</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Cadastro</TableHead>
              <TableHead className="text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow><TableCell colSpan={4} className="text-center py-8"><Loader2 className="w-5 h-5 animate-spin mx-auto text-muted-foreground" /></TableCell></TableRow>
            ) : rows.length === 0 ? (
              <TableRow><TableCell colSpan={4} className="text-center py-8 text-muted-foreground text-sm">Nenhum e-mail encontrado.</TableCell></TableRow>
            ) : (
              rows.map((r) => (
                <TableRow key={r.id}>
                  <TableCell className="font-medium break-all">{r.email}</TableCell>
                  <TableCell>
                    {r.bloqueado ? (
                      <span className="text-xs px-2 py-1 rounded-full bg-destructive/15 text-destructive">Bloqueado</span>
                    ) : (
                      <span className="text-xs px-2 py-1 rounded-full bg-primary/10 text-primary">Ativo</span>
                    )}
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground">{new Date(r.created_at).toLocaleDateString("pt-BR")}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1">
                      <Button size="icon" variant="ghost" onClick={() => { setEditing(r); setEditValue(r.email); }}><Pencil className="w-4 h-4" /></Button>
                      <Button size="icon" variant="ghost" onClick={() => handleToggle(r)}>
                        {r.bloqueado ? <Unlock className="w-4 h-4" /> : <Lock className="w-4 h-4" />}
                      </Button>
                      <Button size="icon" variant="ghost" onClick={() => setConfirmDelete(r)} className="text-destructive hover:text-destructive"><Trash2 className="w-4 h-4" /></Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <div className="flex items-center justify-between text-sm">
        <span className="text-muted-foreground">
          {total.toLocaleString("pt-BR")} usuário(s) • Página {page + 1} de {totalPages}
        </span>
        <div className="flex gap-2">
          <Button size="sm" variant="outline" disabled={page === 0} onClick={() => setPage(page - 1)}>
            <ChevronLeft className="w-4 h-4" />
          </Button>
          <Button size="sm" variant="outline" disabled={page + 1 >= totalPages} onClick={() => setPage(page + 1)}>
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>
      </div>

      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Adicionar e-mail</DialogTitle></DialogHeader>
          <Input type="email" value={newEmail} onChange={(e) => setNewEmail(e.target.value)} placeholder="usuario@email.com" />
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddOpen(false)}>Cancelar</Button>
            <Button onClick={handleAdd}>Adicionar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!editing} onOpenChange={(o) => !o && setEditing(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Editar e-mail</DialogTitle></DialogHeader>
          <Input type="email" value={editValue} onChange={(e) => setEditValue(e.target.value)} />
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditing(null)}>Cancelar</Button>
            <Button onClick={handleEdit}>Salvar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!confirmDelete} onOpenChange={(o) => !o && setConfirmDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir e-mail?</AlertDialogTitle>
            <AlertDialogDescription>
              <strong>{confirmDelete?.email}</strong> perderá o acesso. Esta ação não pode ser desfeita.
            </AlertDialogDescription>
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

export default UsersSection;
