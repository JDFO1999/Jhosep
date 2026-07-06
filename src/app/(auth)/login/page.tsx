"use client";

import { useState, useCallback } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { motion } from "framer-motion";
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
  Wifi,
  Server,
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

type LoginFormValues = {
  username: string;
  password: string;
  rememberMe: boolean;
};
import { cn } from "@/lib/utils";

function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  const cycleTheme = useCallback(() => {
    if (!mounted) return;
    if (theme === "light") {
      setTheme("dark");
    } else if (theme === "dark") {
      setTheme("system");
    } else {
      setTheme("light");
    }
  }, [theme, setTheme, mounted]);

  const ThemeIcon =
    !mounted
      ? Monitor
      : theme === "light"
        ? Sun
        : theme === "dark"
          ? Moon
          : Monitor;

  return (
    <Button
      ref={(node) => {
        if (node) setMounted(true);
      }}
      variant="ghost"
      size="icon"
      onClick={cycleTheme}
      className="absolute right-4 top-4 z-50 text-muted-foreground hover:text-foreground"
      aria-label="Cambiar tema"
    >
      <ThemeIcon className="h-5 w-5" />
    </Button>
  );
}

function BrandPanel() {
  return (
    <div className="relative hidden h-full flex-col items-center justify-center overflow-hidden bg-gradient-to-br from-[#1e3a5f] to-[#0f172a] p-12 md:flex">
      <div className="absolute inset-0 opacity-10">
        <div className="absolute left-10 top-20">
          <Server className="h-32 w-32 text-white" />
        </div>
        <div className="absolute bottom-32 right-10">
          <Wifi className="h-28 w-28 text-white" />
        </div>
        <div className="absolute left-24 top-[60%]">
          <Monitor className="h-20 w-20 text-white" />
        </div>
      </div>

      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(255,255,255,0.05)_0%,transparent_70%)]" />

      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, delay: 0.2 }}
        className="relative z-10 flex flex-col items-center gap-4 text-center"
      >
        <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-white/10 backdrop-blur-sm">
          <Shield className="h-10 w-10 text-white" />
        </div>

        <h1 className="text-4xl font-bold tracking-tight text-white">
          SISTEMAS GESTOR
        </h1>

        <p className="max-w-xs text-lg text-white/70">
          Administración de Equipos
        </p>

        <Separator className="mt-4 w-16 bg-white/20" />

        <p className="mt-4 max-w-sm text-sm leading-relaxed text-white/50">
          Gestión centralizada de inventario, equipos y departamentos para el
          área de sistemas.
        </p>
      </motion.div>

      <div className="absolute bottom-8 flex items-center gap-2 text-xs text-white/30">
        <Shield className="h-3 w-3" />
        <span>&copy; {new Date().getFullYear()} Sistemas Gestor v1.0</span>
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
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolver: zodResolver(loginSchema) as any,
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
        err instanceof Error ? err.message : "Error inesperado al iniciar sesión";

      setServerError(message);
      toast.error(message, {
        description: "Verifica tus credenciales e intenta nuevamente",
      });
    }
  };

  return (
    <div className="relative flex min-h-screen flex-col md:flex-row">
      <div className="hidden md:block md:w-[60%]">
        <BrandPanel />
      </div>

      <div className="flex w-full flex-1 items-center justify-center px-4 py-8 md:w-[40%] md:px-8">
        <ThemeToggle />

        <motion.div
          initial={{ opacity: 0, x: 20, scale: 0.97 }}
          animate={{ opacity: 1, x: 0, scale: 1 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
          className="w-full max-w-md"
        >
          <div className="mb-8 flex flex-col items-center gap-2 md:hidden">
            <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-[#1e3a5f]">
              <Shield className="h-7 w-7 text-white" />
            </div>
            <h2 className="text-xl font-bold">SISTEMAS GESTOR</h2>
            <p className="text-sm text-muted-foreground">
              Administración de Equipos
            </p>
          </div>

          <Card className="border-0 shadow-xl shadow-black/5 ring-1 ring-border dark:shadow-none">
            <CardHeader className="space-y-1 px-4 pb-2 pt-6 sm:px-6">
              <CardTitle className="text-2xl">Iniciar Sesión</CardTitle>
              <CardDescription>
                Ingresa tus credenciales para acceder al sistema
              </CardDescription>
            </CardHeader>

            <CardContent className="px-4 sm:px-6">
              {serverError && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  className="mb-4 flex items-start gap-3 rounded-md bg-destructive/10 p-3 text-sm text-destructive"
                >
                  <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                  <span>{serverError}</span>
                </motion.div>
              )}

              <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="username">Usuario</Label>
                  <div className="relative">
                    <User className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      id="username"
                      placeholder="Tu nombre de usuario"
                      className={cn(
                        "pl-10",
                        errors.username &&
                          "border-destructive focus-visible:ring-destructive"
                      )}
                      autoComplete="username"
                      {...register("username")}
                    />
                  </div>
                  {errors.username && (
                    <p className="flex items-center gap-1.5 text-xs text-destructive">
                      <AlertCircle className="h-3.5 w-3.5" />
                      {errors.username.message}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password">Contraseña</Label>
                  <div className="relative">
                    <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      placeholder="Tu contraseña"
                      className={cn(
                        "pl-10 pr-10",
                        errors.password &&
                          "border-destructive focus-visible:ring-destructive"
                      )}
                      autoComplete="current-password"
                      {...register("password")}
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="absolute right-1 top-1/2 h-8 w-8 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                      onClick={() => setShowPassword((prev) => !prev)}
                      aria-label={
                        showPassword ? "Ocultar contraseña" : "Mostrar contraseña"
                      }
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
                      <AlertCircle className="h-3.5 w-3.5" />
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
                    className="cursor-pointer text-sm font-normal"
                  >
                    Recordar sesión
                  </Label>
                </div>

                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full"
                  size="lg"
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

            <CardFooter className="justify-center px-4 pb-6 pt-0 sm:px-6">
              <p className="text-center text-xs text-muted-foreground">
                Acceso restringido al personal de sistemas autorizado.
              </p>
            </CardFooter>
          </Card>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6 }}
            className="mt-6 text-center text-xs text-muted-foreground md:hidden"
          >
            &copy; {new Date().getFullYear()} Sistemas Gestor &mdash;
            Administración de Equipos
          </motion.p>
        </motion.div>
      </div>
    </div>
  );
}
