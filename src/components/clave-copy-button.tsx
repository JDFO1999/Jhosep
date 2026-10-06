"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Copy, CopyCheck, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

export async function fetchClave(personId: string): Promise<string> {
  const res = await fetch(`/api/people/${personId}/clave`);
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error || "No se pudo obtener la clave");
  }
  return data.clave as string;
}

export function ClaveCopyButton({
  personId,
  className,
}: {
  personId: string;
  className?: string;
}) {
  const [state, setState] = useState<"idle" | "loading" | "copied">("idle");

  const handleCopy = async () => {
    if (state === "loading") return;
    setState("loading");
    try {
      const clave = await fetchClave(personId);
      await navigator.clipboard.writeText(clave);
      setState("copied");
      toast.success("Clave copiada al portapapeles");
      setTimeout(() => setState("idle"), 2000);
    } catch (err) {
      setState("idle");
      toast.error(
        err instanceof Error ? err.message : "Error al copiar la clave"
      );
    }
  };

  return (
    <Button
      type="button"
      variant="ghost"
      size="icon"
      className={className ?? "h-7 w-7"}
      onClick={handleCopy}
      disabled={state === "loading"}
      aria-label="Copiar clave"
    >
      {state === "loading" ? (
        <Loader2 className="h-3.5 w-3.5 animate-spin" />
      ) : state === "copied" ? (
        <CopyCheck className="h-3.5 w-3.5 text-emerald-500" />
      ) : (
        <Copy className="h-3.5 w-3.5" />
      )}
    </Button>
  );
}
