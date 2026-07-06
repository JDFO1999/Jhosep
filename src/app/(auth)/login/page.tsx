"use client";

import { useState, useCallback, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { motion, AnimatePresence } from "framer-motion";
import { useTheme } from "next-themes";
import { toast } from "sonner";
import {
  User,
  Lock,
  Eye,
  EyeOff,
  AlertCircle,
  Sun,
  Moon,
  Loader2,
  Shield,
  Monitor,
  Server,
  Wifi,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { useAuth } from "@/features/auth/auth-context";
import { loginSchema } from "@/lib/validations";
import { cn } from "@/lib/utils";

type LoginFormValues = {
  username: string;
  password: string;
  rememberMe: boolean;
};

function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => { setMounted(true); }, []);

  if (!mounted) {
    return (
      <button className="absolute right-4 top-4 z-50 inline-flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white backdrop-blur-sm">
        <span className="sr-only">Cambiar tema</span>
      </button>
    );
  }

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
      className="absolute right-4 top-4 z-50 rounded-full bg-white/10 text-white backdrop-blur-sm hover:bg-white/20"
      aria-label="Cambiar tema"
    >
      {theme === "dark" ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
    </Button>
  );
}

function BrandPanel() {
  return (
    <div className="relative hidden h-full flex-col items-center justify-center overflow-hidden bg-[#0f172a] p-12 md:flex">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(30,58,95,0.6)_0%,transparent_50%),radial-gradient(ellipse_at_bottom_left,rgba(15,23,42,0.9)_0%,transparent_50%)]" />
      <div className="absolute inset-0 bg-[url('/alkosto_bg.png')] bg-cover bg-center opacity-20 mix-blend-overlay" />

      <div className="absolute inset-0 opacity-[0.07]">
        <div className="absolute left-12 top-24">
          <Server className="h-36 w-36 text-white" />
        </div>
        <div className="absolute bottom-36 right-12">
          <Wifi className="h-32 w-32 text-white" />
        </div>
        <div className="absolute left-28 bottom-[50%]">
          <Monitor className="h-24 w-24 text-white" />
        </div>
      </div>

      <motion.div
        initial={{ opacity: 0, y: -30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 1, delay: 0.3 }}
        className="relative z-10 flex flex-col items-center gap-5 text-center"
      >
        <div className="flex h-22 w-22 items-center justify-center rounded-2xl bg-white/10 ring-1 ring-white/20 backdrop-blur-md">
          <Shield className="h-12 w-12 text-[#f59e0b]" />
        </div>

        <div>
          <h1 className="text-5xl font-extrabold tracking-tight text-white">
            SISTEMAS
          </h1>
          <h1 className="text-5xl font-extrabold tracking-tight text-[#f59e0b]">
            GESTOR
          </h1>
        </div>

        <p className="text-lg text-white/70">
          Administracion de Equipos
        </p>

        <Separator className="mt-2 w-20 bg-white/20" />

        <p className="max-w-xs text-sm leading-relaxed text-white/40">
          Gestion centralizada de inventario, equipos y departamentos
          para el area de sistemas.
        </p>
      </motion.div>

      <div className="absolute bottom-8 flex items-center gap-2 text-xs text-white/25">
        <Shield className="h-3 w-3" />
        <span>&copy; 2026 Sistemas Gestor v1.0</span>
      </div>
    </div>
  );
}

export default function LoginPage() {
  const [showPassword, setShowPassword] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const { login } = useAuth();

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema) as never,
    defaultValues: {
      username: "",
      password: "",
      rememberMe: false,
    },
  });

  const rememberMe = watch("rememberMe");

  const onSubmit = async (data: LoginFormValues) => {
    setServerError(null);
    try {
      await login(data.username, data.password);
    } catch (err) {
      const message =
        err instanceof Error
          ? err.message
          : "Error inesperado al iniciar sesion";
      setServerError(message);
      toast.error(message);
    }
  };

  return (
    <div className="relative flex min-h-screen flex-col md:flex-row">
      <div className="hidden md:block md:w-[55%]">
        <BrandPanel />
      </div>

      <div className="flex w-full flex-1 items-center justify-center bg-background px-4 py-8 md:w-[45%] md:px-8 dark:bg-[#0f172a]">
        <ThemeToggle />

        <motion.div
          initial={{ opacity: 0, x: 30, scale: 0.97 }}
          animate={{ opacity: 1, x: 0, scale: 1 }}
          transition={{ duration: 0.6, ease: [0.25, 0.46, 0.45, 0.94] }}
          className="w-full max-w-md"
        >
          <div className="mb-8 flex flex-col items-center gap-2 md:hidden">
            <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-[#0f172a]">
              <Shield className="h-7 w-7 text-[#f59e0b]" />
            </div>
            <h2 className="text-xl font-bold">SISTEMAS GESTOR</h2>
            <p className="text-sm text-muted-foreground">
              Administracion de Equipos
            </p>
          </div>

          <Card className="border-muted/60 shadow-2xl shadow-black/[0.03] dark:shadow-black/20">
            <CardHeader className="space-y-1 px-6 pb-2 pt-8">
              <CardTitle className="text-2xl tracking-tight">
                Iniciar Sesion
              </CardTitle>
              <CardDescription>
                Ingresa tus credenciales para acceder al sistema
              </CardDescription>
            </CardHeader>

            <CardContent className="px-6">
              <AnimatePresence mode="wait">
                {serverError && (
                  <motion.div
                    key="error"
                    initial={{ opacity: 0, height: 0, marginBottom: 0 }}
                    animate={{ opacity: 1, height: "auto", marginBottom: 16 }}
                    exit={{ opacity: 0, height: 0, marginBottom: 0 }}
                    className="flex items-start gap-3 rounded-lg bg-destructive/10 p-3 text-sm text-destructive overflow-hidden"
                  >
                    <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                    <span>{serverError}</span>
                  </motion.div>
                )}
              </AnimatePresence>

              <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
                <div className="space-y-2">
                  <Label htmlFor="username">Usuario</Label>
                  <div className="relative">
                    <User className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      id="username"
                      placeholder="Ingresa tu usuario"
                      className={cn(
                        "pl-10 h-11 rounded-lg",
                        errors.username && "border-destructive focus-visible:ring-destructive"
                      )}
                      autoComplete="username"
                      {...register("username")}
                    />
                  </div>
                  {errors.username && (
                    <p className="flex items-center gap-1.5 text-xs text-destructive">
                      <AlertCircle className="h-3 w-3" />
                      {errors.username.message}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password">Contrasena</Label>
                  <div className="relative">
                    <Lock className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      placeholder="Ingresa tu contrasena"
                      className={cn(
                        "pl-10 pr-10 h-11 rounded-lg",
                        errors.password && "border-destructive focus-visible:ring-destructive"
                      )}
                      autoComplete="current-password"
                      {...register("password")}
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="absolute right-1.5 top-1/2 h-8 w-8 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                      onClick={() => setShowPassword((prev) => !prev)}
                      tabIndex={-1}
                    >
                      {showPassword ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                  {errors.password && (
                    <p className="flex items-center gap-1.5 text-xs text-destructive">
                      <AlertCircle className="h-3 w-3" />
                      {errors.password.message}
                    </p>
                  )}
                </div>

                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="rememberMe"
                    checked={rememberMe}
                    onCheckedChange={(checked) =>
                      setValue("rememberMe", checked === true)
                    }
                  />
                  <Label
                    htmlFor="rememberMe"
                    className="cursor-pointer text-sm font-normal text-muted-foreground"
                  >
                    Recordar sesion
                  </Label>
                </div>

                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full h-11 rounded-lg text-base font-semibold"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      INGRESANDO...
                    </>
                  ) : (
                    "INGRESAR"
                  )}
                </Button>
              </form>
            </CardContent>

            <CardFooter className="justify-center px-6 pb-8 pt-2">
              <p className="text-center text-xs text-muted-foreground">
                Acceso restringido al personal de sistemas autorizado.
              </p>
            </CardFooter>
          </Card>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.7 }}
            className="mt-6 text-center text-xs text-muted-foreground md:hidden"
          >
            &copy; 2026 Sistemas Gestor &mdash;
            Administracion de Equipos
          </motion.p>
        </motion.div>
      </div>
    </div>
  );
}
