"use client";

import { useState, useEffect, useMemo } from "react";
import { motion } from "framer-motion";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";
import {
  Users,
  Building2,
  Monitor,
  Trash2,
  Activity,
  TrendingUp,
  Clock,
  Loader2,
  AlertCircle,
  Database,
} from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/table";

type DepartmentStat = {
  id: string;
  name: string;
  count: number;
};

type RecentPerson = {
  id: string;
  name: string;
  ip: string | null;
  computerName: string;
  createdAt: string;
  department: { id: string; name: string };
};

type DashboardStats = {
  totalPeople: number;
  activePeople: number;
  deletedPeople: number;
  totalDepartments: number;
  totalComputers: number;
  departmentsWithCount: DepartmentStat[];
  recentPeople: RecentPerson[];
};

const DEPARTMENT_COLORS = [
  "#3b82f6",
  "#8b5cf6",
  "#06b6d4",
  "#10b981",
  "#f59e0b",
  "#ef4444",
  "#ec4899",
  "#6366f1",
  "#14b8a6",
  "#f97316",
];

const CARD_VARIANTS = {
  hidden: { opacity: 0, y: 24 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: {
      delay: i * 0.08,
      duration: 0.4,
      ease: [0.25, 0.46, 0.45, 0.94] as [number, number, number, number],
    },
  }),
};

function getDepartmentColor(index: number): string {
  return DEPARTMENT_COLORS[index % DEPARTMENT_COLORS.length];
}

function getDepartmentByName(
  name: string,
  departments: DepartmentStat[],
): string {
  const idx = departments.findIndex((d) => d.name === name);
  return getDepartmentColor(idx >= 0 ? idx : 0);
}

function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString("es-CO", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

const ACCENT_BAR_COLORS = [
  "bg-blue-500",
  "bg-violet-500",
  "bg-cyan-500",
  "bg-emerald-500",
  "bg-amber-500",
];

const ICON_BG_COLORS = [
  "bg-blue-500/10",
  "bg-violet-500/10",
  "bg-cyan-500/10",
  "bg-emerald-500/10",
  "bg-amber-500/10",
  "bg-rose-500/10",
];

const ICON_FG_COLORS = [
  "text-blue-500",
  "text-violet-500",
  "text-cyan-500",
  "text-emerald-500",
  "text-amber-500",
  "text-rose-500",
];

function StatCardSkeleton() {
  return (
    <Card className="overflow-hidden">
      <div className="h-1 w-full bg-muted" />
      <CardContent className="p-6">
        <div className="flex items-start justify-between">
          <div className="space-y-3 flex-1">
            <Skeleton className="h-4 w-28" />
            <Skeleton className="h-8 w-16" />
            <Skeleton className="h-3 w-20" />
          </div>
          <Skeleton className="h-10 w-10 rounded-full" />
        </div>
      </CardContent>
    </Card>
  );
}

function ChartSkeleton() {
  return (
    <Card>
      <CardHeader>
        <Skeleton className="h-5 w-48" />
      </CardHeader>
      <CardContent>
        <Skeleton className="h-[300px] w-full rounded-lg" />
      </CardContent>
    </Card>
  );
}

function TableSkeleton() {
  return (
    <Card>
      <CardHeader>
        <Skeleton className="h-5 w-40" />
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-10 w-full" />
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

function LoadingState() {
  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
        {Array.from({ length: 5 }).map((_, i) => (
          <StatCardSkeleton key={i} />
        ))}
      </div>
      <div className="grid gap-6 lg:grid-cols-7">
        <div className="lg:col-span-4">
          <ChartSkeleton />
        </div>
        <div className="lg:col-span-3">
          <TableSkeleton />
        </div>
      </div>
    </div>
  );
}

function ErrorState({ message }: { message: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-destructive/10">
        <AlertCircle className="h-8 w-8 text-destructive" />
      </div>
      <h3 className="mt-4 text-lg font-semibold">Error al cargar datos</h3>
      <p className="mt-1 max-w-sm text-sm text-muted-foreground">{message}</p>
    </div>
  );
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-muted">
        <Database className="h-8 w-8 text-muted-foreground" />
      </div>
      <h3 className="mt-4 text-lg font-semibold">Sin datos disponibles</h3>
      <p className="mt-1 max-w-sm text-sm text-muted-foreground">
        No hay registros en el sistema. Agrega personas y departamentos para
        comenzar.
      </p>
    </div>
  );
}

function NewThisMonthBadge({ count }: { count: number }) {
  if (count <= 0) return null;
  return (
    <div className="mt-2.5 inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2 py-0.5 text-xs font-medium text-emerald-500">
      <TrendingUp className="h-3 w-3" />
      +{count} este mes
    </div>
  );
}

function StatCard({
  title,
  value,
  icon: Icon,
  index,
  extra,
}: {
  title: string;
  value: number;
  icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
  index: number;
  extra?: React.ReactNode;
}) {
  return (
    <motion.div
      custom={index}
      variants={CARD_VARIANTS}
      initial="hidden"
      animate="visible"
    >
      <Card className="group overflow-hidden transition-shadow duration-200 hover:shadow-md">
        <div
          className={`h-1 w-full ${ACCENT_BAR_COLORS[index % ACCENT_BAR_COLORS.length]}`}
        />
        <CardContent className="p-6">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">
                {title}
              </p>
              <p className="mt-2 text-3xl font-bold tracking-tight">
                {value.toLocaleString("es-CO")}
              </p>
              {extra}
            </div>
            <div
              className={`flex h-10 w-10 items-center justify-center rounded-full ${ICON_BG_COLORS[index % ICON_BG_COLORS.length]}`}
            >
              <Icon
                className={`h-5 w-5 ${ICON_FG_COLORS[index % ICON_FG_COLORS.length]}`}
              />
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

function CustomTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: Array<{ value: number; dataKey: string }>;
  label?: string;
}) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg border bg-background px-3 py-2 shadow-md">
      <p className="text-xs font-medium text-muted-foreground">{label}</p>
      <p className="text-sm font-bold">
        {payload[0].value.toLocaleString("es-CO")} personas
      </p>
    </div>
  );
}

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function fetchStats() {
      try {
        setLoading(true);
        setError(null);

        const res = await fetch("/api/dashboard/stats");

        if (!res.ok) {
          const body = await res.json().catch(() => null);
          throw new Error(
            body?.error ?? `Error ${res.status}: ${res.statusText}`,
          );
        }

        const data: DashboardStats = await res.json();

        if (!cancelled) {
          setStats(data);
        }
      } catch (err) {
        if (!cancelled) {
          setError(
            err instanceof Error
              ? err.message
              : "Error desconocido al obtener estadísticas",
          );
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    fetchStats();

    return () => {
      cancelled = true;
    };
  }, []);

  const newThisMonth = useMemo(() => {
    if (!stats) return 0;
    const now = new Date();
    const thisMonth = now.getMonth();
    const thisYear = now.getFullYear();

    return stats.recentPeople.filter((person) => {
      const created = new Date(person.createdAt);
      return (
        created.getMonth() === thisMonth &&
        created.getFullYear() === thisYear
      );
    }).length;
  }, [stats]);

  if (loading) return <LoadingState />;
  if (error) return <ErrorState message={error} />;
  if (!stats) return <ErrorState message="No se pudieron cargar los datos." />;

  const isEmpty =
    stats.totalPeople === 0 &&
    stats.totalDepartments === 0 &&
    stats.totalComputers === 0;

  if (isEmpty) return <EmptyState />;

  return (
    <div className="space-y-6">
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Bienvenido al panel de control de Sistemas Gestor.
        </p>
      </motion.div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
        <StatCard
          title="Total Personas"
          value={stats.totalPeople}
          icon={Users}
          index={0}
          extra={<NewThisMonthBadge count={newThisMonth} />}
        />
        <StatCard
          title="Departamentos"
          value={stats.totalDepartments}
          icon={Building2}
          index={1}
        />
        <StatCard
          title="Equipos"
          value={stats.totalComputers}
          icon={Monitor}
          index={2}
        />
        <StatCard
          title="Registros Activos"
          value={stats.activePeople}
          icon={Activity}
          index={3}
        />
        <StatCard
          title="Registros Eliminados"
          value={stats.deletedPeople}
          icon={Trash2}
          index={4}
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-7">
        <motion.div
          className="lg:col-span-4"
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] as [number, number, number, number] }}
        >
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building2 className="h-5 w-5 text-muted-foreground" />
                Personas por Departamento
              </CardTitle>
            </CardHeader>
            <CardContent>
              {stats.departmentsWithCount.length === 0 ? (
                <div className="flex h-[300px] items-center justify-center">
                  <p className="text-sm text-muted-foreground">
                    No hay departamentos registrados.
                  </p>
                </div>
              ) : (
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart
                    data={stats.departmentsWithCount}
                    margin={{ top: 4, right: 4, left: -16, bottom: 4 }}
                  >
                    <CartesianGrid
                      strokeDasharray="3 3"
                      className="stroke-muted"
                      vertical={false}
                    />
                    <XAxis
                      dataKey="name"
                      tick={{ fontSize: 12 }}
                      tickLine={false}
                      axisLine={false}
                      className="text-muted-foreground"
                      angle={-20}
                      textAnchor="end"
                      height={60}
                      interval={0}
                    />
                    <YAxis
                      tick={{ fontSize: 12 }}
                      tickLine={false}
                      axisLine={false}
                      className="text-muted-foreground"
                      allowDecimals={false}
                    />
                    <RechartsTooltip
                      content={<CustomTooltip />}
                      cursor={{ fill: "hsl(var(--muted))", opacity: 0.25 }}
                    />
                    <Bar dataKey="count" radius={[4, 4, 0, 0]} maxBarSize={48}>
                      {stats.departmentsWithCount.map((_, idx) => (
                        <Cell
                          key={`cell-${idx}`}
                          fill={getDepartmentColor(idx)}
                          className="transition-opacity duration-200 hover:opacity-80"
                        />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          className="lg:col-span-3"
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5, duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] }}
        >
          <Card className="h-full">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5 text-muted-foreground" />
                Últimos Registros
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {stats.recentPeople.length === 0 ? (
                <div className="flex h-[300px] items-center justify-center px-6">
                  <p className="text-sm text-muted-foreground">
                    No hay registros recientes.
                  </p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Nombre</TableHead>
                        <TableHead>Departamento</TableHead>
                        <TableHead className="hidden sm:table-cell">
                          Equipo
                        </TableHead>
                        <TableHead className="hidden md:table-cell">
                          Fecha
                        </TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {stats.recentPeople.map((person) => {
                        const deptColor = getDepartmentByName(
                          person.department.name,
                          stats.departmentsWithCount,
                        );
                        return (
                          <TableRow key={person.id}>
                            <TableCell className="font-medium">
                              <div className="flex items-center gap-2">
                                <span
                                  className="h-2 w-2 shrink-0 rounded-full"
                                  style={{ backgroundColor: deptColor }}
                                />
                                {person.name}
                              </div>
                            </TableCell>
                            <TableCell>
                              <Badge
                                variant="outline"
                                style={{
                                  borderColor: `${deptColor}40`,
                                  color: deptColor,
                                  backgroundColor: `${deptColor}10`,
                                }}
                              >
                                {person.department.name}
                              </Badge>
                            </TableCell>
                            <TableCell className="hidden sm:table-cell text-muted-foreground">
                              {person.computerName}
                            </TableCell>
                            <TableCell className="hidden md:table-cell text-muted-foreground text-sm">
                              {formatDate(person.createdAt)}
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}
