"use client";

import { useState, useEffect, useCallback } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import {
  Plus,
  Pencil,
  Trash2,
  Search,
  Shield,
  User,
  Loader2,
  X,
} from "lucide-react";

import { useAuth } from "@/features/auth/auth-context";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
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
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
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
import { cn } from "@/lib/utils";
import { userSchema, editUserSchema, type UserInput, type EditUserInput } from "@/lib/validations";

interface AdminUser {
  id: string;
  name: string;
  username: string;
  role: string;
  createdAt: string;
}

export default function UsersPage() {
  const { admin } = useAuth();
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<AdminUser | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<AdminUser | null>(null);

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/users");
      if (!res.ok) throw new Error("Error");
      const data = await res.json();
      setUsers(data.users ?? []);
    } catch {
      toast.error("Error al cargar usuarios");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const filtered = users.filter(
    (u) =>
      u.name.toLowerCase().includes(search.toLowerCase()) ||
      u.username.toLowerCase().includes(search.toLowerCase())
  );

  const handleDialogOpen = (user?: AdminUser) => {
    setEditingUser(user ?? null);
    setDialogOpen(true);
  };

  const handleDialogClose = () => {
    setDialogOpen(false);
    setEditingUser(null);
  };

  const handleCreate = async (data: UserInput) => {
    setSubmitting(true);
    try {
      const res = await fetch("/api/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Error al crear");
      }
      toast.success("Usuario creado correctamente");
      handleDialogClose();
      fetchUsers();
    } catch (err: unknown) {
      toast.error(
        err instanceof Error ? err.message : "Error al crear usuario"
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdate = async (data: EditUserInput) => {
    if (!editingUser) return;
    setSubmitting(true);
    try {
      const res = await fetch(`/api/users/${editingUser.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Error al actualizar");
      }
      toast.success("Usuario actualizado correctamente");
      handleDialogClose();
      fetchUsers();
    } catch (err: unknown) {
      toast.error(
        err instanceof Error ? err.message : "Error al actualizar usuario"
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (user: AdminUser) => {
    try {
      const res = await fetch(`/api/users/${user.id}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Error al eliminar");
      }
      toast.success("Usuario eliminado correctamente");
      setDeleteTarget(null);
      fetchUsers();
    } catch (err: unknown) {
      toast.error(
        err instanceof Error ? err.message : "Error al eliminar usuario"
      );
    }
  };

  if (admin?.role !== "admin") {
    return (
      <div className="flex items-center justify-center py-20">
        <p className="text-muted-foreground">Acceso denegado.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <h1 className="text-xl sm:text-2xl font-bold tracking-tight">
          Usuarios
        </h1>
      </div>

      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
          <Input
            placeholder="Buscar por nombre o usuario..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 pr-8"
          />
          {search && (
            <button
              type="button"
              onClick={() => setSearch("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <Button onClick={() => handleDialogOpen()} className="gap-2">
            <Plus className="h-4 w-4" />
            <span className="hidden sm:inline">Nuevo Usuario</span>
          </Button>
          <UserFormDialog
            open={dialogOpen}
            user={editingUser}
            submitting={submitting}
            onSubmit={editingUser ? handleUpdate : handleCreate}
            onClose={handleDialogClose}
          />
        </Dialog>
      </div>

      <div className="rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nombre</TableHead>
              <TableHead>Usuario</TableHead>
              <TableHead>Rol</TableHead>
              <TableHead className="w-[100px]">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <TableRow key={`skel-${i}`}>
                  <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-28" /></TableCell>
                  <TableCell><Skeleton className="h-5 w-16 rounded-full" /></TableCell>
                  <TableCell><Skeleton className="h-8 w-20" /></TableCell>
                </TableRow>
              ))
            ) : filtered.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} className="h-32 text-center text-muted-foreground">
                  {users.length === 0
                    ? 'No hay usuarios. Crea el primero con "Nuevo Usuario".'
                    : "No se encontraron resultados."}
                </TableCell>
              </TableRow>
            ) : (
              filtered.map((user) => (
                <TableRow key={user.id}>
                  <TableCell className="font-medium">{user.name}</TableCell>
                  <TableCell className="text-muted-foreground">
                    @{user.username}
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={user.role === "admin" ? "default" : "secondary"}
                      className="gap-1"
                    >
                      <Shield className="h-3 w-3" />
                      {user.role === "admin" ? "Admin" : "Usuario"}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => handleDialogOpen(user)}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-destructive hover:text-destructive"
                        onClick={() => setDeleteTarget(user)}
                        disabled={user.id === admin?.id}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <AlertDialog
        open={!!deleteTarget}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <Trash2 className="h-5 w-5 text-destructive" />
              ¿Eliminar a {deleteTarget?.name}?
            </AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer. El usuario perderá el acceso al sistema.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteTarget && handleDelete(deleteTarget)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function UserFormDialog({
  open,
  user,
  submitting,
  onSubmit,
  onClose,
}: {
  open: boolean;
  user: AdminUser | null;
  submitting: boolean;
  onSubmit: (data: any) => Promise<void>;
  onClose: () => void;
}) {
  const isEditing = !!user;

  const schema = isEditing ? editUserSchema : userSchema;

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(schema),
    defaultValues: {
      name: "",
      username: "",
      password: "",
      confirmPassword: "",
      role: "user" as const,
    },
  });

  useEffect(() => {
    if (open) {
      if (user) {
        reset({
          name: user.name,
          username: user.username,
          password: "",
          confirmPassword: "",
          role: user.role as "admin" | "user",
        });
      } else {
        reset({
          name: "",
          username: "",
          password: "",
          confirmPassword: "",
          role: "user",
        });
      }
    }
  }, [open, user, reset]);

  const roleValue = watch("role");

  return (
    <DialogContent className="sm:max-w-[450px]">
      <DialogHeader>
        <DialogTitle className="flex items-center gap-2">
          {isEditing ? (
            <>
              <Pencil className="h-5 w-5" />
              Editar Usuario
            </>
          ) : (
            <>
              <Plus className="h-5 w-5" />
              Nuevo Usuario
            </>
          )}
        </DialogTitle>
        <DialogDescription>
          {isEditing
            ? "Modifica los datos del usuario."
            : "Crea un nuevo usuario para acceder al sistema."}
        </DialogDescription>
      </DialogHeader>

      <form
        onSubmit={handleSubmit(onSubmit)}
        className="flex flex-col gap-4"
      >
        <div className="space-y-1.5">
          <Label htmlFor="user-name">
            Nombre <span className="text-destructive">*</span>
          </Label>
          <Input
            id="user-name"
            placeholder="Ej: Juan Pérez"
            {...register("name")}
            className={cn(errors.name && "border-destructive")}
          />
          {errors.name && (
            <p className="text-xs text-destructive">{errors.name.message as string}</p>
          )}
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="user-username">
            Usuario <span className="text-destructive">*</span>
          </Label>
          <Input
            id="user-username"
            placeholder="Ej: jperez"
            {...register("username")}
            className={cn(errors.username && "border-destructive")}
          />
          {errors.username && (
            <p className="text-xs text-destructive">{errors.username.message as string}</p>
          )}
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="user-password">
            Contraseña{" "}
            {isEditing && (
              <span className="text-xs font-normal text-muted-foreground">
                (dejar vacío para no cambiar)
              </span>
            )}
            {!isEditing && <span className="text-destructive">*</span>}
          </Label>
          <Input
            id="user-password"
            type="password"
            placeholder={isEditing ? "Nueva contraseña" : "Mínimo 6 caracteres"}
            {...register("password")}
            className={cn(errors.password && "border-destructive")}
          />
          {errors.password && (
            <p className="text-xs text-destructive">{errors.password.message as string}</p>
          )}
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="user-confirm">
            Confirmar contraseña{" "}
            {!isEditing && <span className="text-destructive">*</span>}
          </Label>
          <Input
            id="user-confirm"
            type="password"
            placeholder="Repite la contraseña"
            {...register("confirmPassword")}
            className={cn(errors.confirmPassword && "border-destructive")}
          />
          {errors.confirmPassword && (
            <p className="text-xs text-destructive">{errors.confirmPassword.message as string}</p>
          )}
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="user-role">
            Rol <span className="text-destructive">*</span>
          </Label>
          <Select
            value={roleValue}
            onValueChange={(v) =>
              setValue("role", v as "admin" | "user", { shouldValidate: true })
            }
          >
            <SelectTrigger id="user-role">
              <SelectValue placeholder="Seleccionar rol" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="admin">Administrador</SelectItem>
              <SelectItem value="user">Usuario</SelectItem>
            </SelectContent>
          </Select>
          {errors.role && (
            <p className="text-xs text-destructive">{errors.role.message as string}</p>
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
            {isEditing ? "Guardar cambios" : "Crear usuario"}
          </Button>
        </DialogFooter>
      </form>
    </DialogContent>
  );
}
