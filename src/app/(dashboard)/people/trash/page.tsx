"use client";

import { useState, useEffect, useCallback } from "react";
import { toast } from "sonner";
import {
  Trash2,
  RotateCcw,
  MoreHorizontal,
  Search,
  AlertTriangle,
  Loader2,
  RefreshCcw,
  ChevronLeft,
  ChevronRight,
  Inbox,
  Eye,
  EyeOff,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { cn } from "@/lib/utils";
import { useAuth } from "@/features/auth/auth-context";

interface Department {
  id: string;
  name: string;
}

interface Person {
  id: string;
  name: string;
  ip: string | null;
  mac: string | null;
  computerName: string;
  clave: string | null;
  departmentId: string;
  isDeleted: boolean;
  deletedAt: string | null;
  createdAt: string;
  updatedAt: string;
  department: Department;
}

interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

interface PeopleResponse {
  people: Person[];
  pagination: Pagination;
}

function formatDate(dateStr: string | null): string {
  if (!dateStr) return "-";
  const date = new Date(dateStr);
  return date.toLocaleDateString("es-CO", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
      <div className="flex h-20 w-20 items-center justify-center rounded-full bg-muted/50">
        <Inbox className="h-10 w-10" />
      </div>
      <h3 className="mt-4 text-lg font-semibold">Papelera vacía</h3>
      <p className="mt-1 text-sm">No hay elementos eliminados</p>
    </div>
  );
}

function TableSkeleton() {
  return (
    <div className="space-y-2">
      {Array.from({ length: 10 }).map((_, i) => (
        <div key={i} className="flex items-center gap-4 px-4 py-3">
          <Skeleton className="h-4 w-4" />
          <Skeleton className="h-4 w-28" />
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-4 w-20" />
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-4 w-36" />
          <Skeleton className="h-8 w-8 ml-auto" />
        </div>
      ))}
    </div>
  );
}

export default function TrashPage() {
  const { admin } = useAuth();
  const [people, setPeople] = useState<Person[]>([]);
  const [pagination, setPagination] = useState<Pagination>({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0,
  });
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [actionLoading, setActionLoading] = useState(false);

  const [restoreDialogOpen, setRestoreDialogOpen] = useState(false);
  const [restoreTarget, setRestoreTarget] = useState<Person | null>(null);

  const [permanentDeleteDialogOpen, setPermanentDeleteDialogOpen] =
    useState(false);
  const [permanentDeleteTarget, setPermanentDeleteTarget] =
    useState<Person | null>(null);

  const [bulkRestoreDialogOpen, setBulkRestoreDialogOpen] = useState(false);
  const [bulkDeleteDialogOpen, setBulkDeleteDialogOpen] = useState(false);

  const fetchPeople = useCallback(
    async (page: number = 1) => {
      setLoading(true);
      try {
        const params = new URLSearchParams({
          status: "deleted",
          page: String(page),
          limit: "20",
          sortBy: "deletedAt",
          sortOrder: "desc",
        });
        if (search) {
          params.set("search", search);
        }
        const res = await fetch(`/api/people?${params.toString()}`);
        if (!res.ok) throw new Error("Error al cargar");
        const data: PeopleResponse = await res.json();
        setPeople(data.people);
        setPagination(data.pagination);
        setSelectedIds(new Set());
      } catch {
        toast.error("Error al cargar la papelera");
      } finally {
        setLoading(false);
      }
    },
    [search]
  );

  useEffect(() => {
    fetchPeople(1);
  }, [fetchPeople]);

  const handleSearch = () => {
    setSearch(searchInput);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleSearch();
    }
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === people.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(people.map((p) => p.id)));
    }
  };

  const toggleSelect = (id: string) => {
    const next = new Set(selectedIds);
    if (next.has(id)) {
      next.delete(id);
    } else {
      next.add(id);
    }
    setSelectedIds(next);
  };

  const handleRestore = async (person: Person) => {
    setRestoreTarget(person);
    setRestoreDialogOpen(true);
  };

  const confirmRestore = async () => {
    if (!restoreTarget) return;
    setActionLoading(true);
    try {
      const res = await fetch(`/api/people/${restoreTarget.id}/restore`, {
        method: "POST",
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Error al restaurar");
      }
      toast.success(`"${restoreTarget.name}" restaurado correctamente`);
      setRestoreDialogOpen(false);
      setRestoreTarget(null);
      await fetchPeople(pagination.page);
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Error al restaurar"
      );
    } finally {
      setActionLoading(false);
    }
  };

  const handlePermanentDelete = async (person: Person) => {
    setPermanentDeleteTarget(person);
    setPermanentDeleteDialogOpen(true);
  };

  const confirmPermanentDelete = async () => {
    if (!permanentDeleteTarget) return;
    setActionLoading(true);
    try {
      const res = await fetch(
        `/api/people/${permanentDeleteTarget.id}/permanent`,
        { method: "DELETE" }
      );
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Error al eliminar");
      }
      toast.success(
        `"${permanentDeleteTarget.name}" eliminado definitivamente`
      );
      setPermanentDeleteDialogOpen(false);
      setPermanentDeleteTarget(null);
      await fetchPeople(pagination.page);
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Error al eliminar"
      );
    } finally {
      setActionLoading(false);
    }
  };

  const handleBulkRestore = () => {
    if (selectedIds.size === 0) return;
    setBulkRestoreDialogOpen(true);
  };

  const confirmBulkRestore = async () => {
    setActionLoading(true);
    let success = 0;
    let failed = 0;
    try {
      for (const id of selectedIds) {
        const res = await fetch(`/api/people/${id}/restore`, {
          method: "POST",
        });
        if (res.ok) {
          success++;
        } else {
          failed++;
        }
      }
      if (failed === 0) {
        toast.success(`${success} elemento(s) restaurado(s)`);
      } else {
        toast.warning(
          `${success} restaurado(s), ${failed} fallido(s)`
        );
      }
      setBulkRestoreDialogOpen(false);
      await fetchPeople(pagination.page);
    } catch {
      toast.error("Error al restaurar elementos");
    } finally {
      setActionLoading(false);
    }
  };

  const handleBulkDelete = () => {
    if (selectedIds.size === 0) return;
    setBulkDeleteDialogOpen(true);
  };

  const confirmBulkDelete = async () => {
    setActionLoading(true);
    let success = 0;
    let failed = 0;
    try {
      for (const id of selectedIds) {
        const res = await fetch(`/api/people/${id}/permanent`, {
          method: "DELETE",
        });
        if (res.ok) {
          success++;
        } else {
          failed++;
        }
      }
      if (failed === 0) {
        toast.success(`${success} elemento(s) eliminado(s)`);
      } else {
        toast.warning(
          `${success} eliminado(s), ${failed} fallido(s)`
        );
      }
      setBulkDeleteDialogOpen(false);
      await fetchPeople(pagination.page);
    } catch {
      toast.error("Error al eliminar elementos");
    } finally {
      setActionLoading(false);
    }
  };

  const goToPage = (page: number) => {
    if (page < 1 || page > pagination.totalPages) return;
    fetchPeople(page);
  };

  const allSelected = people.length > 0 && selectedIds.size === people.length;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-destructive/10">
            <Trash2 className="h-5 w-5 text-destructive" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Papelera</h1>
            <p className="text-sm text-muted-foreground">
              Elementos eliminados que pueden ser restaurados
            </p>
          </div>
          {pagination.total > 0 && (
            <Badge variant="destructive" className="ml-2">
              {pagination.total} eliminado{pagination.total !== 1 ? "s" : ""}
            </Badge>
          )}
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={() => fetchPeople(pagination.page)}
          disabled={loading}
        >
          <RefreshCcw
            className={cn("h-4 w-4", loading && "animate-spin")}
          />
          Actualizar
        </Button>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative w-full sm:max-w-xs">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Buscar en la papelera..."
            className="pl-10"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            onKeyDown={handleKeyDown}
          />
        </div>

        {selectedIds.size > 0 && (
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">
              {selectedIds.size} seleccionado{selectedIds.size !== 1 && "s"}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={handleBulkRestore}
              disabled={actionLoading}
            >
              <RotateCcw className="h-4 w-4" />
              Restaurar
            </Button>
            <Button
              variant="destructive"
              size="sm"
              onClick={handleBulkDelete}
              disabled={actionLoading}
            >
              <Trash2 className="h-4 w-4" />
              Eliminar
            </Button>
          </div>
        )}
      </div>

      <div className="rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-12">
                <Checkbox
                  checked={allSelected}
                  onCheckedChange={toggleSelectAll}
                  aria-label="Seleccionar todos"
                />
              </TableHead>
              <TableHead>Nombre</TableHead>
              <TableHead>IP</TableHead>
              <TableHead>MAC</TableHead>
              <TableHead>Equipo</TableHead>
              {admin?.role === "admin" && <TableHead>Clave</TableHead>}
              <TableHead>Departamento</TableHead>
              <TableHead>Eliminado el</TableHead>
              <TableHead className="w-12" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={admin?.role === "admin" ? 9 : 8}>
                  <TableSkeleton />
                </TableCell>
              </TableRow>
            ) : people.length === 0 ? (
              <TableRow>
                <TableCell colSpan={admin?.role === "admin" ? 9 : 8}>
                  <EmptyState />
                </TableCell>
              </TableRow>
            ) : (
              people.map((person) => (
                <TableRow
                  key={person.id}
                  className="opacity-70"
                  data-state={
                    selectedIds.has(person.id) ? "selected" : undefined
                  }
                >
                  <TableCell>
                    <Checkbox
                      checked={selectedIds.has(person.id)}
                      onCheckedChange={() => toggleSelect(person.id)}
                      aria-label={`Seleccionar ${person.name}`}
                    />
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{person.name}</span>
                      <Badge variant="destructive" className="text-[10px]">
                        Eliminado
                      </Badge>
                    </div>
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {person.ip || "-"}
                  </TableCell>
                  <TableCell className="font-mono text-xs text-muted-foreground">
                    {person.mac || "-"}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {person.computerName}
                  </TableCell>
                  {admin?.role === "admin" && (
                  <TableCell className="text-muted-foreground">
                    <TrashClaveCell value={person.clave} />
                  </TableCell>
                  )}
                  <TableCell className="text-muted-foreground">
                    {person.department.name}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {formatDate(person.deletedAt)}
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem
                          onClick={() => handleRestore(person)}
                        >
                          <RotateCcw className="h-4 w-4" />
                          Restaurar
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          className="text-destructive focus:text-destructive"
                          onClick={() => handlePermanentDelete(person)}
                        >
                          <Trash2 className="h-4 w-4" />
                          Eliminar definitivamente
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {pagination.totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Página {pagination.page} de {pagination.totalPages} (
            {pagination.total} resultado{pagination.total !== 1 ? "s" : ""})
          </p>
          <div className="flex items-center gap-1">
            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8"
              onClick={() => goToPage(pagination.page - 1)}
              disabled={pagination.page <= 1}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            {Array.from({ length: pagination.totalPages }, (_, i) => i + 1)
              .filter((p) => {
                if (p === 1 || p === pagination.totalPages) return true;
                if (Math.abs(p - pagination.page) <= 1) return true;
                return false;
              })
              .reduce<(number | "ellipsis")[]>((acc, p, idx, arr) => {
                if (idx > 0 && p - (arr[idx - 1] as number) > 1) {
                  acc.push("ellipsis");
                }
                acc.push(p);
                return acc;
              }, [])
              .map((item, idx) =>
                item === "ellipsis" ? (
                  <span
                    key={`e-${idx}`}
                    className="px-1 text-muted-foreground"
                  >
                    ...
                  </span>
                ) : (
                  <Button
                    key={item}
                    variant={
                      pagination.page === item ? "default" : "outline"
                    }
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => goToPage(item)}
                  >
                    {item}
                  </Button>
                )
              )}
            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8"
              onClick={() => goToPage(pagination.page + 1)}
              disabled={pagination.page >= pagination.totalPages}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

      <AlertDialog
        open={restoreDialogOpen}
        onOpenChange={setRestoreDialogOpen}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Restaurar elemento</AlertDialogTitle>
            <AlertDialogDescription>
              ¿Estás seguro de que deseas restaurar{" "}
              <strong>{restoreTarget?.name}</strong>? El registro volverá a
              aparecer en la lista de personas activas.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={actionLoading}>
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmRestore}
              disabled={actionLoading}
            >
              {actionLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <RotateCcw className="h-4 w-4" />
              )}
              Restaurar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog
        open={permanentDeleteDialogOpen}
        onOpenChange={setPermanentDeleteDialogOpen}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <div className="flex items-center gap-2 text-destructive">
              <AlertTriangle className="h-5 w-5" />
              <AlertDialogTitle>Eliminar definitivamente</AlertDialogTitle>
            </div>
            <AlertDialogDescription>
              ¿Estás seguro de que deseas eliminar permanentemente{" "}
              <strong>{permanentDeleteTarget?.name}</strong>? Esta acción no se
              puede deshacer y todos los datos asociados se perderán para siempre.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={actionLoading}>
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmPermanentDelete}
              disabled={actionLoading}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {actionLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Trash2 className="h-4 w-4" />
              )}
              Eliminar definitivamente
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog
        open={bulkRestoreDialogOpen}
        onOpenChange={setBulkRestoreDialogOpen}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Restaurar seleccionados</AlertDialogTitle>
            <AlertDialogDescription>
              ¿Estás seguro de que deseas restaurar{" "}
              <strong>{selectedIds.size} elemento(s)</strong>? Los registros
              volverán a aparecer en la lista de personas activas.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={actionLoading}>
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmBulkRestore}
              disabled={actionLoading}
            >
              {actionLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <RotateCcw className="h-4 w-4" />
              )}
              Restaurar {selectedIds.size}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog
        open={bulkDeleteDialogOpen}
        onOpenChange={setBulkDeleteDialogOpen}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <div className="flex items-center gap-2 text-destructive">
              <AlertTriangle className="h-5 w-5" />
              <AlertDialogTitle>Eliminar seleccionados</AlertDialogTitle>
            </div>
            <AlertDialogDescription>
              ¿Estás seguro de que deseas eliminar permanentemente{" "}
              <strong>{selectedIds.size} elemento(s)</strong>? Esta acción no se
              puede deshacer y todos los datos asociados se perderán para siempre.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={actionLoading}>
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmBulkDelete}
              disabled={actionLoading}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {actionLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Trash2 className="h-4 w-4" />
              )}
              Eliminar {selectedIds.size}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function TrashClaveCell({ value }: { value: string | null }) {
  const [visible, setVisible] = useState(false);
  if (!value) return <span>-</span>;
  return (
    <div className="flex items-center gap-1.5">
      <span className="font-mono text-xs">
        {visible ? value : "\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022"}
      </span>
      <button
        type="button"
        onClick={() => setVisible(!visible)}
        className="flex items-center justify-center h-5 w-5 rounded text-muted-foreground hover:text-foreground transition-colors"
        aria-label={visible ? "Ocultar clave" : "Mostrar clave"}
      >
        {visible ? (
          <EyeOff className="h-3.5 w-3.5" />
        ) : (
          <Eye className="h-3.5 w-3.5" />
        )}
      </button>
    </div>
  );
}
