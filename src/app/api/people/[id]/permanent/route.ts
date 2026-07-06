import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const { id } = await params;

    const person = await prisma.person.findUnique({ where: { id } });
    if (!person) {
      return NextResponse.json(
        { error: "Registro no encontrado" },
        { status: 404 }
      );
    }

    if (!person.isDeleted) {
      return NextResponse.json(
        { error: "Primero debe enviar el registro a la papelera" },
        { status: 400 }
      );
    }

    await prisma.person.delete({ where: { id } });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Permanent delete error:", error);
    return NextResponse.json(
      { error: "Error al eliminar definitivamente" },
      { status: 500 }
    );
  }
}
