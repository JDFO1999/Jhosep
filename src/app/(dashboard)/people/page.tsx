"use client";

import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  getPaginationRowModel,
  getFilteredRowModel,
  flexRender,
  createColumnHelper,
  type SortingState,
  type ColumnFiltersState,
  type VisibilityState,
  type RowSelectionState,
  type PaginationState,
} from "@tanstack/react-table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogTrigger,
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";
import { personSchema, type PersonInput } from "@/lib/validations";
import {
  Search,
  Plus,
  Filter,
  X,
  ChevronLeft,
  ChevronRight,
  MoreHorizontal,
  Copy,
  Pencil,
  Trash2,
  RotateCcw,
  Loader2,
  CopyCheck,
  Users,
  Monitor,
  Calendar,
  Building2,
  SlidersHorizontal,
  Columns,
  ArrowUpDown,
  ChevronsUpDown,
  ShieldAlert,
  Trash,
  RefreshCw,
  Check,
  AlertTriangle,
  ChevronDown,
  ChevronUp,
} from "lucide-react";

interface Person {
  id: string;
  name: string;
  ip: string | null;
  mac: string | null;
  computerName: string;
  departmentId: string;
  isDeleted: boolean;
  deletedAt: string | null;
  createdAt: string;
  updatedAt: string;
  department: {
    id: string;
    name: string;
  };
}

interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

interface PeopleResponse {
  people: Person[];
  pagination: PaginationMeta;
}

interface Department {
  id: string;
  name: string;
  _count?: { people: number };
}

interface Filters {
  search: string;
  department: string;
  status: "active" | "deleted" | "all";
  dateFrom: string;
  dateTo: string;
}

const PAGE_SIZES = [10, 20, 50, 100] as const;

const MAC_REGEX =
  /^([0-9A-Fa-f]{2}[:-]){5}([0-9A-Fa-f]{2})$/;

function formatDate(dateStr: string): string {
  const d = new Date(dateStr);
  return d.toLocaleDateString("es-CO", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
}

function formatMac(mac: string | null): string {
  if (!mac) return "—";
  const cleaned = mac.replace(/[^0-9A-Fa-f]/g, "");
  if (cleaned.length !== 12) return mac;
  return cleaned.match(/.{1,2}/g)?.join(":").toUpperCase() ?? mac;
}

const columnHelper = createColumnHelper<Person>();

interface ExtendedColumnMeta {
  label: string;
}

export default function PeoplePage() {
  const [people, setPeople] = useState<Person[]>([]);
  const [pagination, setPagination] = useState<PaginationMeta>({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0,
  });
  const [loading, setLoading] = useState(true);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [filters, setFilters] = useState<Filters>({
    search: "",
    department: "",
    status: "active",
    dateFrom: "",
    dateTo: "",
  });
  const [sorting, setSorting] = useState<SortingState>([]);
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({});
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});
  const [filterOpen, setFilterOpen] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingPerson, setEditingPerson] = useState<Person | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Person | null>(null);
  const [permanentDeleteTarget, setPermanentDeleteTarget] =
    useState<Person | null>(null);
  const [restoreTarget, setRestoreTarget] = useState<Person | null>(null);
  const [copiedField, setCopiedField] = useState<string | null>(null);

  const searchTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (filters.department) count++;
    if (filters.status !== "active") count++;
    if (filters.dateFrom) count++;
    if (filters.dateTo) count++;
    return count;
  }, [filters]);

  const fetchPeople = useCallback(async () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    const controller = new AbortController();
    abortControllerRef.current = controller;

    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filters.search) params.set("search", filters.search);
      if (filters.department) params.set("department", filters.department);
      if (filters.status !== "all") params.set("status", filters.status);
      if (filters.dateFrom) params.set("dateFrom", filters.dateFrom);
      if (filters.dateTo) params.set("dateTo", filters.dateTo);
      params.set("page", String(pagination.page));
      params.set("limit", String(pagination.limit));
      if (sorting.length > 0) {
        params.set("sortBy", sorting[0].id);
        params.set("sortOrder", sorting[0].desc ? "desc" : "asc");
      }

      const res = await fetch(`/api/people?${params.toString()}`, {
        signal: controller.signal,
      });

      if (!res.ok) throw new Error("Error al cargar");

      const data: PeopleResponse = await res.json();
      setPeople(data.people);
      setPagination(data.pagination);
    } catch (err: unknown) {
      if (err instanceof DOMException && err.name === "AbortError") return;
      toast.error("Error al cargar registros");
    } finally {
      if (!controller.signal.aborted) {
        setLoading(false);
      }
    }
  }, [filters, pagination.page, pagination.limit, sorting]);

  const fetchDepartments = useCallback(async () => {
    try {
      const res = await fetch("/api/departments?limit=100");
      if (!res.ok) return;
      const data = await res.json();
      setDepartments(data.departments ?? []);
    } catch {
      // silently fail
    }
  }, []);

  useEffect(() => {
    fetchDepartments();
  }, [fetchDepartments]);

  useEffect(() => {
    fetchPeople();
  }, [fetchPeople]);

  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, []);

  const handleSearchChange = (value: string) => {
    setFilters((prev) => ({ ...prev, search: value }));
    if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
    searchTimeoutRef.current = setTimeout(() => {
      setPagination((prev) => ({ ...prev, page: 1 }));
    }, 300);
  };

  useEffect(() => {
    if (filters.search === "") {
      if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
      setPagination((prev) =>
        prev.page === 1 ? prev : { ...prev, page: 1 }
      );
    }
  }, [filters.search]);

  const clearFilters = () => {
    setFilters({
      search: filters.search,
      department: "",
      status: "active",
      dateFrom: "",
      dateTo: "",
    });
    setPagination((prev) => ({ ...prev, page: 1 }));
  };

  const handleDialogOpen = (person?: Person) => {
    setEditingPerson(person ?? null);
    setDialogOpen(true);
  };

  const handleDialogClose = () => {
    setDialogOpen(false);
    setEditingPerson(null);
  };

  const handleCreate = async (data: PersonInput) => {
    setSubmitting(true);
    try {
      const res = await fetch("/api/people", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Error al crear");
      }
      toast.success("Persona creada correctamente");
      handleDialogClose();
      fetchPeople();
    } catch (err: unknown) {
      toast.error(
        err instanceof Error ? err.message : "Error al crear registro"
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdate = async (data: PersonInput) => {
    if (!editingPerson) return;
    setSubmitting(true);
    try {
      const res = await fetch(`/api/people/${editingPerson.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Error al actualizar");
      }
      toast.success("Persona actualizada correctamente");
      handleDialogClose();
      fetchPeople();
    } catch (err: unknown) {
      toast.error(
        err instanceof Error ? err.message : "Error al actualizar registro"
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handleSoftDelete = async (person: Person) => {
    try {
      const res = await fetch(`/api/people/${person.id}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Error al eliminar");
      }
      toast.success("Persona eliminada (papelera)");
      setDeleteTarget(null);
      setRowSelection({});
      fetchPeople();
    } catch (err: unknown) {
      toast.error(
        err instanceof Error ? err.message : "Error al eliminar registro"
      );
    }
  };

  const handlePermanentDelete = async (person: Person) => {
    try {
      const res = await fetch(`/api/people/${person.id}/permanent`, {
        method: "DELETE",
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Error al eliminar");
      }
      toast.success("Eliminación definitiva completada");
      setPermanentDeleteTarget(null);
      setRowSelection({});
      fetchPeople();
    } catch (err: unknown) {
      toast.error(
        err instanceof Error
          ? err.message
          : "Error al eliminar definitivamente"
      );
    }
  };

  const handleRestore = async (person: Person) => {
    try {
      const res = await fetch(`/api/people/${person.id}/restore`, {
        method: "POST",
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Error al restaurar");
      }
      toast.success("Persona restaurada");
      setRestoreTarget(null);
      fetchPeople();
    } catch (err: unknown) {
      toast.error(
        err instanceof Error ? err.message : "Error al restaurar registro"
      );
    }
  };

  const handleBulkDelete = async () => {
    const selectedIds = Object.keys(rowSelection)
      .filter((k) => rowSelection[k])
      .map((idx) => people[parseInt(idx)]?.id)
      .filter(Boolean);

    if (selectedIds.length === 0) return;

    let successCount = 0;
    for (const id of selectedIds) {
      try {
        const res = await fetch(`/api/people/${id}`, { method: "DELETE" });
        if (res.ok) successCount++;
      } catch {
        // continue
      }
    }

    toast.success(`${successCount} persona(s) eliminada(s)`);
    setRowSelection({});
    fetchPeople();
  };

  const copyToClipboard = async (text: string, label: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedField(label);
      toast.success(`${label} copiada`);
      setTimeout(() => setCopiedField(null), 2000);
    } catch {
      toast.error("Error al copiar");
    }
  };

  const selectedCount = Object.values(rowSelection).filter(Boolean).length;

  const columns = useMemo(
    () => [
      columnHelper.display({
        id: "select",
        header: ({ table }) => (
          <Checkbox
            checked={table.getIsAllPageRowsSelected()}
            onCheckedChange={(value) =>
              table.toggleAllPageRowsSelected(!!value)
            }
            aria-label="Seleccionar todos"
          />
        ),
        cell: ({ row }) => (
          <Checkbox
            checked={row.getIsSelected()}
            onCheckedChange={(value) => row.toggleSelected(!!value)}
            aria-label={`Seleccionar ${row.original.name}`}
          />
        ),
        enableSorting: false,
        size: 48,
      }),
      columnHelper.accessor("name", {
        header: ({ column }) => (
          <button
            className="inline-flex items-center gap-1.5 hover:text-foreground"
            onClick={() => column.toggleSorting()}
          >
            Nombre
            {column.getIsSorted() === "asc" ? (
              <ChevronUp className="h-3.5 w-3.5" />
            ) : column.getIsSorted() === "desc" ? (
              <ChevronDown className="h-3.5 w-3.5" />
            ) : (
              <ArrowUpDown className="h-3.5 w-3.5 text-muted-foreground/60" />
            )}
          </button>
        ),
        cell: ({ row }) => (
          <div
            className={cn(
              "font-medium",
              row.original.isDeleted && "text-muted-foreground"
            )}
          >
            {row.original.name}
          </div>
        ),
        meta: { label: "Nombre" } as ExtendedColumnMeta,
      }),
      columnHelper.accessor("ip", {
        header: ({ column }) => (
          <button
            className="inline-flex items-center gap-1.5 hover:text-foreground"
            onClick={() => column.toggleSorting()}
          >
            IP
            {column.getIsSorted() === "asc" ? (
              <ChevronUp className="h-3.5 w-3.5" />
            ) : column.getIsSorted() === "desc" ? (
              <ChevronDown className="h-3.5 w-3.5" />
            ) : (
              <ArrowUpDown className="h-3.5 w-3.5 text-muted-foreground/60" />
            )}
          </button>
        ),
        cell: ({ getValue }) => (
          <span
            className={cn(
              "font-mono text-xs",
              !getValue() && "text-muted-foreground"
            )}
          >
            {getValue() || "—"}
          </span>
        ),
        meta: { label: "IP" } as ExtendedColumnMeta,
      }),
      columnHelper.accessor("mac", {
        header: ({ column }) => (
          <button
            className="inline-flex items-center gap-1.5 hover:text-foreground"
            onClick={() => column.toggleSorting()}
          >
            MAC
            {column.getIsSorted() === "asc" ? (
              <ChevronUp className="h-3.5 w-3.5" />
            ) : column.getIsSorted() === "desc" ? (
              <ChevronDown className="h-3.5 w-3.5" />
            ) : (
              <ArrowUpDown className="h-3.5 w-3.5 text-muted-foreground/60" />
            )}
          </button>
        ),
        cell: ({ getValue }) => (
          <span
            className={cn(
              "font-mono text-xs",
              !getValue() && "text-muted-foreground"
            )}
          >
            {formatMac(getValue())}
          </span>
        ),
        meta: { label: "MAC" } as ExtendedColumnMeta,
      }),
      columnHelper.accessor("computerName", {
        header: ({ column }) => (
          <button
            className="inline-flex items-center gap-1.5 hover:text-foreground"
            onClick={() => column.toggleSorting()}
          >
            Equipo
            {column.getIsSorted() === "asc" ? (
              <ChevronUp className="h-3.5 w-3.5" />
            ) : column.getIsSorted() === "desc" ? (
              <ChevronDown className="h-3.5 w-3.5" />
            ) : (
              <ArrowUpDown className="h-3.5 w-3.5 text-muted-foreground/60" />
            )}
          </button>
        ),
        cell: ({ getValue }) => (
          <span className="text-sm">{getValue()}</span>
        ),
        meta: { label: "Equipo" } as ExtendedColumnMeta,
      }),
      columnHelper.accessor("department.name", {
        id: "department",
        header: ({ column }) => (
          <button
            className="inline-flex items-center gap-1.5 hover:text-foreground"
            onClick={() => column.toggleSorting()}
          >
            Departamento
            {column.getIsSorted() === "asc" ? (
              <ChevronUp className="h-3.5 w-3.5" />
            ) : column.getIsSorted() === "desc" ? (
              <ChevronDown className="h-3.5 w-3.5" />
            ) : (
              <ArrowUpDown className="h-3.5 w-3.5 text-muted-foreground/60" />
            )}
          </button>
        ),
        cell: ({ row }) =>
          row.original.isDeleted ? (
            <Badge variant="destructive">Eliminado</Badge>
          ) : (
            <Badge variant="outline">
              {row.original.department?.name ?? "—"}
            </Badge>
          ),
        meta: { label: "Departamento" } as ExtendedColumnMeta,
      }),
      columnHelper.accessor("createdAt", {
        header: ({ column }) => (
          <button
            className="inline-flex items-center gap-1.5 hover:text-foreground"
            onClick={() => column.toggleSorting()}
          >
            Creado
            {column.getIsSorted() === "asc" ? (
              <ChevronUp className="h-3.5 w-3.5" />
            ) : column.getIsSorted() === "desc" ? (
              <ChevronDown className="h-3.5 w-3.5" />
            ) : (
              <ArrowUpDown className="h-3.5 w-3.5 text-muted-foreground/60" />
            )}
          </button>
        ),
        cell: ({ getValue }) => (
          <span className="text-xs text-muted-foreground whitespace-nowrap">
            {formatDate(getValue())}
          </span>
        ),
        meta: { label: "Creado" } as ExtendedColumnMeta,
      }),
      columnHelper.display({
        id: "actions",
        header: () => <span className="sr-only">Acciones</span>,
        cell: ({ row }) => {
          const person = row.original;
          return (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  aria-label="Abrir menú de acciones"
                >
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                {person.ip && (
                  <DropdownMenuItem
                    onClick={() => copyToClipboard(person.ip!, "IP")}
                  >
                    {copiedField === "IP" ? (
                      <CopyCheck className="h-4 w-4 text-emerald-500" />
                    ) : (
                      <Copy className="h-4 w-4" />
                    )}
                    Copiar IP
                  </DropdownMenuItem>
                )}
                {person.mac && (
                  <DropdownMenuItem
                    onClick={() =>
                      copyToClipboard(formatMac(person.mac!), "MAC")
                    }
                  >
                    {copiedField === "MAC" ? (
                      <CopyCheck className="h-4 w-4 text-emerald-500" />
                    ) : (
                      <Copy className="h-4 w-4" />
                    )}
                    Copiar MAC
                  </DropdownMenuItem>
                )}
                <DropdownMenuItem
                  onClick={() =>
                    copyToClipboard(person.computerName, "Equipo")
                  }
                >
                  {copiedField === "Equipo" ? (
                    <CopyCheck className="h-4 w-4 text-emerald-500" />
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                  Copiar Equipo
                </DropdownMenuItem>
                {(person.ip || person.mac) && <DropdownMenuSeparator />}
                {!person.isDeleted ? (
                  <>
                    <DropdownMenuItem
                      onClick={() => handleDialogOpen(person)}
                    >
                      <Pencil className="h-4 w-4" />
                      Editar
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      onClick={() => setDeleteTarget(person)}
                      className="text-destructive focus:text-destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                      Eliminar
                    </DropdownMenuItem>
                  </>
                ) : (
                  <>
                    <DropdownMenuItem
                      onClick={() => setRestoreTarget(person)}
                    >
                      <RotateCcw className="h-4 w-4" />
                      Restaurar
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      onClick={() => setPermanentDeleteTarget(person)}
                      className="text-destructive focus:text-destructive"
                    >
                      <Trash className="h-4 w-4" />
                      Eliminar definitivamente
                    </DropdownMenuItem>
                  </>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          );
        },
        enableSorting: false,
        size: 48,
      }),
    ],
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [copiedField]
  );

  const table = useReactTable({
    data: people,
    columns,
    state: {
      sorting,
      rowSelection,
      columnVisibility,
      pagination: {
        pageIndex: pagination.page - 1,
        pageSize: pagination.limit,
      },
    },
    pageCount: pagination.totalPages,
    manualPagination: true,
    manualSorting: true,
    enableRowSelection: true,
    onSortingChange: setSorting,
    onRowSelectionChange: setRowSelection,
    onColumnVisibilityChange: setColumnVisibility,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
  });

  const handlePageChange = (newPage: number) => {
    setPagination((prev) => ({
      ...prev,
      page: Math.max(1, Math.min(newPage, prev.totalPages)),
    }));
  };

  const handlePageSizeChange = (size: number) => {
    setPagination((prev) => ({ ...prev, limit: size, page: 1 }));
    setRowSelection({});
  };

  const from = pagination.total === 0 ? 0 : (pagination.page - 1) * pagination.limit + 1;
  const to = Math.min(pagination.page * pagination.limit, pagination.total);

  const visibleColumns = table
    .getAllLeafColumns()
    .filter((col) => col.getIsVisible() && col.id !== "select" && col.id !== "actions");

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <h1 className="text-xl sm:text-2xl font-bold tracking-tight">
          Personas
        </h1>
      </div>

      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
          <Input
            placeholder="Buscar por nombre, IP, MAC, equipo o departamento..."
            value={filters.search}
            onChange={(e) => handleSearchChange(e.target.value)}
            className="pl-9 pr-8"
          />
          {filters.search && (
            <button
              type="button"
              onClick={() => handleSearchChange("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
              aria-label="Limpiar búsqueda"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="default"
            className={cn(
              "relative gap-2",
              filterOpen && "bg-accent text-accent-foreground"
            )}
            onClick={() => setFilterOpen(!filterOpen)}
          >
            <Filter className="h-4 w-4" />
            Filtros
            {activeFilterCount > 0 && (
              <span className="absolute -top-1.5 -right-1.5 flex items-center justify-center h-5 min-w-5 px-1 rounded-full bg-primary text-primary-foreground text-[11px] font-bold leading-none">
                {activeFilterCount}
              </span>
            )}
          </Button>

          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" size="default" className="gap-2">
                <Columns className="h-4 w-4" />
                Columnas
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-56" align="end">
              <div className="flex flex-col gap-2">
                <p className="text-sm font-medium">Mostrar columnas</p>
                <Separator />
                {visibleColumns.map((col) => {
                  const meta = (col.columnDef.meta as ExtendedColumnMeta | undefined);
                  const label = meta?.label ?? col.id;
                  return (
                    <label
                      key={col.id}
                      className="flex items-center gap-2 text-sm cursor-pointer py-1"
                    >
                      <Checkbox
                        checked={col.getIsVisible()}
                        onCheckedChange={(value) =>
                          col.toggleVisibility(!!value)
                        }
                      />
                      {label}
                    </label>
                  );
                })}
              </div>
            </PopoverContent>
          </Popover>

          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button
                onClick={() => handleDialogOpen()}
                className="gap-2"
              >
                <Plus className="h-4 w-4" />
                <span className="hidden sm:inline">Nueva Persona</span>
                <span className="sm:hidden">Nuevo</span>
              </Button>
            </DialogTrigger>
            <PersonFormDialog
              open={dialogOpen}
              person={editingPerson}
              departments={departments}
              submitting={submitting}
              onSubmit={editingPerson ? handleUpdate : handleCreate}
              onClose={handleDialogClose}
            />
          </Dialog>
        </div>
      </div>

      {filterOpen && (
        <FilterPanel
          departments={departments}
          filters={filters}
          onFiltersChange={(newFilters) => {
            setFilters((prev) => ({ ...prev, ...newFilters }));
            setPagination((prev) => ({ ...prev, page: 1 }));
          }}
          onClear={clearFilters}
          activeCount={activeFilterCount}
        />
      )}

      {selectedCount > 0 && (
        <Card className="border-primary/30 bg-primary/5">
          <CardContent className="flex items-center justify-between py-3 px-4">
            <span className="text-sm font-medium">
              {selectedCount} seleccionada{selectedCount !== 1 ? "s" : ""}
            </span>
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setRowSelection({})}
              >
                Cancelar
              </Button>
              <Button
                variant="destructive"
                size="sm"
                onClick={handleBulkDelete}
                className="gap-1.5"
              >
                <Trash2 className="h-3.5 w-3.5" />
                Eliminar seleccionados
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              {table.getHeaderGroups().map((headerGroup) => (
                <TableRow key={headerGroup.id}>
                  {headerGroup.headers.map((header) => (
                    <TableHead
                      key={header.id}
                      style={{
                        width:
                          header.column.id === "select" ||
                          header.column.id === "actions"
                            ? 48
                            : undefined,
                      }}
                      className={cn(
                        header.column.id === "select" && "w-[48px]",
                        header.column.id === "actions" && "w-[48px] text-right"
                      )}
                    >
                      {header.isPlaceholder
                        ? null
                        : flexRender(
                            header.column.columnDef.header,
                            header.getContext()
                          )}
                    </TableHead>
                  ))}
                </TableRow>
              ))}
            </TableHeader>
            <TableBody>
              {loading ? (
                Array.from({ length: pagination.limit }).map((_, i) => (
                  <TableRow key={`skel-${i}`}>
                    <TableCell>
                      <Skeleton className="h-4 w-4" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-4 w-32" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-4 w-28" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-4 w-36" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-4 w-24" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-5 w-20 rounded-full" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-4 w-20" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-8 w-8 rounded-md ml-auto" />
                    </TableCell>
                  </TableRow>
                ))
              ) : table.getRowModel().rows.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={columns.length}
                    className="h-48 text-center"
                  >
                    <EmptyState
                      hasFilters={activeFilterCount > 0 || !!filters.search}
                      onClear={clearFilters}
                    />
                  </TableCell>
                </TableRow>
              ) : (
                table.getRowModel().rows.map((row) => (
                  <TableRow
                    key={row.id}
                    data-state={row.getIsSelected() ? "selected" : undefined}
                    className={cn(
                      row.original.isDeleted &&
                        "opacity-60 bg-muted/30"
                    )}
                  >
                    {row.getVisibleCells().map((cell) => (
                      <TableCell
                        key={cell.id}
                        className={cn(
                          cell.column.id === "actions" && "text-right"
                        )}
                      >
                        {flexRender(
                          cell.column.columnDef.cell,
                          cell.getContext()
                        )}
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        {!loading && pagination.total > 0 && (
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-4 py-3 border-t">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <span>Filas por página:</span>
              <Select
                value={String(pagination.limit)}
                onValueChange={(v) => handlePageSizeChange(Number(v))}
              >
                <SelectTrigger className="h-8 w-[72px] text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent align="start">
                  {PAGE_SIZES.map((size) => (
                    <SelectItem key={size} value={String(size)}>
                      {size}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="text-sm text-muted-foreground">
              {pagination.total > 0
                ? `Mostrando ${from} a ${to} de ${pagination.total}`
                : "Sin resultados"}
            </div>

            <div className="flex items-center gap-1.5">
              <Button
                variant="outline"
                size="sm"
                className="h-8 px-2"
                disabled={pagination.page <= 1}
                onClick={() => handlePageChange(pagination.page - 1)}
              >
                <ChevronLeft className="h-4 w-4" />
                <span className="hidden sm:inline ml-1">Anterior</span>
              </Button>

              <div className="hidden sm:flex items-center gap-1">
                {generatePageNumbers(
                  pagination.page,
                  pagination.totalPages
                ).map((pageNum, idx) =>
                  pageNum === null ? (
                    <span
                      key={`ellipsis-${idx}`}
                      className="px-1 text-muted-foreground text-sm"
                    >
                      ...
                    </span>
                  ) : (
                    <Button
                      key={pageNum}
                      variant={
                        pageNum === pagination.page ? "default" : "outline"
                      }
                      size="sm"
                      className="h-8 w-8 p-0 text-xs"
                      onClick={() => handlePageChange(pageNum)}
                    >
                      {pageNum}
                    </Button>
                  )
                )}
              </div>

              <span className="sm:hidden text-sm font-medium px-2">
                {pagination.page} / {pagination.totalPages}
              </span>

              <Button
                variant="outline"
                size="sm"
                className="h-8 px-2"
                disabled={pagination.page >= pagination.totalPages}
                onClick={() => handlePageChange(pagination.page + 1)}
              >
                <span className="hidden sm:inline mr-1">Siguiente</span>
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
      </Card>

      <AlertDialog
        open={!!deleteTarget}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <Trash2 className="h-5 w-5 text-destructive" />
              ¿Eliminar {deleteTarget?.name}?
            </AlertDialogTitle>
            <AlertDialogDescription>
              Se enviará a la papelera. Podrá restaurarlo después si lo necesita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteTarget && handleSoftDelete(deleteTarget)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog
        open={!!permanentDeleteTarget}
        onOpenChange={(open) => !open && setPermanentDeleteTarget(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <ShieldAlert className="h-5 w-5 text-destructive" />
              ¿Eliminar definitivamente {permanentDeleteTarget?.name}?
            </AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer. El registro se eliminará de forma permanente.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() =>
                permanentDeleteTarget &&
                handlePermanentDelete(permanentDeleteTarget)
              }
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Eliminar definitivamente
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog
        open={!!restoreTarget}
        onOpenChange={(open) => !open && setRestoreTarget(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <RotateCcw className="h-5 w-5" />
              ¿Restaurar {restoreTarget?.name}?
            </AlertDialogTitle>
            <AlertDialogDescription>
              El registro volverá a estar activo en el listado principal.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => restoreTarget && handleRestore(restoreTarget)}
            >
              Restaurar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function FilterPanel({
  departments,
  filters,
  onFiltersChange,
  onClear,
  activeCount,
}: {
  departments: Department[];
  filters: Filters;
  onFiltersChange: (filters: Partial<Filters>) => void;
  onClear: () => void;
  activeCount: number;
}) {
  return (
    <Card className="animate-in fade-in slide-in-from-top-2 duration-200">
      <CardContent className="pt-4 pb-3 px-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-end gap-3 flex-wrap">
          <div className="flex-1 min-w-[180px] max-w-[240px]">
            <Label htmlFor="filter-department" className="text-xs mb-1.5 block">
              <Building2 className="h-3.5 w-3.5 inline mr-1" />
              Departamento
            </Label>
            <Select
              value={filters.department}
              onValueChange={(v) =>
                onFiltersChange({ department: v === "all" ? "" : v })
              }
            >
              <SelectTrigger id="filter-department" className="h-9 text-sm">
                <SelectValue placeholder="Todos los departamentos" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los departamentos</SelectItem>
                {departments.map((dep) => (
                  <SelectItem key={dep.id} value={dep.id}>
                    {dep.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="min-w-[140px]">
            <Label htmlFor="filter-status" className="text-xs mb-1.5 block">
              <SlidersHorizontal className="h-3.5 w-3.5 inline mr-1" />
              Estado
            </Label>
            <Select
              value={filters.status}
              onValueChange={(v) =>
                onFiltersChange({ status: v as Filters["status"] })
              }
            >
              <SelectTrigger id="filter-status" className="h-9 text-sm w-[140px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="active">Activos</SelectItem>
                <SelectItem value="deleted">Eliminados</SelectItem>
                <SelectItem value="all">Todos</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="min-w-[140px]">
            <Label htmlFor="filter-dateFrom" className="text-xs mb-1.5 block">
              <Calendar className="h-3.5 w-3.5 inline mr-1" />
              Desde
            </Label>
            <Input
              id="filter-dateFrom"
              type="date"
              value={filters.dateFrom}
              onChange={(e) => onFiltersChange({ dateFrom: e.target.value })}
              className="h-9 text-sm"
            />
          </div>

          <div className="min-w-[140px]">
            <Label htmlFor="filter-dateTo" className="text-xs mb-1.5 block">
              <Calendar className="h-3.5 w-3.5 inline mr-1" />
              Hasta
            </Label>
            <Input
              id="filter-dateTo"
              type="date"
              value={filters.dateTo}
              onChange={(e) => onFiltersChange({ dateTo: e.target.value })}
              className="h-9 text-sm"
            />
          </div>

          {activeCount > 0 && (
            <div className="flex items-end pb-0.5">
              <Button
                variant="ghost"
                size="sm"
                onClick={onClear}
                className="h-9 gap-1.5 text-muted-foreground hover:text-foreground"
              >
                <X className="h-3.5 w-3.5" />
                Limpiar filtros
              </Button>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

function PersonFormDialog({
  open,
  person,
  departments,
  submitting,
  onSubmit,
  onClose,
}: {
  open: boolean;
  person: Person | null;
  departments: Department[];
  submitting: boolean;
  onSubmit: (data: PersonInput) => Promise<void>;
  onClose: () => void;
}) {
  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors },
  } = useForm<PersonInput>({
    resolver: zodResolver(personSchema),
    defaultValues: {
      name: "",
      ip: "",
      mac: "",
      computerName: "",
      departmentId: "",
    },
  });

  const isEditing = !!person;

  useEffect(() => {
    if (open) {
      if (person) {
        reset({
          name: person.name,
          ip: person.ip ?? "",
          mac: person.mac ?? "",
          computerName: person.computerName,
          departmentId: person.departmentId,
        });
      } else {
        reset({
          name: "",
          ip: "",
          mac: "",
          computerName: "",
          departmentId: "",
        });
      }
    }
  }, [open, person, reset]);

  const macValue = watch("mac");

  const handleMacChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value.replace(/[^0-9A-Fa-f]/g, "");
    if (value.length > 12) value = value.slice(0, 12);
    const parts = value.match(/.{1,2}/g);
    const formatted = parts ? parts.join(":") : "";
    setValue("mac", formatted, { shouldValidate: true });
  };

  const onFormSubmit = async (data: PersonInput) => {
    await onSubmit(data);
  };

  const departmentValue = watch("departmentId");

  return (
    <DialogContent className="sm:max-w-[500px]">
      <DialogHeader>
        <DialogTitle className="flex items-center gap-2">
          {isEditing ? (
            <>
              <Pencil className="h-5 w-5" />
              Editar Persona
            </>
          ) : (
            <>
              <Plus className="h-5 w-5" />
              Nueva Persona
            </>
          )}
        </DialogTitle>
        <DialogDescription>
          {isEditing
            ? "Modifique los datos de la persona asignada."
            : "Complete los datos para registrar una nueva persona."}
        </DialogDescription>
      </DialogHeader>

      <form onSubmit={handleSubmit(onFormSubmit)} className="flex flex-col gap-4">
        <div className="space-y-1.5">
          <Label htmlFor="person-name">
            Nombre <span className="text-destructive">*</span>
          </Label>
          <Input
            id="person-name"
            placeholder="Ej: Juan Pérez"
            {...register("name")}
            className={cn(errors.name && "border-destructive")}
          />
          {errors.name && (
            <p className="text-xs text-destructive">{errors.name.message}</p>
          )}
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="person-ip">Dirección IP</Label>
          <Input
            id="person-ip"
            placeholder="Ej: 192.168.1.100"
            {...register("ip")}
            className={cn(errors.ip && "border-destructive")}
          />
          {errors.ip && (
            <p className="text-xs text-destructive">{errors.ip.message}</p>
          )}
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="person-mac">Dirección MAC</Label>
          <Input
            id="person-mac"
            placeholder="Ej: AA:BB:CC:DD:EE:FF"
            value={macValue}
            onChange={handleMacChange}
            className={cn(errors.mac && "border-destructive", "font-mono")}
            maxLength={17}
          />
          {errors.mac && (
            <p className="text-xs text-destructive">{errors.mac.message}</p>
          )}
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="person-computer">
            Nombre del Equipo <span className="text-destructive">*</span>
          </Label>
          <Input
            id="person-computer"
            placeholder="Ej: DESKTOP-001"
            {...register("computerName")}
            className={cn(errors.computerName && "border-destructive")}
          />
          {errors.computerName && (
            <p className="text-xs text-destructive">
              {errors.computerName.message}
            </p>
          )}
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="person-department">
            Departamento <span className="text-destructive">*</span>
          </Label>
          <Select
            value={departmentValue}
            onValueChange={(v) =>
              setValue("departmentId", v, { shouldValidate: true })
            }
          >
            <SelectTrigger
              id="person-department"
              className={cn(errors.departmentId && "border-destructive")}
            >
              <SelectValue placeholder="Seleccionar departamento" />
            </SelectTrigger>
            <SelectContent>
              {departments.map((dep) => (
                <SelectItem key={dep.id} value={dep.id}>
                  {dep.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {errors.departmentId && (
            <p className="text-xs text-destructive">
              {errors.departmentId.message}
            </p>
          )}
        </div>

        <DialogFooter className="mt-2">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            disabled={submitting}
          >
            Cancelar
          </Button>
          <Button type="submit" disabled={submitting} className="gap-2">
            {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
            {isEditing ? "Guardar cambios" : "Crear persona"}
          </Button>
        </DialogFooter>
      </form>
    </DialogContent>
  );
}

function EmptyState({
  hasFilters,
  onClear,
}: {
  hasFilters: boolean;
  onClear: () => void;
}) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 text-muted-foreground">
      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted">
        {hasFilters ? (
          <Search className="h-6 w-6" />
        ) : (
          <Users className="h-6 w-6" />
        )}
      </div>
      <div className="text-center">
        <p className="text-sm font-medium">
          {hasFilters
            ? "No se encontraron resultados"
            : "No hay personas registradas"}
        </p>
        <p className="text-xs mt-1">
          {hasFilters
            ? "Intente ajustar los filtros de búsqueda."
            : 'Haga clic en "Nueva Persona" para agregar el primer registro.'}
        </p>
      </div>
      {hasFilters && (
        <Button variant="outline" size="sm" onClick={onClear} className="gap-1.5 mt-1">
          <X className="h-3.5 w-3.5" />
          Limpiar filtros
        </Button>
      )}
    </div>
  );
}

function generatePageNumbers(
  current: number,
  total: number
): (number | null)[] {
  if (total <= 7) {
    return Array.from({ length: total }, (_, i) => i + 1);
  }

  const pages: (number | null)[] = [];

  pages.push(1);

  if (current > 3) {
    pages.push(null);
  }

  const start = Math.max(2, current - 1);
  const end = Math.min(total - 1, current + 1);

  for (let i = start; i <= end; i++) {
    pages.push(i);
  }

  if (current < total - 2) {
    pages.push(null);
  }

  pages.push(total);

  return pages;
}
