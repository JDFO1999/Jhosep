"use client";

import { useState, useEffect, useCallback } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import {
  Building2,
  Plus,
  Search,
  MoreHorizontal,
  Pencil,
  Trash2,
  Loader2,
  RefreshCcw,
  ChevronLeft,
  ChevronRight,
  X,
  AlertTriangle,
  Users,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
import { departmentSchema, type DepartmentInput } from "@/lib/validations";

interface Department {
  id: string;
  name: string;
  createdAt: string;
  updatedAt: string;
  _count: { people: number };
}

interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

interface DepartmentsResponse {
  departments: Department[];
  pagination: Pagination;
}

type SortableField = "name" | "_count.people";

function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleDateString("es-CO", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
}

function EmptyState({ onAdd }: { onAdd: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
      <div className="flex h-20 w-20 items-center justify-center rounded-full bg-muted/50">
        <Building2 className="h-10 w-10" />
      </div>
      <h3 className="mt-4 text-lg font-semibold">No hay departamentos</h3>
      <p className="mt-1 text-sm">
        Crea tu primer departamento para comenzar
      </p>
      <Button className="mt-4" onClick={onAdd}>
        <Plus className="h-4 w-4" />
        Nuevo Departamento
      </Button>
    </div>
  );
}

function TableSkeleton() {
  return (
    <div className="space-y-2">
      {Array.from({ length: 8 }).map((_, i) => (
        <div key={i} className="flex items-center gap-4 px-4 py-3">
          <Skeleton className="h-4 w-40" />
          <Skeleton className="h-4 w-16" />
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-8 w-8 ml-auto" />
        </div>
      ))}
    </div>
  );
}

export default function DepartmentsPage() {
  const [departments, setDepartments] = useState<Department[]>([]);
  const [pagination, setPagination] = useState<Pagination>({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0,
  });
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [sortBy, setSortBy] = useState<SortableField>("name");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");
  const [actionLoading, setActionLoading] = useState(false);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingDepartment, setEditingDepartment] =
    useState<Department | null>(null);

  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Department | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<DepartmentInput>({
    defaultValues: { name: "" },
  });

  const fetchDepartments = useCallback(async () => {
    setLoading(true);
    try {
      const apiSortBy =
        sortBy === "_count.people" ? "people" : sortBy;
      const params = new URLSearchParams({
        page: String(pagination.page),
        limit: "10",
        sortBy: apiSortBy,
        sortOrder,
      });
      if (search) {
        params.set("search", search);
      }
      const res = await fetch(`/api/departments?${params.toString()}`);
      if (!res.ok) throw new Error("Error al cargar");
      const data: DepartmentsResponse = await res.json();
      setDepartments(data.departments);
      setPagination(data.pagination);
    } catch {
      toast.error("Error al cargar departamentos");
    } finally {
      setLoading(false);
    }
  }, [pagination.page, search, sortBy, sortOrder]);

  useEffect(() => {
    fetchDepartments();
  }, [fetchDepartments]);

  const handleSearch = () => {
    setPagination((prev) => ({ ...prev, page: 1 }));
    setSearch(searchInput);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleSearch();
    }
  };

  const clearSearch = () => {
    setSearchInput("");
    setSearch("");
    setPagination((prev) => ({ ...prev, page: 1 }));
  };

  const handleSort = (field: SortableField) => {
    if (sortBy === field) {
      setSortOrder((prev) => (prev === "asc" ? "desc" : "asc"));
    } else {
      setSortBy(field);
      setSortOrder("asc");
    }
    setPagination((prev) => ({ ...prev, page: 1 }));
  };

  const openCreateDialog = () => {
    setEditingDepartment(null);
    reset({ name: "" });
    setDialogOpen(true);
  };

  const openEditDialog = (department: Department) => {
    setEditingDepartment(department);
    setValue("name", department.name);
    setDialogOpen(true);
  };

  const handleFormSubmit = async (data: DepartmentInput) => {
    setActionLoading(true);
    try {
      if (editingDepartment) {
        const res = await fetch(
          `/api/departments/${editingDepartment.id}`,
          {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(data),
          }
        );
        if (!res.ok) {
          const err = await res.json();
          if (res.status === 409) {
            setError("name", {
              message: "El departamento ya existe",
            });
            return;
          }
          throw new Error(err.error || "Error al actualizar");
        }
        toast.success("Departamento actualizado correctamente");
      } else {
        const res = await fetch("/api/departments", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(data),
        });
        if (!res.ok) {
          const err = await res.json();
          if (res.status === 409) {
            setError("name", {
              message: "El departamento ya existe",
            });
            return;
          }
          throw new Error(err.error || "Error al crear");
        }
        toast.success("Departamento creado correctamente");
      }
      setDialogOpen(false);
      setEditingDepartment(null);
      reset({ name: "" });
      await fetchDepartments();
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Error inesperado"
      );
    } finally {
      setActionLoading(false);
    }
  };

  const handleDelete = (department: Department) => {
    setDeleteTarget(department);
    setDeleteError(null);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    setActionLoading(true);
    setDeleteError(null);
    try {
      const res = await fetch(`/api/departments/${deleteTarget.id}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        const err = await res.json();
        setDeleteError(
          err.error || "No se puede eliminar el departamento"
        );
        return;
      }
      toast.success(
        `"${deleteTarget.name}" eliminado correctamente`
      );
      setDeleteDialogOpen(false);
      setDeleteTarget(null);
      await fetchDepartments();
    } catch {
      toast.error("Error al eliminar departamento");
    } finally {
      setActionLoading(false);
    }
  };

  const goToPage = (page: number) => {
    if (page < 1 || page > pagination.totalPages) return;
    setPagination((prev) => ({ ...prev, page }));
  };

  const SortIcon = ({ field }: { field: SortableField }) => {
    if (sortBy !== field) {
      return <ArrowUpDown className="h-3.5 w-3.5 text-muted-foreground/50" />;
    }
    return sortOrder === "asc" ? (
      <ArrowUp className="h-3.5 w-3.5" />
    ) : (
      <ArrowDown className="h-3.5 w-3.5" />
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
            <Building2 className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">
              Departamentos
            </h1>
            <p className="text-sm text-muted-foreground">
              {pagination.total > 0
                ? `${pagination.total} departamento${pagination.total !== 1 ? "s" : ""} registrado${pagination.total !== 1 ? "s" : ""}`
                : "Gestiona los departamentos del sistema"}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => fetchDepartments()}
            disabled={loading}
          >
            <RefreshCcw
              className={cn("h-4 w-4", loading && "animate-spin")}
            />
            Actualizar
          </Button>
          <Button onClick={openCreateDialog}>
            <Plus className="h-4 w-4" />
            Nuevo Departamento
          </Button>
        </div>
      </div>

      <div className="relative w-full sm:max-w-xs">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Buscar departamento..."
          className={cn("pl-10", searchInput && "pr-10")}
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          onKeyDown={handleKeyDown}
          onBlur={() => {
            if (searchInput !== search) handleSearch();
          }}
        />
        {searchInput && (
          <Button
            variant="ghost"
            size="icon"
            className="absolute right-1 top-1/2 h-7 w-7 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            onClick={clearSearch}
          >
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>

      <div className="rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>
                <button
                  type="button"
                  className="inline-flex items-center gap-1 font-medium text-muted-foreground hover:text-foreground transition-colors"
                  onClick={() => handleSort("name")}
                >
                  Nombre
                  <SortIcon field="name" />
                </button>
              </TableHead>
              <TableHead>
                <button
                  type="button"
                  className="inline-flex items-center gap-1 font-medium text-muted-foreground hover:text-foreground transition-colors"
                  onClick={() => handleSort("_count.people")}
                >
                  Personas
                  <SortIcon field="_count.people" />
                </button>
              </TableHead>
              <TableHead className="hidden sm:table-cell">Creado</TableHead>
              <TableHead className="w-12" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={4}>
                  <TableSkeleton />
                </TableCell>
              </TableRow>
            ) : departments.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4}>
                  <EmptyState onAdd={openCreateDialog} />
                </TableCell>
              </TableRow>
            ) : (
              departments.map((department) => (
                <TableRow key={department.id}>
                  <TableCell className="font-medium">
                    {department.name}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1.5">
                      <Users className="h-4 w-4 text-muted-foreground" />
                      <span>{department._count.people}</span>
                    </div>
                  </TableCell>
                  <TableCell className="hidden text-muted-foreground sm:table-cell">
                    {formatDate(department.createdAt)}
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                        >
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem
                          onClick={() => openEditDialog(department)}
                        >
                          <Pencil className="h-4 w-4" />
                          Editar
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          className="text-destructive focus:text-destructive"
                          onClick={() => handleDelete(department)}
                        >
                          <Trash2 className="h-4 w-4" />
                          Eliminar
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
            {Array.from(
              { length: pagination.totalPages },
              (_, i) => i + 1
            )
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

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingDepartment
                ? "Editar Departamento"
                : "Nuevo Departamento"}
            </DialogTitle>
            <DialogDescription>
              {editingDepartment
                ? "Modifica el nombre del departamento."
                : "Crea un nuevo departamento para organizar el personal."}
            </DialogDescription>
          </DialogHeader>
          <form
            onSubmit={handleSubmit(handleFormSubmit)}
            className="space-y-4"
          >
            <div className="space-y-2">
              <Label htmlFor="name">Nombre</Label>
              <Input
                id="name"
                placeholder="Ej: Sistemas, RRHH..."
                className={cn(
                  errors.name &&
                    "border-destructive focus-visible:ring-destructive"
                )}
                {...register("name")}
              />
              {errors.name && (
                <p className="flex items-center gap-1.5 text-xs text-destructive">
                  <AlertTriangle className="h-3.5 w-3.5" />
                  {errors.name.message}
                </p>
              )}
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setDialogOpen(false)}
                disabled={isSubmitting}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={isSubmitting || actionLoading}>
                {isSubmitting || actionLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : null}
                {editingDepartment ? "Guardar cambios" : "Crear"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <AlertDialog
        open={deleteDialogOpen}
        onOpenChange={(open) => {
          if (!open) {
            setDeleteError(null);
          }
          setDeleteDialogOpen(open);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <div className="flex items-center gap-2 text-destructive">
              <AlertTriangle className="h-5 w-5" />
              <AlertDialogTitle>Eliminar departamento</AlertDialogTitle>
            </div>
            <AlertDialogDescription>
              ¿Estás seguro de que deseas eliminar{" "}
              <strong>{deleteTarget?.name}</strong>?
              {deleteTarget && deleteTarget._count.people > 0 && (
                <span className="mt-1 block text-destructive">
                  Este departamento tiene {deleteTarget._count.people} persona
                  {deleteTarget._count.people !== 1 ? "s" : ""} asociada
                  {deleteTarget._count.people !== 1 ? "s" : ""}. No se puede
                  eliminar mientras tenga personas vinculadas.
                </span>
              )}
            </AlertDialogDescription>
            {deleteError && (
              <div className="flex items-start gap-2 rounded-md bg-destructive/10 p-3 text-sm text-destructive">
                <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
                <span>{deleteError}</span>
              </div>
            )}
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={actionLoading}>
              Cancelar
            </AlertDialogCancel>
            {!deleteError && (
              <AlertDialogAction
                onClick={confirmDelete}
                disabled={actionLoading}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                {actionLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Trash2 className="h-4 w-4" />
                )}
                Eliminar
              </AlertDialogAction>
            )}
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
