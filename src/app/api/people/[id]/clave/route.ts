import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { decryptClave } from "@/lib/clave-crypto";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const currentUser = await prisma.admin.findUnique({
      where: { id: session.userId },
      select: { role: true },
    });

    if (!currentUser || currentUser.role !== "admin") {
      return NextResponse.json({ error: "Acceso denegado" }, { status: 403 });
    }

    const { id } = await params;

    const person = await prisma.person.findUnique({
      where: { id },
      select: { clave: true },
    });

    if (!person) {
      return NextResponse.json(
        { error: "Registro no encontrado" },
        { status: 404 }
      );
    }

    if (!person.clave) {
      return NextResponse.json(
        { error: "No tiene clave guardada" },
        { status: 404 }
      );
    }

    const clave = decryptClave(person.clave);

    if (clave === null) {
      return NextResponse.json(
        {
          error:
            "La clave no es recuperable (hash irreversible). Vuelva a ingresarla para volver a protegerla.",
        },
        { status: 410 }
      );
    }

    return NextResponse.json({ clave });
  } catch (error) {
    console.error("Get clave error:", error);
    return NextResponse.json(
      { error: "Error al obtener la clave" },
      { status: 500 }
    );
  }
}
